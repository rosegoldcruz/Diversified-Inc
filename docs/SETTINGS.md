# Settings Control Center

The Settings area is an internal operations control center. It exposes persisted application settings and read-only production readiness information. It does not edit infrastructure secrets and does not pretend to control PM2, nginx, PostgreSQL, NocoDB, or n8n directly.

## Routes

- `/settings`: settings hub
- `/settings/system`: system readiness, runtime status, and validated persisted controls
- `/settings/notifications`: persisted notification preferences
- `/settings/billing`: internal read-only business context, not an external billing integration

## Persisted Settings

Table: `system_settings`

Writable keys are defined in [lib/settings-config.ts](../lib/settings-config.ts):

- `notification_preferences`
- `client_visible_modules`
- `automation_mode`
- `maintenance_banner`
- `app_display_labels`
- `demo_visibility_flags` database key retained for compatibility with earlier deployments

Settings are updated through `PATCH /api/settings` with validation and audit logging.

## Audit Logging

Settings writes now log to both:

- `system_audit_logs`, retained for the original settings module history
- `audit_logs`, the cross-module production audit trail

Cross-module audit logs are readable through `GET /api/audit-logs` by Admin/Leadership users.

## Read-Only Status Reporting

The settings UI may report:

- PostgreSQL health and latency
- expected table readiness
- environment variable configured/missing status
- n8n readiness and webhook configuration state
- security/auth/RBAC readiness notes
- deployment/runtime notes
- integration health summaries

The UI must not expose secret values.

## Required Environment Variables

Core:

- `DATABASE_URL`
- `SESSION_SECRET` or equivalent auth secret
- `FILE_STORAGE_DIR`
- `APP_URL` or `NEXT_PUBLIC_APP_URL`

AI provider, when AI chat is enabled:

- `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`

n8n:

- `N8N_WEBHOOK_URL` for generic dispatch, or event-specific webhook vars
- `N8N_WEBHOOK_SECRET` recommended for signed dispatch
- `N8N_BASE_URL` for readiness/integration visibility

Event-specific n8n vars currently recognized:

- `N8N_FORM_SUBMITTED_WEBHOOK`
- `N8N_REQUEST_CREATED_WEBHOOK`
- `N8N_TASK_ASSIGNED_WEBHOOK`
- `N8N_TASK_OVERDUE_WEBHOOK`
- `N8N_LOW_INVENTORY_WEBHOOK`
- `N8N_WEEKLY_SUMMARY_WEBHOOK`
- `N8N_WORK_ORDER_CREATED_WEBHOOK`
- `N8N_WORK_ORDER_UPDATED_WEBHOOK`
- `N8N_TIMESHEET_SUBMITTED_WEBHOOK`
- `N8N_FILE_UPLOADED_WEBHOOK`
- `N8N_CALENDAR_BLOCK_WEBHOOK`

## Architecture Boundary

- No Supabase.
- No Prisma.
- No ORM.
- PostgreSQL is accessed through [lib/db.ts](../lib/db.ts).
- NocoDB is admin/database visibility only.
- n8n is an automation target, not the app backend.
