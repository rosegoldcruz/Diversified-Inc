# Production Closure Status

This file replaces the older walkthrough-oriented checklist. It is kept as a production closure reference for Diversified OS internal operations only.

## Scope

Diversified OS is the internal employee workspace and operations system. Current closure work is limited to:

- dashboard
- tasks
- projection calendar and calendar blocks
- forms and requests
- work orders
- employees
- inventory
- SOPs
- files
- documents/eSign foundations
- reports/search
- timeclock/timesheets
- automations/n8n hooks
- settings/admin
- auth/RBAC/audit foundations

Out of scope for current closure:

- Revenue Engine
- CRM or lead pipeline
- ServiceTitan replacement
- call center/SMS automation
- ad reporting/attribution
- external customer portal
- marketing profitability platform

## Architecture Rules

- No Supabase.
- No Prisma.
- No ORM.
- PostgreSQL is the source of truth through [lib/db.ts](lib/db.ts).
- NocoDB is an admin/database visibility layer.
- n8n receives server-side automation webhooks from durable `automation_events` records.
- PM2/nginx handle production process/proxy deployment.

## Production Closure Work Completed

- Forms backend and Forms -> Requests persistence.
- Work order create/update API behavior.
- File upload/download and metadata persistence.
- Documents/eSign internal foundations.
- Settings persistence and readiness reporting.
- Server-side RBAC helper enforcement across important API routes.
- Reports API, export API, and global search API.
- Durable automation event logging, n8n dispatch, status, and retry UI.
- Calendar block persistence independent from tasks.
- Cross-module audit log helper and Admin/Leadership audit API.

## Remaining Blockers

- Confirm all migration scripts have been applied on production PostgreSQL.
- Validate production auth/session secret handling and role mapping end to end.
- Confirm all Admin employee/role management paths use persisted data and enforce authorization.
- Configure n8n webhook URLs and verify outbound workflow delivery.
- Confirm file storage directory permissions, backup policy, and restore procedure.
- Add automated test coverage for calendar block persistence, audit logs, reports, search, and automation dispatch.
- Review mobile/PWA behavior before treating mobile install/offline behavior as production complete.

## Migration Order

Apply database migrations in this order unless a later production migration explicitly supersedes it:

```bash
psql "$DATABASE_URL" -f scripts/migrate-settings.sql
psql "$DATABASE_URL" -f scripts/migrate-work-orders-production.sql
psql "$DATABASE_URL" -f scripts/migrate-documents-production.sql
psql "$DATABASE_URL" -f scripts/migrate-files-production.sql
psql "$DATABASE_URL" -f scripts/migrate-internal-os-capabilities.sql
```

## Verification Gate

Before a production handoff:

- Run VS Code/TypeScript diagnostics.
- Run `npm run build`.
- Confirm `/api/settings/system-health` reports expected tables.
- Confirm `/api/calendar-blocks` returns persisted records.
- Confirm `/api/audit-logs` is readable by Admin/Leadership only.
- Confirm core mutations create audit records.
- Confirm no active documentation presents Revenue Engine as current functionality.
- Confirm no active documentation or runtime path presents Supabase, Prisma, or an ORM as current architecture.
