#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_SCRIPT="${APP_DIR}/scripts/deploy-now.sh"
AUTO_HEAL_SCRIPT="${APP_DIR}/scripts/auto-heal-deploy.sh"
APP_PUBLIC_URL="${APP_PUBLIC_URL:-https://app.snrglabs.com}"

usage() {
  echo "Usage: scripts/push-and-deploy.sh \"commit message\" [branch]"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1"
    exit 1
  fi
}

quick_health_ok() {
  local local_dashboard_status
  local domain_dashboard_status
  local css_path
  local local_css_status
  local domain_css_status

  local_dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/dashboard || true)"
  domain_dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' "${APP_PUBLIC_URL}/dashboard" || true)"

  if [[ "$local_dashboard_status" != "200" || "$domain_dashboard_status" != "200" ]]; then
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

git add .

if git diff --cached --quiet; then
  echo "No staged changes to commit; skipping commit step"
else
  if [[ "$COMMIT_MESSAGE" == "your message" ]]; then
    echo "WARN: commit message is still placeholder text"
  fi
  git commit -m "$COMMIT_MESSAGE"
  DID_COMMIT=1
fi

git push origin "$BRANCH"

if [[ "$DID_COMMIT" -eq 1 ]]; then
  echo "New commit pushed from this host. Running full deploy pipeline"
  bash "$DEPLOY_SCRIPT"
  echo "Push and deploy completed successfully"
  exit 0
fi

if remote_differs_from_local "$BRANCH"; then
  echo "Remote differs from local after push attempt. Running auto-heal fetch/deploy pipeline"
  bash "$AUTO_HEAL_SCRIPT" --ignore-disable
  echo "Push and deploy completed successfully"
  exit 0
fi

if quick_health_ok; then
  echo "Repo is up-to-date and health is green. Skipping deploy"
  echo "Push and deploy completed successfully"
  exit 0
fi

echo "Repo is up-to-date but health is not green. Running heal pipeline"
bash "$AUTO_HEAL_SCRIPT" --ignore-disable

echo "Push and deploy completed successfully"
