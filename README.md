# Diversified OS

**Diversified OS** is a custom internal operations platform being built for Diversified Companies.

It is designed to replace scattered SharePoint workflows, manual tracking sheets, disconnected task lists, fragile internal tools, and outdated workspace processes with one modern internal operating system.

The first product lane is the **Workspace Environment Program**.

Future lanes include:

1. Lead Workflow / CRM / ServiceTitan-adjacent visibility
2. Marketing / lead generation / profitability reporting
3. AI assistance and automation
4. Multi-company operating visibility

---

## Project Status

**Date:** May 11, 2026  
**Repo:** `rosegoldcruz/Diversified-Inc`  
**Production URL:** `https://app.snrglabs.com`  
**Staging / Vercel:** `https://diversified-inc.vercel.app`  
**Builder:** SNRG Labs LLC

---

## Product Definition

Diversified OS is not just a CRM, calendar, dashboard, or task manager.

It is a custom internal operating system that starts with the Workspace Environment Program, then expands into lead workflow visibility, ServiceTitan-adjacent reporting, marketing profitability, AI assistance, and multi-company automation.

The platform is meant to help leadership, office staff, managers, and employees answer:

- What needs to be done?
- Who is responsible?
- What is overdue?
- What is completed?
- What is blocked?
- What is happening across the company?
- What should leadership care about today?
- Which workflows are creating bottlenecks?
- Which systems need automation?

---

## Core Workstreams

### 1. Workspace Environment Program

This is the main active build.

The goal is to modernize Diversified’s internal workspace into a clean daily/weekly execution system.

Primary features:

- Internal dashboard
- Employee workspace
- Task management
- Calendar / projection workflow
- Work orders
- Requests
- Forms
- Inventory tracking
- SOP library
- Timeclock
- Timesheets
- Reports and graphs
- Admin settings
- Mobile accessibility
- AI assistance later
- Phased rollout

---

### 2. Lead Workflow / CRM / ServiceTitan-Adjacent Layer

This is a future expansion lane.

The goal is not to immediately replace ServiceTitan. The safer first step is to build a visibility and workflow layer around the existing ServiceTitan environment.

Planned future features:

- Multi-company lead dashboard
- Lead pipeline
- Lead assignment
- Lead routing
- Lead source tracking
- Lead status tracking
- ServiceTitan data visibility
- ServiceTitan reporting layer
- Missed call alerts
- Follow-up tracking
- Appointment visibility
- Mobile lead access
- AI lead summaries later

---

### 3. Marketing / Profitability Layer

This is a future expansion lane.

The goal is to show which marketing programs actually generate leads, appointments, revenue, and profit.

Planned future features:

- Lead generation tracking
- Campaign reporting
- Meta / Google reporting
- Call tracking
- Landing page tracking
- Cost per lead
- Cost per booked appointment
- Revenue attribution
- ROAS
- Program profitability
- Franchise marketing comparison
- Keep / cut / scale recommendations

---

## Technology Stack

| Layer             | Technology                            |
| ----------------- | ------------------------------------- |
| Framework         | Next.js 14 App Router                 |
| Language          | TypeScript                            |
| Styling           | Tailwind CSS                          |
| Database          | PostgreSQL                            |
| DB Client         | `pg` through `lib/db.ts`              |
| DB Admin          | NocoDB                                |
| Automation Target | n8n                                   |
| AI Chat           | AI SDK / streaming route              |
| Runtime           | Node.js                               |
| Process Manager   | PM2                                   |
| Reverse Proxy     | nginx                                 |
| Deployment        | Manual server deploy + Vercel staging |

Architecture notes:

- PostgreSQL is the source of truth.
- `lib/db.ts` is the main database helper.
- The app does not use Prisma.
- The app should not add Supabase as a dependency.
- The app should not add a new ORM unless the architecture is intentionally changed.
- NocoDB exists as an admin/database visibility layer, not as the primary application layer.

---

## Implemented and Working

These modules have real UI, real API routes, and real PostgreSQL connectivity.

---

