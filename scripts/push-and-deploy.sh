#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_SCRIPT="${APP_DIR}/scripts/deploy-now.sh"
AUTO_HEAL_SCRIPT="${APP_DIR}/scripts/auto-heal-deploy.sh"
APP_PUBLIC_URL="${APP_PUBLIC_URL:-https://app.snrglabs.com}"
SAFE_STAGE_PATHS=(
  app
  components
  lib
  types
  hooks
  scripts
  docs
  middleware.ts
  package.json
  package-lock.json
  next.config.mjs
  tsconfig.json
)

REJECTED_FILES=()
STAGED_FILES=()
BUILD_RESULT="not run"
COMMIT_HASH="not created"
DEPLOY_RESULT="not run"

usage() {
  echo "Usage: scripts/push-and-deploy.sh \"commit message\" [branch]"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1"
    exit 1
  fi
}

trim_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s\n' "$value"
}

print_list() {
  local label="$1"
  shift

  echo "$label"
  if [[ $# -eq 0 ]]; then
    echo "  (none)"
    return
  fi

  local item
  for item in "$@"; do
    echo "  - $item"
  done
}

print_summary() {
  echo
  echo "Deploy summary"
  print_list "Files staged:" "${STAGED_FILES[@]}"
  print_list "Files rejected:" "${REJECTED_FILES[@]}"
  echo "Build result: ${BUILD_RESULT}"
  echo "Commit hash: ${COMMIT_HASH}"
  echo "Deploy result: ${DEPLOY_RESULT}"
}

fail_with_summary() {
  echo "ERROR: $1"
  print_summary
  exit 1
}

is_placeholder_commit_message() {
  local normalized
  normalized="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | xargs)"
  [[ "$normalized" == "your message" || "$normalized" == "update" || "$normalized" == "fix" || "$normalized" == "test" ]]
}

is_suspicious_path() {
  local path="$1"
  local lower_path="${path,,}"

  if [[ "$path" == ".env" || "$path" == ".env.local" || "$path" == .env.* ]]; then
    return 0
  fi

  if [[ "$path" == ".vercel" || "$path" == .vercel/* ]]; then
    return 0
  fi

  if [[ "$path" == "node_modules" || "$path" == node_modules/* ]]; then
    return 0
  fi

  if [[ "$path" == ".next" || "$path" == .next/* ]]; then
    return 0
  fi

  if [[ "$path" == /tmp/* || "$path" == *.log || "$path" == PGPASSWORD* ]]; then
    return 0
  fi

  if [[ "$lower_path" == *psql* || "$lower_path" == *diversified_os* || "$lower_path" == *postgres* || "$lower_path" == *database* ]]; then
    return 0
  fi

  if [[ "$lower_path" == *password* || "$lower_path" == *passwd* || "$lower_path" == *secret* || "$lower_path" == *token* ]]; then
    return 0
  fi

  if [[ "$path" == *" "* ]] && [[ "$path" =~ (--|&&|\|\||\||;|\(|\)|=) ]]; then
    return 0
  fi

  return 1
}

path_is_stageable() {
  local path="$1"
  if [[ -e "$path" || -d "$path" ]]; then
    return 0
  fi

  git ls-files --error-unmatch -- "$path" >/dev/null 2>&1
}

collect_staged_files() {
  STAGED_FILES=()

  local file
  while IFS= read -r file; do
    [[ -n "$file" ]] || continue
    STAGED_FILES+=("$file")
  done < <(git diff --cached --name-only)
}

check_worktree_for_suspicious_files() {
  local line status index_status worktree_status path

  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    status="${line:0:2}"
    index_status="${status:0:1}"
    worktree_status="${status:1:1}"
    path="$(trim_quotes "${line:3}")"

    if ! is_suspicious_path "$path"; then
      continue
    fi

    if [[ "$index_status" == "D" && "$worktree_status" == " " ]]; then
      continue
    fi

    REJECTED_FILES+=("$path")
  done < <(git status --short)

  if [[ ${#REJECTED_FILES[@]} -gt 0 ]]; then
    fail_with_summary "Suspicious files are present in the worktree. Remove them before deploying."
  fi
}

check_staged_files_safe() {
  local status path

  while IFS=$'\t' read -r status path; do
    [[ -n "$status" && -n "$path" ]] || continue

    if ! is_suspicious_path "$path"; then
      continue
    fi

    if [[ "$status" == "D" ]]; then
      continue
    fi

    REJECTED_FILES+=("$path")
  done < <(git diff --cached --name-status)

  if [[ ${#REJECTED_FILES[@]} -gt 0 ]]; then
    fail_with_summary "Suspicious files were staged. Unstage them before committing."
  fi
}

stage_safe_paths() {
  local path

  for path in "${SAFE_STAGE_PATHS[@]}"; do
    if path_is_stageable "$path"; then
      git add -A -- "$path"
    fi
  done
}

run_build_check() {
  echo "Running production build before commit"
  if npm run build; then
    BUILD_RESULT="passed"
    return
  fi

  BUILD_RESULT="failed"
  fail_with_summary "Build failed. Commit, push, and deploy were stopped."
}

quick_health_ok() {
  local local_dashboard_status
  local domain_dashboard_status
  local css_path
  local local_css_status
  local domain_css_status

  dashboard_status_ok() {
    local status="$1"
    [[ "$status" == "200" || "$status" == "307" ]]
  }

  local_dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/dashboard || true)"
  domain_dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' "${APP_PUBLIC_URL}/dashboard" || true)"

  if ! dashboard_status_ok "$local_dashboard_status" || ! dashboard_status_ok "$domain_dashboard_status"; then
    echo "Health quick-check: local_dashboard=${local_dashboard_status} domain_dashboard=${domain_dashboard_status}"
    return 1
  fi

  css_path="$(curl -fsSL http://127.0.0.1:3000/dashboard | grep -o '/_next[^" ]*\.css' | head -n1 || true)"
  if [[ -z "$css_path" ]]; then
    echo "Health quick-check: could not extract css asset path"
    return 1
  fi

  local_css_status="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000${css_path}" || true)"
  domain_css_status="$(curl -sS -o /dev/null -w '%{http_code}' "${APP_PUBLIC_URL}${css_path}" || true)"

  echo "Health quick-check: local_css=${local_css_status} domain_css=${domain_css_status}"
  [[ "$local_css_status" == "200" && "$domain_css_status" == "200" ]]
}

remote_differs_from_local() {
  local branch="$1"
  git fetch --prune origin "$branch" >/dev/null 2>&1
  local local_sha
  local remote_sha
  local_sha="$(git rev-parse HEAD)"
  remote_sha="$(git rev-parse "origin/${branch}")"
  [[ "$local_sha" != "$remote_sha" ]]
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

COMMIT_MESSAGE="$1"
BRANCH="${2:-main}"
DID_COMMIT=0

cd "$APP_DIR"

require_cmd git
require_cmd curl
require_cmd npm

if is_placeholder_commit_message "$COMMIT_MESSAGE"; then
  fail_with_summary "Refusing placeholder commit message. Use a specific description."
fi

echo "Current git status"
git status --short

check_worktree_for_suspicious_files
stage_safe_paths
collect_staged_files
check_staged_files_safe
run_build_check

if git diff --cached --quiet; then
  echo "No staged changes to commit; skipping commit step"
else
  git commit -m "$COMMIT_MESSAGE"
  DID_COMMIT=1
  COMMIT_HASH="$(git rev-parse HEAD)"
fi

if git push origin "$BRANCH"; then
  DEPLOY_RESULT="push succeeded"
else
  DEPLOY_RESULT="push failed"
  fail_with_summary "git push failed."
fi

if [[ "$DID_COMMIT" -eq 1 ]]; then
  echo "New commit pushed from this host. Running full deploy pipeline"
  if bash "$DEPLOY_SCRIPT"; then
    DEPLOY_RESULT="deploy succeeded"
  else
    DEPLOY_RESULT="deploy failed"
    fail_with_summary "Deploy pipeline failed."
  fi
  echo "Push and deploy completed successfully"
  print_summary
  exit 0
fi

if remote_differs_from_local "$BRANCH"; then
  echo "Remote differs from local after push attempt. Running auto-heal fetch/deploy pipeline"
  if bash "$AUTO_HEAL_SCRIPT" --ignore-disable; then
    DEPLOY_RESULT="auto-heal deploy succeeded"
  else
    DEPLOY_RESULT="auto-heal deploy failed"
    fail_with_summary "Auto-heal deploy failed."
  fi
  echo "Push and deploy completed successfully"
  print_summary
  exit 0
fi

if quick_health_ok; then
  echo "Repo is up-to-date and health is green. Skipping deploy"
  echo "Push and deploy completed successfully"
  DEPLOY_RESULT="skipped (repo up-to-date, health green)"
  print_summary
  exit 0
fi

echo "Repo is up-to-date but health is not green. Running heal pipeline"
if bash "$AUTO_HEAL_SCRIPT" --ignore-disable; then
  DEPLOY_RESULT="auto-heal deploy succeeded"
else
  DEPLOY_RESULT="auto-heal deploy failed"
  fail_with_summary "Auto-heal deploy failed."
fi

echo "Push and deploy completed successfully"
print_summary
