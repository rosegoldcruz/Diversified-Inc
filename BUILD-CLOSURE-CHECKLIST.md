# BUILD CLOSURE CHECKLIST

Purpose: Close the current Diversified OS build to a client-walkthrough-safe and production-launch-realistic internal operations platform.

Scope rule: This checklist prioritizes internal OS modules only. CRM, ServiceTitan replacement/integration, lead routing/automation, SMS/calling automation, attribution, and Revenue Engine features are intentionally separated and must not block internal OS closure.

Status legend:

- Current Status: `Built / Partial / Missing / Fake-Demo / Out-of-Scope`
- Demo Risk: `DEMO READY / DEMO WITH CAUTION / DO NOT DEMO / INTERNAL ONLY`

---

## P0 — Must Fix Before Client Walkthrough

### 1) [ ] Auth / Session / RBAC Foundation

- Module: Auth / Roles / Access Control
- Exact file paths:
  - `app/layout.tsx`
  - `components/layout/dashboard-shell.tsx`
  - `components/layout/sidebar.tsx`
  - `app/api/**/*.ts`
  - `lib/db.ts`
- Current status: Missing
- Required fix:
  - Implement login/logout/session middleware and server-side session checks.
  - Add role model (`Leadership`, `Admin`, `Manager`, `Employee`) and guard page access + action-level access.
  - Enforce RBAC in API routes (not just UI visibility).
- Acceptance criteria:
  - Unauthenticated users are redirected to login.
  - Role-specific sidebar/page visibility is enforced.
  - Unauthorized API calls return `401/403` consistently.
  - At least one protected create/update action is validated by role in API.
- Demo risk: DO NOT DEMO

### 2) [ ] Forms Backend + Submission Persistence

- Module: Forms Center
- Exact file paths:
  - `app/forms/page.tsx`
  - `app/api/requests/route.ts`
  - `types/workspace.ts`
  - `app/lib/mockData.ts`
- Current status: Fake-Demo
- Required fix:
  - Add real forms API (`/api/forms` + submissions route) backed by PostgreSQL.
  - Persist submissions and connect Forms -> Requests conversion.
  - Replace local-only submission records with DB-backed list/detail.
- Acceptance criteria:
  - Form submission survives refresh/restart.
  - Submission appears in Requests queue with linked form metadata.
  - At least one form type (Time Off or Purchase Request) fully works end-to-end.
  - Error/empty/loading states are shown on form list + submissions.
- Demo risk: DO NOT DEMO

### 3) [ ] Admin Persistence (Remove Hardcoded Demo Admin)

- Module: Admin
- Exact file paths:
  - `app/admin/page.tsx`
  - `app/api/employees/route.ts`
  - `app/api/employees/[id]/route.ts`
  - `app/api/tasks/route.ts` (for category/status references if used)
- Current status: Fake-Demo
- Required fix:
  - Replace hardcoded employee array with DB reads.
  - Enable add/edit/disable employee flows with API writes.
  - Replace disabled role controls with real role updates.
  - Keep destructive operations gated by role and confirmation.
- Acceptance criteria:
  - Admin page reads from DB only.
  - Add/edit/disable employee actions persist and reflect immediately.
  - Role update persists and affects access behavior.
  - No “demo mode disabled” controls remain for core admin paths.
- Demo risk: DO NOT DEMO

### 4) [ ] Settings Cleanup (Kill Misleading External Backend Surfaces)

- Module: Settings
- Exact file paths:
  - `app/settings/page.tsx`
  - `app/settings/notifications/page.tsx`
  - `app/settings/system/page.tsx`
  - `app/settings/billing/page.tsx`
- Current status: Fake-Demo / Contradictory
- Required fix:
  - Remove or hide settings pages that call external `NEXT_PUBLIC_API_BASE` endpoints not part of this repo.
  - Keep only internal OS-relevant settings that are actually wired.
  - If not implemented yet, clearly label as internal-only placeholder and remove from client flow.
- Acceptance criteria:
  - No settings route points to undefined external API assumptions during demo.
  - Settings nav only exposes working internal OS configuration paths.
  - Non-working settings are hidden from client walkthrough route.
- Demo risk: DO NOT DEMO (until cleaned)

### 5) [ ] Documents / eSign Cleanup

- Module: Documents / eSign
- Exact file paths:
  - `app/documents/page.tsx`
  - `app/documents/[id]/page.tsx`
  - `app/documents/esign/page.tsx`
