# Diversified OS

Diversified OS, also called Diversified Employee Workspace, is an internal operations platform for Diversified Companies. It gives employees, managers, admins, and leadership one web workspace for daily execution, SOPs, forms, requests, work orders, files, reports, inventory, time tracking, documents, automations, and system administration.

This repo is the internal OS. It is not a CRM, customer portal, ServiceTitan clone, call center system, ad platform, lead automation product, or Revenue Engine. Revenue Engine and external marketing/lead workflows are future scope and must not be described as current app capabilities.

## Current Architecture

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- PostgreSQL through [lib/db.ts](lib/db.ts)
- NocoDB for database/admin visibility
- n8n webhook targets for workflow automation events
- Local/server file storage through `FILE_STORAGE_DIR`
- AI SDK provider routes for assistant features
- PM2 and nginx for production server deployment

Strict architecture boundary:

- No Supabase.
- No Prisma.
- No ORM.
- PostgreSQL is the source of truth.
- NocoDB is an admin/database visibility layer, not the application backend.
- Next.js API routes/server logic are the application control layer.

## Current Modules

Production-connected or substantially wired modules:

- Dashboard: PostgreSQL-backed operational summaries.
- Tasks: list/create/update/detail with role checks and audit logging.
- Projection Calendar: task scheduling plus independent `calendar_blocks` persistence.
- Forms Center: form submission persistence with Forms -> Requests conversion.
- Requests: request queue, create/update/status workflow, notifications, automation events, audit logs.
- Work Orders: list/create/update/detail, notifications, automation events, audit logs.
- Employees: directory and detail API/UI.
- Inventory: list/detail/update with low-stock automation and audit logging.
- SOPs: PostgreSQL-backed API with legacy seed fallback only where needed.
- Files: upload/list/download with local storage, linked records, automation events, audit logs.
- Documents/eSign: document records, signatures, document audit trail, shared audit logging.
- Timeclock: clock in/out backed by PostgreSQL.
- Timesheets: create/update status flow with submit/approve/reject audit events.
- Reports: backend reports API, CSV export, and UI consumption.
- Search: backend search API used by the topbar.
- Automations: durable `automation_events` logging, n8n dispatch, retry/status UI.
- Admin/Settings: persisted system settings, readiness reporting, environment status, audit views.
- AI Chat: streaming assistant route using configured AI provider keys.

## Production Status

The app is no longer a static walkthrough shell. Core internal OS modules use PostgreSQL-backed API routes and server-side role checks. Recent production closure work added:

- work order create/update behavior
- files upload/download and metadata persistence
- document/eSign foundations
- RBAC helper enforcement across important routes
- reports/search APIs
- automation event logging and n8n webhook dispatch
- calendar block persistence
- cross-module audit logging

Known production partials:

- Auth/session exists, but final production identity provider hardening and full RBAC review remain important.
- Calendar supports persisted blocks and task-linked scheduling, but full drag/resize UX is intentionally limited to implemented behavior.
- Files use local/server storage unless a future storage backend is explicitly designed.
- Documents/eSign are internal workflow foundations, not a full external signing vendor replacement.
- n8n workflow execution depends on configured webhook env vars and external n8n workflow definitions.
- NocoDB is operational visibility/admin tooling; it does not replace application routes.
- Some legacy Revenue Engine-style types/data remain archived for future design only and are not active internal OS capability.

## Setup

Install dependencies:

```bash
npm install
```

Create local environment variables in `.env.local` or the production process environment. Do not commit secrets.

Required core env vars:

```bash
DATABASE_URL=postgres://user:password@host:5432/database
SESSION_SECRET=replace-with-strong-secret
FILE_STORAGE_DIR=/var/lib/diversified-os/files
NEXT_PUBLIC_APP_URL=https://app.example.com
APP_URL=https://app.example.com
```

AI provider env vars, at least one when AI chat is enabled:

```bash
DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
```

n8n automation env vars:

```bash
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/diversified-os
N8N_WEBHOOK_SECRET=replace-with-shared-secret
N8N_BASE_URL=https://n8n.example.com
```

Optional event-specific n8n webhook env vars:

