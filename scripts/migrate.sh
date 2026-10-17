#!/usr/bin/env bash
# Apply base schema + incremental migrations to $DATABASE_URL (idempotent scripts).
# Usage: DATABASE_URL=postgres://... bash scripts/migrate.sh
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
export PGOPTIONS="-c client_min_messages=warning"
cd "$(dirname "$0")/.."
FILES=(
  db/000-base-schema.sql
  scripts/migrate-settings.sql
  scripts/migrate-files-production.sql
  scripts/migrate-requests-files.sql
  scripts/migrate-documents-production.sql
  scripts/migrate-work-orders-production.sql
  scripts/migrate-timeclock.sql
  scripts/migrate-sop-engine.sql
  scripts/migrate-internal-os-capabilities.sql
)
for f in "${FILES[@]}"; do
  echo "==> $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "Migrations complete."