- Current status: Fake-Demo / Split-backend dependency
- Required fix:
  - Remove hardcoded documents list or wire to internal API.
  - Remove external API_BASE dependency from document detail/esign unless corresponding API is implemented in this repo.
  - Hide eSign from client navigation until internally functional.
- Acceptance criteria:
  - Documents route is either truly functional in this repo or explicitly internal-only hidden from demo.
  - No route in walkthrough can land on broken external backend calls.
  - Empty/loading/error states are present and honest.
- Demo risk: DO NOT DEMO

### 6) [ ] Hide or Fix Fake/Demo Click Targets

- Module: Walkthrough Safety Controls
- Exact file paths:
  - `components/layout/sidebar.tsx`
  - `app/admin/page.tsx`
  - `app/files/page.tsx`
  - `app/forms/page.tsx`
  - `app/settings/page.tsx`
  - `app/documents/page.tsx`
- Current status: Partial
- Required fix:
  - Remove or gate routes/buttons that look finished but are non-functional.
  - Add honest badges where internal-only placeholders remain.
  - Ensure no dead-end or broken “happy path” click in client walkthrough.
- Acceptance criteria:
  - Every sidebar item shown in demo has useful and reliable behavior.
  - Disabled “coming soon” controls are either hidden or clearly marked internal-only.
  - Demo script can traverse all exposed pages without failure.
- Demo risk: DO NOT DEMO (until completed)

---

## P1 — Must Fix Before Production Launch

### 7) [ ] Notification Center (Internal OS, Not External API Stub)

- Module: Notifications
- Exact file paths:
  - `components/NotificationBell.tsx`
  - `components/layout/topbar.tsx`
  - `app/api/**` (new notifications routes)
- Current status: Partial / External-only assumptions
- Required fix:
  - Implement internal notification storage/read/mark-read API.
  - Connect topbar notification indicator to real data.
- Acceptance criteria:
  - New request/task/work-order events generate notifications.
  - User can open bell, read notifications, and mark read.
- Demo risk: DEMO WITH CAUTION

### 8) [ ] Files Upload/Download/Attachment Behavior

- Module: Files
- Exact file paths:
  - `app/files/page.tsx`
  - `app/api/files/route.ts`
- Current status: Partial
- Required fix:
  - Replace disabled upload control with real upload flow or hide it.
  - Add file detail + safe download behavior.
  - Support linking files to core records (task/request/work-order/SOP).
- Acceptance criteria:
  - User can upload and later retrieve files.
  - Linked resource metadata appears correctly in listing.
- Demo risk: DEMO WITH CAUTION

### 9) [ ] Requests Workflow Depth

- Module: Requests
- Exact file paths:
  - `app/requests/page.tsx`
  - `app/api/requests/route.ts`
- Current status: Partial
- Required fix:
  - Add status transition actions (`Submitted -> Under Review -> Approved/Denied -> Completed`).
  - Add assignment/routing updates and reviewer workflow.
- Acceptance criteria:
  - Status changes persist in DB and reflect in list/detail.
  - Reviewer assignment updates persist.
- Demo risk: DEMO WITH CAUTION

### 10) [ ] Employee Management Completeness

- Module: Employees
- Exact file paths:
  - `app/employees/page.tsx`
  - `app/employees/[id]/page.tsx`
  - `app/api/employees/route.ts`
  - `app/api/employees/[id]/route.ts`
- Current status: Partial
- Required fix:
  - Add create/update/deactivate APIs and UI actions.
  - Add permission-aware fields and manager linkage.
- Acceptance criteria:
  - Employee updates persist and reflect across tasks/timeclock views.
- Demo risk: DEMO WITH CAUTION

### 11) [ ] Timeclock Identity + Manager Review

- Module: Timeclock
- Exact file paths:
  - `app/timeclock/page.tsx`
  - `app/api/timeclock/route.ts`
  - `app/api/timeclock/active/route.ts`
- Current status: Partial
- Required fix:
  - Remove hardcoded employee list; drive selection from employees/auth user.
  - Add manager review/correction workflow guardrails.
- Acceptance criteria:
  - Clock-in/out is tied to authenticated user or valid employee ID.
  - Manager review path exists for corrections.
- Demo risk: DEMO WITH CAUTION

### 12) [ ] Environment + Deployment Safety Validation

- Module: Ops / Runtime
- Exact file paths:
  - `lib/db.ts`
  - `next.config.mjs`
  - `package.json`
  - `ecosystem.config.js`
- Current status: Partial
- Required fix:
  - Validate required env vars and fail safely.
  - Ensure no hidden dependency on localhost external APIs for core flows.