### Dashboard

Status: **Working**

Implemented:

- Live stat cards
- Pulls from `/api/dashboard`
- Real SQL aggregations
- Total tasks
- Open work orders
- Low stock items
- Total employees
- High-priority tasks
- Blocked tasks
- Priority watchlist
- Deep links into filtered modules
- Loading states
- Error states
- Responsive layout

---

### Tasks

Status: **Core working**

Implemented:

- Task list page
- Status filter dropdown
- Priority filter dropdown
- URL parameter support
- Deep links from dashboard
- Real `GET /api/tasks`
- Real `POST /api/tasks`
- SQL join with employees
- Individual task detail route: `/tasks/[id]`
- Mobile card layout
- Desktop table layout

Supported task fields include:

- Title
- Division
- Topic
- Priority
- Due date
- Start time
- End time
- Assigned employee
- Estimated hours
- Description
- Notes
- All-day flag
- Repeat schedule

Still missing:

- Task comments UI
- File attachments
- Carry unfinished tasks forward
- Reassign task from UI
- View by company
- View by department
- Canceled / rescheduled status model
- Full drag-to-calendar workflow

---

### Timeclock

Status: **Working**

Implemented:

- Clock in
- Clock out
- Real writes to `timeclock_entries`
- `GET /api/timeclock`
- `POST /api/timeclock`
- Active clock-in detection
- Last 50 entries ordered by clock-in time
- Open entry updates on clock-out

Still missing:

- Task-level time tracking
- Projected vs actual time comparison
- Manager review UI
- Timeclock-to-timesheet auto-population

---

### Timesheets

Status: **Core working**

Implemented:

- Weekly timesheet view
- Monday through Sunday hour columns
- Employee totals
- Status badges
- Summary cards
- Total timesheets
- Pending approval count
- Approved this week count
- Real `GET /api/timesheets`
- Real `POST /api/timesheets`
- `/api/timesheets/[id]` route scaffold
- Mobile card layout
- Desktop table layout

Still missing:

- Manager approval action from UI
- Export
- Auto-populate from timeclock entries
- Full approval workflow

---

### Requests

Status: **Working**

Implemented:

- Request list page
- Slide-over detail panel
- Real `GET /api/requests`
- Real `POST /api/requests`
- Auto-generated request IDs using `REQ-YYYY-###`
- Status badges
- Summary cards

Supported statuses:

- Submitted
- Under Review
- Approved
- Denied
- Completed

Still missing:

- Notify owner
- Escalate overdue requests
- Routing logic to Kathy/admin
- Request assignment automation

---

### SOPs

Status: **Working**

Implemented:

- SOP card grid
- Real `GET /api/sops`
- Search by title
- Search by description
- Category badges
- Version display
- Status display

Supported statuses:

- Active
- Under Review
- Archived

Still missing:

- SOP detail/read page
- SOP edit/create flow
- Department filtering dropdown
- AI retrieval from SOP library

---

### Inventory

Status: **Core working**

Implemented:

- Inventory list page
- Inventory detail route: `/inventory/[id]`
- Real `GET /api/inventory`
- Real `GET /api/inventory/[id]`
- Low stock count on dashboard
- Deep link to `?status=low_stock`

Still missing:

- Stock editing
- Categories
- Reorder alerts
- Inventory request workflow
- Usage history
- Vehicle inventory
- Parts/material tracking

---

### Work Orders

Status: **Core working**

Implemented:

- Work orders list page
- Work order detail route: `/work-orders/[id]`
- Real `GET /api/work-orders`
- Real `GET /api/work-orders/[id]`
- Dashboard open work order count

Still missing:

- Create work order UI
- Edit/update work order UI
- File attachments
- Full reporting layer

---

### Employees

Status: **Core working**

Implemented:

- Employee list page
- Employee detail route: `/employees/[id]`
- Real `GET /api/employees`
- Real `GET /api/employees/[id]`

Still missing:

- Employee schedule view
- Active work visibility
- Time tracking by employee
- Manager visibility layer
- Employee workload dashboard

