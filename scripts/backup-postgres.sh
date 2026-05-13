#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

OUTPUT_FILE="$BACKUP_DIR/diversified-os-$TIMESTAMP.sql.gz"

echo "Creating PostgreSQL backup at $OUTPUT_FILE"
pg_dump "$DATABASE_URL" | gzip > "$OUTPUT_FILE"

echo "Backup complete"