- Acceptance criteria:
  - Staging and production boots without manual patching.
  - Core routes function with only documented env vars.
- Demo risk: INTERNAL ONLY

---

## P2 — Strong v1 Improvements

### 13) [ ] Calendar Time-Block Model Upgrade

- Module: Projection Calendar
- Exact file paths:
  - `app/calendar/page.tsx`
  - `app/api/tasks/route.ts`
  - `app/api/tasks/[id]/route.ts`
  - `types/workspace.ts`
- Current status: Partial
- Required fix:
  - Introduce true time-block records (instead of overloading task fields only).
  - Add better week/day behavior and consistent status colors.
- Acceptance criteria:
  - Calendar supports planned blocks independent of task due-date only.
- Demo risk: DEMO WITH CAUTION

### 14) [ ] SOP Detail + Review Workflow

- Module: SOPs
- Exact file paths:
  - `app/sops/page.tsx`
  - `app/api/sops/route.ts`
- Current status: Partial
- Required fix:
  - Add SOP detail/read view and update/review actions.
  - Add review-date handling and owner workflow.
- Acceptance criteria:
  - SOP can be filtered, opened, updated, and moved across statuses.
- Demo risk: DEMO WITH CAUTION

### 15) [ ] Timesheet Submission/Approval UX

- Module: Timesheets
- Exact file paths:
  - `app/timesheets/page.tsx`
  - `app/api/timesheets/route.ts`
  - `app/api/timesheets/[id]/route.ts`
- Current status: Partial
- Required fix:
  - Add submit/approve/reject controls in UI.
  - Add comments/correction loop.
- Acceptance criteria:
  - Workflow transitions are visible and persisted.
- Demo risk: DEMO WITH CAUTION

### 16) [ ] Reports API + Export

- Module: Reports
- Exact file paths:
  - `app/reports/page.tsx`
  - `app/api/**` (new `/api/reports` route)
- Current status: Partial
- Required fix:
  - Move aggregation logic into a reports API.
  - Add simple export (`CSV`) for leadership reporting.
- Acceptance criteria:
  - Reports page loads from one backend endpoint and exports data.
- Demo risk: DEMO WITH CAUTION

### 17) [ ] Automations -> n8n Event Hook Foundation

- Module: Automations
- Exact file paths:
  - `app/automations/page.tsx`
  - `app/api/**` (new automation event routes)
- Current status: Partial / Shell
- Required fix:
  - Add internal event emitters (form submitted, task blocked, low stock).
  - Add auditable outbound hook behavior for n8n.
- Acceptance criteria:
  - At least one real event is emitted and logged.
- Demo risk: INTERNAL ONLY

### 18) [ ] AEON Context Upgrade (Live Data, Safer Boundaries)

- Module: AEON AI
- Exact file paths:
  - `app/ai-chat/page.tsx`
  - `app/api/ai-chat/route.ts`
  - `app/lib/aiContext.ts`
  - `app/lib/mockData.ts`
- Current status: Partial
- Required fix:
  - Replace mock operational context with live DB summaries where practical.
  - Maintain strict no-write action behavior unless explicit safe tools exist.
- Acceptance criteria:
  - AEON answers reflect current workspace DB state for at least tasks/requests/work-orders.
- Demo risk: DEMO WITH CAUTION

---

## P3 — Later Enhancements

### 19) [ ] Global Search Across Modules

- Module: Shell / Search
- Exact file paths:
  - `components/layout/topbar.tsx`
  - `app/api/**` (new global search endpoint)
- Current status: Missing
- Required fix:
  - Implement real cross-module search from topbar.
- Acceptance criteria:
  - Search returns tasks, requests, work-orders, files, SOPs, employees.
- Demo risk: INTERNAL ONLY

### 20) [ ] Activity Feed + Audit Timeline Surface

- Module: Activity / Accountability
- Exact file paths:
  - `app/dashboard/page.tsx`
  - `app/api/**` (activity routes)
- Current status: Missing
- Required fix:
  - Add recent activity feed and historical log views.
- Acceptance criteria:
  - Users can view key create/update/status events with actor + timestamp.
- Demo risk: INTERNAL ONLY

### 21) [ ] Company/Division Selector + Scoped Views

- Module: Multi-division operations
- Exact file paths:
  - `components/layout/topbar.tsx`
  - `app/**/page.tsx`
  - `app/api/**/*.ts`
- Current status: Missing
- Required fix:
  - Add division filter and scoped query behavior.
