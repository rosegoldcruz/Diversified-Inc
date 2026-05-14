#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="${APP_NAME:-diversified-os}"
APP_PUBLIC_URL="${APP_PUBLIC_URL:-https://app.snrglabs.com}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/diversified-auto-heal.lock}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-3}"
MAX_FAILURES="${MAX_FAILURES:-3}"
FAIL_COUNT_FILE="${FAIL_COUNT_FILE:-/tmp/diversified-auto-heal.failcount}"
DISABLE_FILE="${DISABLE_FILE:-/tmp/diversified-auto-heal.disabled}"

FORCE_DEPLOY=0
IGNORE_DISABLE=0
SKIP_FETCH=0

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

usage() {
  cat <<'EOF'
Usage: auto-heal-deploy.sh [options]

Options:
  --force-deploy    Run full deploy pipeline even if no new commit is detected.
  --ignore-disable  Run even if auto-heal is currently disabled due to failures.
  --skip-fetch      Skip git fetch/pull checks (useful for local/manual deploys).
  --help            Show this help message.
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force-deploy)
        FORCE_DEPLOY=1
        ;;
      --ignore-disable)
        IGNORE_DISABLE=1
        ;;
      --skip-fetch)
        SKIP_FETCH=1
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        log "ERROR: unknown option: $1"
        usage
        exit 1
        ;;
    esac
    shift
  done
}

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: required command not found: $1"
    exit 1
  fi
}

login_css_candidates() {
  curl -fsSL "http://127.0.0.1:3000/login" | grep -o '/_next[^" ]*\.css[^" ]*'
}

http_status() {
  curl -sS -o /dev/null -w '%{http_code}' "$1"
}

dashboard_status_ok() {
  local status="$1"
  [[ "$status" == "200" || "$status" == "307" ]]
}

health_check() {
  local quiet="${1:-0}"
  local css_candidates
  css_candidates="$(login_css_candidates || true)"
  local css_path=""
  local local_css_status=""
  local domain_css_status=""
  local found_working_css=0

  if [[ -z "$css_candidates" ]]; then
    if [[ "$quiet" -ne 1 ]]; then
      log "WARN: unable to extract login CSS asset path"
    fi
    return 1
  fi

  local local_login_status
  local domain_login_status

  while IFS= read -r css_path; do
    [[ -z "$css_path" ]] && continue
    local_css_status="$(http_status "http://127.0.0.1:3000${css_path}" || true)"
    domain_css_status="$(http_status "${APP_PUBLIC_URL}${css_path}" || true)"
    if [[ "$local_css_status" == "200" && "$domain_css_status" == "200" ]]; then
      found_working_css=1
      break
    fi
  done <<< "$css_candidates"

  local_login_status="$(http_status "http://127.0.0.1:3000/login" || true)"
  domain_login_status="$(http_status "${APP_PUBLIC_URL}/login" || true)"

  log "Health check statuses: local_login=${local_login_status} domain_login=${domain_login_status} local_css=${local_css_status} domain_css=${domain_css_status}"

  dashboard_status_ok "$local_login_status" && \
    dashboard_status_ok "$domain_login_status" && \
    [[ "$found_working_css" -eq 1 ]]
}

read_fail_count() {
  if [[ -f "$FAIL_COUNT_FILE" ]]; then
    cat "$FAIL_COUNT_FILE"
  else
    echo 0
  fi
}

write_fail_count() {
  printf '%s\n' "$1" > "$FAIL_COUNT_FILE"
}

clear_fail_state() {
  rm -f "$FAIL_COUNT_FILE" "$DISABLE_FILE"
}

record_failure() {
  local reason="$1"
  local count
  count="$(read_fail_count)"
  count=$((count + 1))
  write_fail_count "$count"

  log "Failure count incremented to ${count}/${MAX_FAILURES}: ${reason}"

  if (( count >= MAX_FAILURES )); then
    printf '%s\n' "$(date '+%Y-%m-%d %H:%M:%S') disabled after ${count} consecutive failures" > "$DISABLE_FILE"
    log "ALERT_AUTO_HEAL_DISABLED threshold=${MAX_FAILURES} reason=${reason} marker_file=${DISABLE_FILE}"
  fi
}

