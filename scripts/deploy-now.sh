#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTO_HEAL_SCRIPT="${APP_DIR}/scripts/auto-heal-deploy.sh"
BRANCH="${BRANCH:-main}"

if [[ ! -x "$AUTO_HEAL_SCRIPT" ]]; then
  chmod +x "$AUTO_HEAL_SCRIPT"
fi

cd "$APP_DIR"

# Manual deploy path: always run full deploy, ignore disable gate,
# and skip remote fetch by default because current working tree is the source.
bash "$AUTO_HEAL_SCRIPT" --force-deploy --ignore-disable --skip-fetch