- Acceptance criteria:
  - User can switch division scope and see filtered records.
- Demo risk: INTERNAL ONLY

### 22) [ ] System Status Indicators (AI/DB/Automation Health)

- Module: Shell / Health
- Exact file paths:
  - `components/LiveIndicator.tsx`
  - `components/layout/topbar.tsx`
- Current status: Partial/Unused
- Required fix:
  - Wire health indicators to real status checks.
- Acceptance criteria:
  - Indicators reflect backend health in near real-time.
- Demo risk: INTERNAL ONLY

---

## Revenue Engine / Separate Scope (Do Not Block Internal OS Delivery)

### 23) [ ] Keep Revenue Engine lanes out of internal OS closure gate

- Module: Separate Scope Governance
- Exact file paths:
  - `app/dashboard/metrics/page.tsx`
  - `app/lib/mockData.ts` (lead/quote/job lanes)
  - `README.md`
- Current status: Separate Scope
- Required fix:
  - Explicitly mark these as separate roadmap and not required for internal OS completion.
  - Keep them hidden from internal OS demo unless explicitly requested.
- Acceptance criteria:
  - Internal OS sign-off does not depend on CRM/lead/marketing pipelines.
- Demo risk: INTERNAL ONLY

### 24) [ ] Excluded from current delivery blockers

- Module: Revenue Engine Exclusions
- Exact file paths:
  - N/A (scope policy)
- Current status: Out-of-Scope
- Required fix:
  - Do not treat the following as blockers for this build:
    - CRM
    - ServiceTitan replacement/integration
    - Lead routing/automation
    - Speed-to-lead workflows
    - Missed-call text-back
    - SMS/calling automation
    - Attribution/ROI automation
    - Direct sales pipeline automation
- Acceptance criteria:
  - Delivery planning and QA sign-off remain internal-OS-focused.
- Demo risk: INTERNAL ONLY

---

## Module-Level Completion Board (Derived from divco-necessities)

Use this board for high-level closure tracking against the master necessities list.

- [ ] Dashboard: Real-time priorities, pending requests, blocked work, alerts, quick actions, leadership cards.
- [ ] Tasks: Full lifecycle + filters + assignment + comments/attachments/history.
- [ ] Projection Calendar: Day/week/month usability + real time-block workflow.
- [ ] Forms Center: Dynamic forms + submission persistence + routing + conversions.
- [ ] Requests: Review queue with assignment, approval, escalation, alerts, reporting.
- [ ] Work Orders: Full detail workflow, assignment, status tracking, file/SOP linkage.
- [ ] Employees: Directory + detail + role/department/status + workload visibility.
- [ ] Inventory: Levels + thresholds + low-stock workflow + usage history.
- [ ] SOPs: Library + detail/read page + search/filter + review workflow.
- [ ] Timeclock: Reliable clock-in/out, active tracking, manager oversight.
- [ ] Timesheets: Weekly flows, approval loop, comments, correction path.
- [ ] Reports: Leadership-ready operational reporting + exports.
- [ ] Files/Documents: Upload/download/linking + safe document handling.
- [ ] Admin/Settings: Real persistence, no hardcoded demo controls.
- [ ] Auth/Roles: Session security + page/action-level enforcement.
- [ ] Notifications: In-app alert center tied to internal events.
- [ ] Automations: n8n-ready internal event hooks.
- [ ] AEON: Operationally useful, live-data-informed, safe behavior boundaries.

---

## Walkthrough Safety Gate (Final Demo Readiness)

All must be checked before client walkthrough:

- [ ] No exposed route depends on undefined external API_BASE services.
- [ ] No core internal OS route is fake/local-only without explicit internal-only badge.
- [ ] Sidebar contains only safe-to-click client walkthrough routes.
- [ ] Forms -> Requests flow works end-to-end with persistence.
- [ ] Admin and Settings do not show disabled fake controls to client users.
- [ ] Documents/eSign routes are either real or removed from client demo path.
- [ ] Auth/session/RBAC prevents unrestricted access.
- [ ] `npm run build` passes.

---

## Production Launch Gate

- [ ] Core modules read/write PostgreSQL without mock dependencies.
- [ ] API validation and error handling are consistent for all write routes.
- [ ] Role enforcement exists on sensitive API actions.
- [ ] File handling is safe and constrained.
- [ ] Environment variables are documented and sufficient for deploy.
- [ ] No stale Supabase/legacy contradictory code remains in active paths.
- [ ] Logs and failure states are operationally diagnosable.