check_disabled() {
  if [[ -f "$DISABLE_FILE" && "$IGNORE_DISABLE" -ne 1 ]]; then
    log "Auto-heal is disabled due to repeated failures. Remove ${DISABLE_FILE} or run with --ignore-disable for manual recovery."
    log "ALERT_AUTO_HEAL_SKIPPED_DISABLED marker_file=${DISABLE_FILE}"
    exit 0
  fi
}

wait_for_health() {
  local timeout="$1"
  local interval="$2"
  local elapsed=0

  while (( elapsed < timeout )); do
    if health_check 1; then
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  return 1
}

ensure_pm2_running() {
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    pm2 start ecosystem.config.js --only "$APP_NAME" --update-env
  fi
}

deploy_once() {
  cd "$APP_DIR"

  if [[ "$SKIP_FETCH" -ne 1 ]]; then
    log "Fetching latest origin/${BRANCH}"
    git fetch --prune origin "$BRANCH"

    local current_sha
    local remote_sha
    current_sha="$(git rev-parse HEAD)"
    remote_sha="$(git rev-parse "origin/${BRANCH}")"

    if [[ "$current_sha" != "$remote_sha" ]]; then
      log "New commit detected (${current_sha:0:8} -> ${remote_sha:0:8}). Pulling fast-forward update"
      git pull --ff-only origin "$BRANCH"
    else
      log "No new commit detected during deploy step"
    fi
  else
    log "Skipping git fetch/pull checks (--skip-fetch)"
  fi

  if [[ ! -d node_modules || ! -d node_modules/next ]]; then
    log "node_modules missing or incomplete; running npm ci"
    npm ci
  fi

  log "Building production bundle"
  npm run build

  log "Restarting PM2 app: ${APP_NAME}"
  ensure_pm2_running
}

heal_once() {
  cd "$APP_DIR"

  log "Attempting restart-only heal"
  ensure_pm2_running

  if wait_for_health "$HEALTH_TIMEOUT" "$HEALTH_INTERVAL"; then
    log "Restart-only heal succeeded"
    return 0
  fi

  log "Restart-only heal did not pass health checks; running full build + restart"
  deploy_once
  wait_for_health "$HEALTH_TIMEOUT" "$HEALTH_INTERVAL"
}

remote_has_new_commit() {
  if [[ "$SKIP_FETCH" -eq 1 ]]; then
    return 1
  fi

  git fetch --prune origin "$BRANCH"
  local current_sha
  local remote_sha
  current_sha="$(git rev-parse HEAD)"
  remote_sha="$(git rev-parse "origin/${BRANCH}")"
  [[ "$current_sha" != "$remote_sha" ]]
}

main() {
  parse_args "$@"

  ensure_command git
  ensure_command npm
  ensure_command pm2
  ensure_command curl

  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "Another auto-heal run is already in progress; exiting"
    exit 0
  fi

  check_disabled

  log "Auto-heal run starting"
  cd "$APP_DIR"

  if [[ "$FORCE_DEPLOY" -eq 1 ]]; then
    log "Forced deploy requested (--force-deploy)"
    deploy_once
    if wait_for_health "$HEALTH_TIMEOUT" "$HEALTH_INTERVAL"; then
      clear_fail_state
      log "Forced deploy succeeded"
      exit 0
    fi
    record_failure "forced deploy failed health checks"
    log "ERROR: forced deploy completed but health checks failed"
    exit 1
  fi

  if remote_has_new_commit; then
    log "New commit detected on origin/${BRANCH}; running deploy"
    deploy_once
    if wait_for_health "$HEALTH_TIMEOUT" "$HEALTH_INTERVAL"; then
      clear_fail_state
      log "Auto-heal deploy succeeded"
      exit 0
    fi
    record_failure "deploy after new commit failed health checks"
    log "ERROR: deploy completed but health checks failed"
    exit 1
  fi

  if health_check; then
    clear_fail_state
    log "App already healthy and no new commit; nothing to do"
    exit 0
  fi

  if heal_once; then
    clear_fail_state
    log "Auto-heal recovery succeeded"
    exit 0
  fi

  record_failure "recovery pipeline failed"
  log "ERROR: auto-heal recovery failed"
  exit 1
}

main "$@"