---

### AI Chat / AEON

Status: **Working**

Implemented:

- Streaming AI chat
- Built with `@ai-sdk/react`
- Uses `useChat`
- Streams to `/api/ai-chat`
- Real `POST /api/ai-chat`
- Quick prompts
- Animated message bubbles
- Streaming indicator
- Stop/retry behavior
- Mobile bottom sheet for quick prompts
- Desktop sidebar prompt panel

Built-in quick prompts:

- Daily Ops Sync
- SOP Assistant
- Work Order Follow-Up
- Request Triage
- Employee Workload Review
- Inventory Watch
- Weekly Leadership Summary

Still missing:

- Voice input
- AI task creation
- AI calendar block creation
- AI overdue finder
- AI schedule suggestions
- AI meeting notes into tasks

---

### Calendar

Status: **Built but feature-incomplete**

Implemented:

- Large calendar implementation
- Existing task opening logic
- Multi-view mode switching
- Complex UI foundation

Still missing / needs confirmation:

- Drag task from task list into calendar
- Resize scheduled blocks
- Employee-specific calendar
- Team-wide calendar view
- Leadership overview calendar
- Red/blue/gray status color logic
- Planned vs actual comparison

---

## Half-Baked / Partial Modules

These modules exist but are incomplete, mocked, hardcoded, or not fully connected.

---

### Admin

Status: **UI shell / partially hardcoded**

Current issues:

- Employee list is hardcoded in TypeScript.
- Employees are not pulled from the `employees` table.
- Role dropdowns are disabled.
- Add Employee button is disabled.
- Notification toggles are local React state only.
- No settings persist.
- Integration statuses are hardcoded.
- Danger Zone buttons are disabled / demo mode.

Needed:

- Real employee data from database
- Role management
- Department management
- User management
- Permission management
- Persisted system settings
- Real integration health checks
- Admin create/edit actions

---

### Reports

Status: **Page exists, backend unclear**

Implemented:

- Reports page exists
- Structure exists
- Some navigation into inventory detail pages

Issues:

- No `/api/reports` route found
- Lead reports do not exist
- Marketing reports do not exist
- ServiceTitan reports do not exist

Needed:

- Workspace reports API
- Employee reports
- Task reports
- Time reports
- Inventory reports
- Lead reports
- Marketing reports
- Exportable leadership summaries

---

### Forms

Status: **UI only / no backend**

Implemented:

- Forms page exists
- Multiple form types appear scaffolded
- Active form switching exists

Issues:

- No `/api/forms` route exists
- Submissions likely do not persist
- No routing logic
- No tracking record conversion

Needed:

- Forms database schema
- Form submissions API
- Form submission tracking
- Form-to-request conversion
- Form-to-work-order conversion
- Admin routing
- Notifications

---

### Files

Status: **Partial / needs verification**

Implemented:

- `/files` page exists
- `/api/files` route exists
- File listing UI exists

Unknown:

- Whether upload works
- Whether download works
- Whether storage is local, database-backed, or external
- Whether file records connect to tasks, work orders, requests, or SOPs

Needed:

- Upload
- Download
- File metadata
- File-to-module attachments
- Permissions
- Storage strategy

---

### Documents / eSign

Status: **Scaffolded**

Implemented:

- `/documents` page exists
- Detail view exists
- `/documents/esign` subdirectory exists

Unknown:

- eSign depth
- PDF generation
- Signature storage
- Document workflow

Needed:

- Clarify whether this is part of MVP
- Connect documents to requests/work orders/employees
- Define eSign requirements

---

### Automations

Status: **UI shell**

Implemented:

- `/automations` page exists
- Admin shows n8n as connected

Issues:

- No clear repo-level workflow trigger logic
- Actual n8n workflows likely live outside this repo

Needed:

- n8n webhook integration
- Automation status checks
- Trigger logging
- Workflow health display
- Task/request/form automation triggers

---

### Settings

Status: **Scaffolded**

Implemented:

- `/settings`
- `/settings/billing`
- `/settings/notifications`
- `/settings/system`

Unknown:

- Whether anything persists
- Whether settings are wired to database

Needed:

- Persisted settings
- User preferences
- Notification settings
- System configuration

---

## Not Implemented Yet

These areas are described in the product vision but do not currently exist in the codebase.

---

### Lead Workflow / CRM Lane

Status: **Not implemented**

Missing:

- `/leads` page
- `/crm` page
- Lead pipeline
- Lead assignment
- Lead routing
- Lead status tracking
- ServiceTitan integration
- Missed call alerts
- Follow-up automation
- Lead source tracking
- Lead reports

Note:

`lib/types.ts` includes Lead/Homeowner/Installer/Quote/Job style types, but there is no UI or API implementation built on top of those types yet.

---

### Marketing Profitability Lane

Status: **Not implemented**

Missing:

- `/marketing` page
- Campaign tracking
- Call tracking
- UTM tracking
- Meta ads reporting
- Google ads reporting
- Cost per lead
- Cost per booked appointment
- Revenue attribution
- ROAS
- Campaign profitability
- Landing pages
- Lead capture forms

---

### Advanced Task Features

Status: **Not implemented**

Missing:

- Task comments UI
- Task notes thread
- File attachments on tasks
- Carry unfinished tasks forward
- View by company
- View by department
- Rescheduled status
- Canceled status

---

### Advanced Calendar Features

Status: **Not implemented / needs confirmation**

Missing:

- Employee-specific calendar
- Team-wide calendar
- Leadership calendar
- Drag from task list into calendar
- Resize blocks
- Red = canceled
- Blue = rescheduled
- Gray = completed
- Projection vs completion tracking

---

### Advanced AI Features

Status: **Not implemented**

Missing:

- Voice task creation
- Voice calendar creation
- Voice move/reschedule
- AI task prioritization
- AI schedule suggestions
- AI meeting notes into tasks
- AI daily assistant
- AI weekly summary
- AI “what needs attention?” summary
- Lead AI
- Marketing AI

---

### Automation Features

Status: **Not implemented in repo**

Missing:

- Task assigned notification
- Task overdue notification
- Form submitted routing
- Inventory low alert
- Outlook sync trigger
- Daily summary automation
- Weekly executive summary
- Lead follow-up automation
- Marketing performance automation

---

### Mobile PWA

Status: **Partial**

Implemented:

- `app/manifest.ts` exists

Missing:

- Service worker
- Offline caching
- Push notifications
- Installable PWA behavior confirmation

---

## Technical Debt / Contradictions

| Issue                                | Detail                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Supabase contradiction               | README says no Supabase, but `lib/supabase-realtime.ts` exists. Determine if vestigial and remove if unused. |
| Supabase type header                 | `lib/types.ts` references Supabase auto-sync and `aeon_audit.py`, but no such script exists in repo.         |
| Admin hardcoded employees            | Admin uses static employee array instead of database.                                                        |
| Admin settings do not persist        | Toggles are local state only.                                                                                |
| Forms lack backend                   | `/forms` page exists, but `/api/forms` does not.                                                             |
| Reports backend unclear              | Reports page exists, but `/api/reports` does not.                                                            |
| Automations are not wired            | n8n may exist externally, but app triggers are not implemented.                                              |
| Lead/marketing lanes are vision only | README should mark these as roadmap, not current implementation.                                             |

---

## Current Build Scorecard

| Module        | Status                       |
| ------------- | ---------------------------- |
| Dashboard     | Working                      |
| Tasks         | Core working                 |
| Calendar      | Built but incomplete         |
| Employees     | Core working                 |
| Work Orders   | Core working                 |
| Inventory     | Core working                 |
| Forms         | UI only                      |
| Requests      | Working                      |
| Timeclock     | Working                      |
| Timesheets    | Core working                 |
| SOPs          | Working                      |
| Reports       | Partial / backend unclear    |
| Admin         | Hardcoded shell              |
| AI Chat       | Working                      |
| Files         | Partial / needs verification |
| Documents     | Scaffolded                   |
| Automations   | UI shell                     |
| Settings      | Scaffolded                   |
| Lead Workflow | Not implemented              |
| Marketing     | Not implemented              |

