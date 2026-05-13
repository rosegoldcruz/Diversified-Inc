# Settings Control Center

## Purpose

The Settings area is now a truthful internal operations control center.
It only exposes controls that either:

- persist in PostgreSQL (`system_settings`), or
- report real runtime/backend state safely.

No settings UI in this module writes infrastructure secrets or pretends to control server runtime directly.

## Routes

- `/settings`: Settings hub for system/admin configuration categories.
- `/settings/system`: Backend/system readiness and safe persisted controls.
- `/settings/notifications`: Persisted internal notification preferences.
- `/settings/billing`: Read-only internal-only placeholder.

## Persisted Settings (PostgreSQL)

Table: `system_settings`

Supported writable keys:

- `notification_preferences`
- `client_visible_modules`
- `automation_mode`
- `maintenance_banner`
- `app_display_labels`
- `demo_visibility_flags`

These are updated via `PATCH /api/settings` with validation.

## Audit Logging

Table: `system_audit_logs`

Current behavior:

- Settings write actions append audit entries.
- `GET /api/settings/audit-logs` returns recent entries.

Future extension:

- Add API/action-level audit events for tasks/requests/work-orders.
- Add actor identity after auth/session is implemented.

## Read-Only vs Writable

Writable from UI:

- notification preference matrix
- automation mode (`disabled | test | live`)
- client walkthrough module visibility

Read-only status reporting:

- PostgreSQL health and latency
- table readiness checklist
- env var configured/missing checklist
- n8n readiness and webhook configuration state
- security/auth/RBAC readiness notes
- deployment/runtime notes (version/environment/targets)
- integration cards

Not editable from UI:

- secrets (`DATABASE_URL`, API keys, webhook secrets)
- PM2/nginx controls
- server backup scheduler management

## Required Environment Variables

Database:

- `DATABASE_URL`

AI provider:

- `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`

n8n:

- `N8N_BASE_URL`
- `N8N_WEBHOOK_SECRET` (recommended)
- `N8N_FORM_SUBMITTED_WEBHOOK` (optional)
- `N8N_REQUEST_CREATED_WEBHOOK` (optional)
- `N8N_TASK_ASSIGNED_WEBHOOK` (optional)
- `N8N_TASK_OVERDUE_WEBHOOK` (optional)
- `N8N_LOW_INVENTORY_WEBHOOK` (optional)
- `N8N_WEEKLY_SUMMARY_WEBHOOK` (optional)

Auth/session readiness:

- `SESSION_SECRET` or `NEXTAUTH_SECRET`

App URL:

- `APP_URL` or `NEXT_PUBLIC_APP_URL`

Optional file storage:

- `STORAGE_BUCKET` or `S3_BUCKET` or `BLOB_READ_WRITE_TOKEN`

## n8n Integration Plan

Current implementation:

- reports env/config readiness only
- manual test endpoint (`POST /api/settings/test-n8n`) performs safe connectivity check
- does not fire business workflow webhooks on page load

Next:

- add signed server-side event dispatchers for selected workflow events
- enforce automation mode gates before outbound webhook dispatch

## Backup Strategy

Included helper script:

- `scripts/backup-postgres.sh`

Usage:

```bash
DATABASE_URL=postgres://... BACKUP_DIR=./backups ./scripts/backup-postgres.sh
```

Recommended production setup:

- run via cron/systemd timer on VPS
- upload backups to off-site storage
- track retention policy outside the web app UI

## Security and RBAC Notes

This page does not claim full auth/RBAC completion.

Current status:

- readiness reporting only
- partial input validation for settings APIs

Future required work:

- enforce authenticated access on settings routes and APIs
- role-based authorization for write endpoints
- actor identity in audit logs

## Client Walkthrough Visibility Rules

`client_visible_modules` supports:

- `visible`
- `hidden`
- `internal`

Use this to hide incomplete modules from client walkthroughs until features are production-ready.

Current implementation stores visibility state in PostgreSQL and exposes it in System Settings UI.
Sidebar/mobile navigation gating can be connected in a follow-up patch once role-aware filtering is added.
