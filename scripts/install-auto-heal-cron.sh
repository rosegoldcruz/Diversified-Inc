#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTO_HEAL_SCRIPT="${APP_DIR}/scripts/auto-heal-deploy.sh"
SCHEDULE="${SCHEDULE:-*/10 * * * *}"
LOG_FILE="${LOG_FILE:-/var/log/diversified-auto-heal.log}"

if [[ ! -x "$AUTO_HEAL_SCRIPT" ]]; then
  chmod +x "$AUTO_HEAL_SCRIPT"
fi

CRON_LINE="${SCHEDULE} sleep 15 && cd ${APP_DIR} && ${AUTO_HEAL_SCRIPT} >> ${LOG_FILE} 2>&1"

TMP_CRON="$(mktemp)"
trap 'rm -f "$TMP_CRON"' EXIT

crontab -l 2>/dev/null | grep -v "scripts/auto-heal-deploy.sh" > "$TMP_CRON" || true
echo "$CRON_LINE" >> "$TMP_CRON"
crontab "$TMP_CRON"

echo "Installed auto-heal cron entry:"
echo "$CRON_LINE"
echo ""
echo "Current crontab:"
crontab -l