---

## Practical MVP Definition

The realistic MVP should focus on **Lane 1: Workspace Environment Program** only.

MVP should include:

- Dashboard
- Tasks
- Calendar/projection
- Employees
- Work orders
- Requests
- Forms
- Inventory
- Timeclock
- Timesheets
- SOPs
- Reports
- Admin basics
- Mobile usability
- Basic AI chat

Do not include in MVP:

- Full lead workflow
- Full marketing dashboard
- Full ServiceTitan replacement
- Full AI agent automation
- Full multi-tenant productization

Those should remain roadmap items.

---

## Recommended Next Build Priorities

### Priority 1 — Fix README Accuracy

The README should clearly separate:

- Built
- Partially built
- Roadmap
- Not implemented

The current README should not imply that lead workflow or marketing profitability are implemented.

---

### Priority 2 — Finish Forms Backend

Build:

- `/api/forms`
- `form_submissions` table if not present
- Form submission POST
- Form submission list
- Submission detail view
- Submission status
- Route submitted forms to admin/request owner

---

### Priority 3 — Fix Admin

Build:

- Real employees from database
- Add employee
- Edit employee role
- Edit department
- Persist notification settings
- Persist system settings
- Real integration health checks

---

### Priority 4 — Strengthen Calendar

Build:

- Drag task into calendar
- Resize scheduled blocks
- Employee-specific calendar
- Team-wide calendar
- Leadership calendar
- Color logic
- Planned vs completed tracking

---

### Priority 5 — Add Core Write Actions

Build:

- Create work order
- Edit work order
- Edit inventory item
- Update inventory stock
- Approve timesheet
- Edit SOP
- Create SOP
- Reassign task

---

### Priority 6 — Reports API

Build:

- `/api/reports`
- Workspace reporting
- Task reporting
- Time reporting
- Inventory reporting
- Request/form reporting
- Exportable leadership summary

---

### Priority 7 — Auth and Roles

Build:

- Login
- Sessions
- Role-based access
- Company-based access later
- Admin vs employee permissions
- Manager vs executive permissions

---

## Long-Term Roadmap

### Phase 1 — Workspace Environment MVP

- Finish internal workspace
- Finish forms
- Finish admin
- Finish calendar
- Finish reports
- Add auth
- Polish mobile

### Phase 2 — Automation and AI

- n8n workflow triggers
- Outlook sync
- Notifications
- Daily summaries
- Weekly summaries
- Voice input
- AI task/calendar actions

### Phase 3 — Lead Workflow

- Lead pipeline
- Company-specific lead views
- ServiceTitan visibility
- Follow-up tasks
- Missed call logic
- Lead reports

### Phase 4 — Marketing Profitability

- Campaign tracking
- Lead source tracking
- Cost per lead
- Cost per appointment
- Revenue attribution
- Profitability dashboards

### Phase 5 — Productization

- Multi-company templates
- White-label capability
- Configurable forms
- Configurable reports
- Multi-tenant architecture
- Support/service package

---

## Clean Internal Positioning

The current app is not finished, but it is real.

The strongest current positioning is:

> Diversified OS already has the foundation of the Workspace Environment Program live: dashboard, tasks, employees, work orders, inventory, requests, SOPs, timeclock, timesheets, reports structure, and AEON AI chat. The remaining MVP work is wiring unfinished modules, adding admin/auth, strengthening calendar workflows, and completing forms/reports/write actions.

The safest client-facing positioning is:

> This is the first working foundation. The core internal workspace is already active, and the next step is finishing the operational workflows that make it ready for team rollout.

---

## Built By

Built by **SNRG Labs LLC**.

SNRG Labs stands for **Strategic Network Revenue Growth**.

Core operating line:

> It all starts in the Lab.

Diversified OS is an internal operations system built under the SNRG Labs operating model.
