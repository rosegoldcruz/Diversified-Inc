#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_SCRIPT="${APP_DIR}/scripts/deploy-now.sh"

usage() {
  echo "Usage: scripts/push-and-deploy.sh \"commit message\" [branch]"
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

COMMIT_MESSAGE="$1"
BRANCH="${2:-main}"

cd "$APP_DIR"

git add .

if git diff --cached --quiet; then
  echo "No staged changes to commit; skipping commit step"
else
  git commit -m "$COMMIT_MESSAGE"
fi

git push origin "$BRANCH"

bash "$DEPLOY_SCRIPT"

echo "Push and deploy completed successfully"