```bash
N8N_FORM_SUBMITTED_WEBHOOK=...
N8N_REQUEST_CREATED_WEBHOOK=...
N8N_TASK_ASSIGNED_WEBHOOK=...
N8N_TASK_OVERDUE_WEBHOOK=...
N8N_LOW_INVENTORY_WEBHOOK=...
N8N_WEEKLY_SUMMARY_WEBHOOK=...
N8N_WORK_ORDER_CREATED_WEBHOOK=...
N8N_WORK_ORDER_UPDATED_WEBHOOK=...
N8N_TIMESHEET_SUBMITTED_WEBHOOK=...
N8N_FILE_UPLOADED_WEBHOOK=...
N8N_CALENDAR_BLOCK_WEBHOOK=...
```

## Database Migrations

Apply migrations against PostgreSQL in order. Inspect each script before applying in production.

```bash
psql "$DATABASE_URL" -f scripts/migrate-settings.sql
psql "$DATABASE_URL" -f scripts/migrate-work-orders-production.sql
psql "$DATABASE_URL" -f scripts/migrate-documents-production.sql
psql "$DATABASE_URL" -f scripts/migrate-files-production.sql
psql "$DATABASE_URL" -f scripts/migrate-internal-os-capabilities.sql
```

Production closure migrations include:

- [scripts/migrate-work-orders-production.sql](scripts/migrate-work-orders-production.sql)
- [scripts/migrate-documents-production.sql](scripts/migrate-documents-production.sql)
- [scripts/migrate-files-production.sql](scripts/migrate-files-production.sql)
- [scripts/migrate-internal-os-capabilities.sql](scripts/migrate-internal-os-capabilities.sql)
- [scripts/migrate-settings.sql](scripts/migrate-settings.sql)

`migrate-internal-os-capabilities.sql` adds or extends files, documents, automation events, audit logs, calendar blocks, and search/supporting indexes. The app also includes defensive `CREATE TABLE IF NOT EXISTS` checks in some production APIs for safer incremental deployment, but migration scripts should still be the operational source for database rollout.

## Local Development

Run the app locally:

```bash
npm run dev
```

Open the local Next.js URL printed by the dev server. The app expects PostgreSQL via `DATABASE_URL`; it is not designed to run as a Supabase or Prisma project.

Useful local checks:

```bash
npm run build
npm run lint
```

## Build

Production build:

```bash
npm run build
```

Start built app:

```bash
npm run start
```

## Deployment

Production deployment is server-oriented:

- Build with `npm run build`.
- Run with PM2 using [ecosystem.config.js](ecosystem.config.js).
- Put nginx in front of the Node process.
- Keep PostgreSQL, NocoDB, and n8n managed as separate services.
- Store secrets in process environment or server secret management, not in Git.

Scripts exist for server deployment/auto-heal workflows under [scripts](scripts). Review scripts before using them in a new environment.

## Audit And Automation

Audit logs:

- Shared helper: [lib/audit-log.ts](lib/audit-log.ts)
- Read API: `GET /api/audit-logs`
- Access: Admin/Leadership
- Filters: `module`, `action`, `entity_type`, `actor_user_id`, `from`, `to`

Automation events:

- Shared helper: [lib/automation-events.ts](lib/automation-events.ts)
- Event log API: `GET/POST /api/automation-events`
- Status API: `GET /api/automations/status`
- Retry API: `POST /api/automations/retry`

Workflow events are durable in PostgreSQL before n8n dispatch. Missing webhook configuration is recorded as event state instead of being silently ignored.

## Scope Boundary

Current internal OS scope:

- employee execution
- tasks and projections
- requests/forms
- work orders
- SOPs
- inventory visibility
- files/documents
- reports/search
- timeclock/timesheets
- settings/admin
- audit and automation infrastructure

Future scope, not current internal OS capability:

- Revenue Engine
- CRM/lead pipeline
- ServiceTitan replacement
- ad reporting and attribution
- external customer portal
- call center/SMS automation
- marketing profitability system

Do not add UI, docs, routes, or claims that present those future lanes as live internal OS features unless they are explicitly scoped and implemented with PostgreSQL-backed routes.

## Remaining Production Blockers

Exact next blockers:

- Verify migrations are applied on the live PostgreSQL database.
- Validate production auth/session secret handling and role mappings.
- Confirm PM2/nginx production environment variables match this README.
- Configure n8n webhook URLs and verify outbound workflow delivery.
- Confirm file storage directory permissions and backup policy.
- Add deeper tests for audit logging, calendar block writes, and workflow event dispatch.
- Finish any remaining Admin employee/role management gaps before relying on it as the authority for user administration.
