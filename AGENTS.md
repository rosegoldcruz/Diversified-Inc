# Diversified OS — Full Repo Build Prompt

You are working inside the existing project repo named **DiversifiedINC**.

You are building **Diversified OS**, also called **Diversified Employee Workspace**.

This is a real internal operations application.

This is not just a client walkthrough prototype.
This is not a throwaway demo.
This is not a fake SaaS screen set.

Diversified is the immediate target company, but the application must be built as a real reusable internal operations platform that can stand on its own.

If Diversified adopts it, it becomes their internal OS.
If Diversified does not adopt it, the product should still be usable by us, reusable for another company, or extendable into a broader SNRG Labs internal operations product.

The standard is not “good enough to show.”
The standard is “usable enough to operate.”

Build real modules, real routes, clean data structures, reusable components, and an architecture that can connect to real PostgreSQL/NocoDB data later.

## Core Product Definition

Product name:
**Diversified Employee Workspace**

Interface / brand name:
**Diversified OS**

Repo name:
**DiversifiedINC**

Diversified OS is an internal company operating system for managing daily execution, employee work, SOPs, forms, requests, work orders, inventory, files, reporting, automations, and admin settings from one central workspace.

The subject matter is internal business operations.

This is about how a company manages the work happening inside the organization:

* who is doing what
* what is due
* what is blocked
* what requests need attention
* what SOPs people need to follow
* what work orders are open
* what inventory needs visibility
* what files are connected to work
* what leadership needs to see
* what employees need to access when they are not physically at work

The system should replace scattered internal workflows, messy shared files, disconnected SOPs, manual follow-up, unclear ownership, and fragmented operational visibility with one clean web-based workspace.

## Product Goal

Build a clean, modern, mobile-friendly internal operations web app that employees, managers, admins, and leadership can actually use.

Employees should be able to log in, see their work, access SOPs, submit forms, review tasks, check work orders, view related files, and understand what needs attention.

Leadership and admin users should be able to see workload, overdue work, blocked items, pending requests, work order status, inventory status, SOP coverage, and operational reporting without chasing people manually.

The app should become the place where the company operates.

## Product Philosophy

Do not build demo-only screens.
Do not create throwaway UI.
Do not hardcode everything so tightly to Diversified that the product cannot be reused.
Do not overfit the data model to one meeting or one conversation.

Build the app like it needs to survive beyond the first buyer.

Company-specific labels and mock data are fine, but the core system should be reusable for other operations-heavy companies later.

Build usable modules, not illusions.

## What This Is NOT

This is NOT a customer CRM.
This is NOT a ServiceTitan clone.
This is NOT a marketing platform.
This is NOT an ads platform.
This is NOT a customer job management system.
This is NOT a generic SaaS toy demo.
This is NOT a Supabase app.
This is NOT a chatbot project.
This is NOT a landing page.

This is an internal operations OS.

## Primary Users

Design the app around internal company users such as:

* Terry / leadership
* Cathy / workspace admin
* Jordan / operations stakeholder
* Jill / leadership
* Jayden / team member
* Callie / team member
* office staff
* managers
* internal employees

Also keep the product reusable enough that these can later become configurable users, roles, or organizations.

## Architecture Direction

Important: This project is **not using Supabase**.

Do not add Supabase.
Do not import Supabase packages.
Do not create a Supabase client.
Do not mention Supabase in the code or documentation.
Do not structure this as a Supabase application.

The backend direction is:

* self-hosted PostgreSQL database running on our VPS
* self-hosted NocoDB running on our VPS as the internal admin/database interface
* Next.js as the frontend/application layer
* API routes or server actions for controlled application logic
* clean separation between UI components and data access
* mock data isolated so it can be replaced with real Postgres queries later

For the current build stage, use mock data if real credentials or database tables are not present.

Mock data must be isolated. Do not bury data directly inside page components if a shared data layer already exists or can be created cleanly.

Preferred structure:

* `/types/workspace.ts`
* `/lib/mock-data.ts` or the repo’s existing mock data file
* `/lib/workspace-utils.ts`
* optional `/lib/data/workspace.ts` for future data access
* optional `/database/schema.sql` for future Postgres schema planning

The app should be prepared for:

* PostgreSQL as the source of truth
* NocoDB as the internal admin/database interface
* Next.js API routes/server actions as the controlled app layer
* real CRUD later
* auth and role-based access later

Do not build deep backend integration unless existing credentials, schema, and app patterns are already present.

## Existing Repo / UI Direction

Inspect the existing **DiversifiedINC** repo before changing files.

The existing app already has a visual shell and direction.

Preserve and improve what exists instead of rebuilding from scratch.

The existing direction includes:

* Diversified OS branding
* left sidebar
* grouped sidebar sections
* top search/filter/header area
* dark/light mode support
* card-based dashboard styling
* internal operations platform feel
* responsive structure

Do not destroy the existing shell.
Do not replace the layout system unless the current one is broken.
Do not remove working routes.
Do not break dark/light mode.

## Required Sidebar Navigation

The sidebar should use this structure:

Workspace:

* Dashboard
* Tasks
* Projection Calendar

Operations:

* Forms Center
* SOPs
* Requests
* Work Orders
* Employees
* Inventory

Management:

* Reports
* Files

System:

* Automations
* Admin Settings

Requests should remain if it serves as the admin/review queue for forms and internal submissions.

The relationship should be:

* Forms Center = where employees access and submit forms
* Requests = where submitted internal requests are reviewed and tracked
* Work Orders = operational execution items that require ownership, status, and follow-up
* SOPs = procedures and process documentation
* Files = supporting documents connected to work
* Employees = people, roles, workload, and visibility
* Inventory = operational items/assets/materials needing visibility

Every sidebar item must route somewhere useful.
No dead links.
No blank pages.

## Major Modules

## 1. Dashboard

Route:
`/`

Purpose:
Main command center for daily internal execution.

Must include:

* welcome/header area
* today’s priorities
* assigned tasks
* upcoming projected work blocks
* pending requests
* open work orders
* SOPs needing review if available
* inventory alerts if available
* leadership visibility cards
* quick actions
* mobile-responsive layout

The dashboard should answer:

* What needs attention today?
* What is late?
* What is blocked?
* What is waiting for review?
* What is assigned to the team?

## 2. Tasks

Route:
`/tasks`

Purpose:
Internal task management.

Must include:

* task list, cards, or table
* status
* priority
* assigned user
* due date
* progress indicator
* category
* filters for status/person/priority
* create task UI placeholder if real create flow is not ready
* update status UI placeholder if real update flow is not ready

Task statuses:

* Not Started
* In Progress
* Waiting
* Complete
* Blocked

Priorities:

* Low
* Normal
* High
* Urgent

The tasks page should feel like a real daily execution board.

## 3. Projection Calendar

Route:
`/calendar` or the existing repo route for Projection Calendar

Purpose:
Projected internal work planning.

This is not a full Google Calendar clone.

It should show where internal work is expected to happen across the day/week.

Must include:

* weekly layout or time-block view
* task-linked blocks
* meeting blocks
* admin/planning blocks
* follow-up/review blocks
* assigned users
* mobile-friendly stacked view

Block types:

* Task Work
* Meeting
* Admin
* Follow-Up
* Review

## 4. Forms Center

Route:
`/forms` or the existing Forms Center route

Purpose:
Employee-facing internal forms hub.

Must include:

* available internal forms
* form category
* description
* active/inactive status
* submit/request action
* recent submissions if available

Example forms:

* Time Off Request
* Purchase Request
* Maintenance Request
* HR / Employee Request
* IT / Access Request
* General Internal Request

Forms Center is where employees start a submission.

## 5. SOPs

Route:
`/sops`

Purpose:
Central procedure and knowledge base.

SOPs are a core requirement.

Employees should be able to log into Diversified OS from anywhere and find the procedures, instructions, files, forms, and work context they need without being physically at work or asking another person.

This is not a blog.
This is not content marketing.
This is operational knowledge.

Must include:

* SOP library
* search input
* category filter
* department filter
* status filter
* SOP cards or table
* owner/responsible role
* last updated date
* review date if available
* related files/forms/tasks/work orders if available
* recently updated section
* empty state for filters

SOP statuses:

* Draft
* Active
* Needs Review
* Archived

Example SOP categories:

* Office Procedures
* Field Operations
* Safety
* HR / Employee
* Inventory
* Work Orders
* Customer Follow-Up
* Billing / Admin

Example SOPs:

* New Employee Onboarding Checklist
* Work Order Intake Process
* Inventory Reorder Procedure
* Time Off Request Procedure
* File Upload Naming Standard
* End-of-Day Task Update Procedure
* Escalating Blocked Work
* Weekly Leadership Report Prep

## 6. Requests

Route:
`/requests`

Purpose:
Review and track submitted internal requests.

Requests should act as the admin/manager review queue connected to Forms Center submissions.

Must include:

* request list
* requester
* category
* priority
* status
* submitted date
* assigned reviewer
* related form if available
* detail drawer/card area if already consistent with repo patterns

Request statuses:

* Submitted
* Under Review
* Approved
* Denied
* Completed

Do not confuse Requests with Work Orders.

Requests are internal submissions needing review.
Work Orders are operational execution records.

## 7. Work Orders

Route:
`/work-orders` or the existing repo route

Purpose:
Operational execution tracking.

Work Orders are structured internal work items that need ownership, priority, status, dates, notes, related files, and potentially related SOPs.

Must include:

* work order list/cards/table
* title
* description
* status
* priority
* assigned owner/team
* due date or scheduled date
* related SOP if useful
* related files if useful
* category/type
* filters/search

Work order statuses may include:

* Open
* Scheduled
* In Progress
* Waiting
* Complete
* Canceled

## 8. Employees

Route:
`/employees`

Purpose:
Employee directory and workload visibility.

Must include:

* employee directory
* role
* department
* active status
* assigned task count
* current workload
* contact placeholder
* leadership/admin visibility layout

This page should make the OS feel like a real company system, not just a task board.

## 9. Inventory

Route:
`/inventory`

Purpose:
Internal inventory visibility.

Must include:

* item list/cards/table
* item category
* current quantity/status
* assigned location
* last updated date
* reorder/status indicator
* filters/search
* operational internal-use layout

Inventory does not need to be a full ERP yet.
It needs to establish visibility and structure.

## 10. Reports

Route:
`/reports`

Purpose:
Leadership visibility.

Must include:

* tasks by status
* tasks by person
* overdue items
* request volume
* work order volume/status
* completed work this week
* blocked work
* SOPs needing review if available
* inventory alerts if available
* stat cards and/or simple charts

Reports should answer:

* Who has what?
* What is late?
* What is blocked?
* What got completed this week?
* What requests are building up?
* What work orders are open?
* What needs leadership attention?

## 11. Files

Route:
`/files`

Purpose:
Organized internal file area.

Files should connect to work instead of becoming another dump folder.

Must include:

* upload placeholder if real upload is not ready
* file cards or table
* category
* uploaded by
* date
* linked task/request/work order/SOP if useful
* search/filter UI

## 12. Automations

Route:
`/automations`

Purpose:
Foundation for future internal workflow automations.

Do not fake deep automation.

Show realistic automation rule cards/placeholders if needed.

Examples:

* Notify admin when a form is submitted
* Flag overdue tasks
* Remind owner when SOP needs review
* Create follow-up task when request is approved
* Alert when inventory drops below reorder threshold

## 13. Admin Settings

Route:
`/admin` or existing Admin Settings route

Purpose:
Workspace configuration.

Must include:

* users/team members
* roles
* departments
* task categories
* form categories
* request types
* work order types
* inventory categories
* SOP categories
* system preferences placeholders

Roles:

* Leadership
* Admin
* Manager
* Employee

## Shared Components

Create or reuse components where appropriate.

Suggested components:

* `AppShell`
* `Sidebar`
* `MobileNav`
* `Header`
* `StatCard`
* `TaskCard`
* `RequestCard`
* `WorkOrderCard`
* `TimeBlockCard`
* `FormCard`
* `SopCard`
* `EmployeeCard`
* `InventoryItemCard`
* `FileCard`
* `StatusBadge`
* `PriorityBadge`
* `EmptyState`
* `SectionHeader`
* `FilterBar`
* `UserAvatar`
* `ProgressBar`

Do not overbuild.
Keep components clean, reusable, and consistent with the existing repo style.

## Data Model Types

Create or update shared types in:

`/types/workspace.ts`

If the repo already has another shared type structure, follow the existing pattern.

Core models should include:

### User

* `id`
* `name`
* `role`
* `email`
* `department`
* `avatarUrl` optional
* `active`

### Task

* `id`
* `title`
* `description`
* `status`
* `priority`
* `assignedTo`
* `createdBy`
* `dueDate`
* `progress`
* `category`
* `linkedRequestId` optional
* `linkedWorkOrderId` optional
* `linkedSopId` optional
* `linkedFileIds` optional
* `createdAt`
* `updatedAt`

### TimeBlock

* `id`
* `title`
* `type`
* `assignedTo`
* `startTime`
* `endTime`
* `linkedTaskId` optional
* `linkedWorkOrderId` optional
* `notes` optional

### InternalForm

* `id`
* `name`
* `description`
* `category`
* `active`
* `fields`

### InternalRequest

* `id`
* `title`
* `description`
* `requester`
* `category`
* `priority`
* `status`
* `assignedReviewer`
* `submittedAt`
* `updatedAt`
* `linkedFormId` optional
* `linkedTaskId` optional

### SOP

* `id`
* `title`
* `description`
* `category`
* `department`
* `owner`
* `status`
* `lastUpdated`
* `reviewDate` optional
* `relatedFileIds` optional
* `relatedFormIds` optional
* `relatedTaskIds` optional
* `relatedWorkOrderIds` optional

### WorkOrder

* `id`
* `title`
* `description`
* `status`
* `priority`
* `assignedTo`
* `category`
* `dueDate` optional
* `scheduledDate` optional
* `linkedSopId` optional
* `linkedTaskIds` optional
* `linkedFileIds` optional
* `createdAt`
* `updatedAt`

### InventoryItem

* `id`
* `name`
* `category`
* `quantity`
* `unit` optional
* `status`
* `location`
* `reorderPoint` optional
* `lastUpdated`
* `notes` optional

### WorkspaceFile

* `id`
* `name`
* `category`
* `uploadedBy`
* `uploadedAt`
* `size`
* `url` placeholder
* `linkedTaskId` optional
* `linkedRequestId` optional
* `linkedWorkOrderId` optional
* `linkedSopId` optional

### ReportMetric

* `id`
* `label`
* `value`
* `trend` optional
* `description` optional

## Mock Data

Create or update realistic mock data in the repo’s existing mock data layer.

Preferred file if no pattern exists:

`/lib/mock-data.ts`

If the repo already uses something like `/app/lib/mockData.ts`, follow that pattern instead of creating duplicate competing files.

Mock data should include:

* team members matching Diversified users
* realistic internal tasks
* realistic internal requests
* realistic work orders
* realistic SOPs
* realistic inventory items
* realistic time blocks
* realistic forms
* realistic files
* realistic report metrics

Do not use lorem ipsum.
Do not use generic fake nonsense.
Use operational examples that feel like a real internal company workspace.

## Utility Functions

Create or update utilities in:

`/lib/workspace-utils.ts`

Or follow the repo’s existing utility pattern.

Suggested utilities:

* status label formatting
* priority label formatting
* status color class mapping
* priority color class mapping
* date formatting
* progress formatting
* simple filtering helpers
* related resource count helpers if useful

## Design Requirements

The app must feel like a real internal operations system.

Design style:

* modern internal SaaS feel
* desktop-first but mobile-friendly
* responsive sidebar
* clean cards
* soft shadows
* rounded corners
* clear hierarchy
* professional spacing
* readable typography
* dark/light mode compatibility
* no clutter
* no childish colors
* no fake stock-photo corporate look
* no cheesy marketing sections

Every screen should feel operational and useful.

## Implementation Rules

Follow these rules exactly:

1. Inspect the repo first.
2. Reuse existing styling/components if present.
3. Preserve the existing shell/layout unless broken.
4. Do not destroy working code.
5. Do not rename major app structure unless necessary.
6. Keep changes organized.
7. Prefer reusable components.
8. Keep data access separate from UI where practical.
9. Make the app build cleanly.
10. Fix TypeScript errors.
11. Fix lint errors where reasonable.
12. Do not leave broken imports.
13. Do not leave blank placeholder pages.
14. Every route must render useful UI.
15. Use realistic mock data.
16. Do not add Supabase.
17. Do not add unnecessary dependencies.
18. Do not invent unrelated CRM features.
19. Do not turn this into a customer management system.
20. Keep the product focused on internal operations and employee execution.
21. Build for reuse beyond Diversified where possible.

## Future PostgreSQL / NocoDB Direction

The long-term backend is self-hosted infrastructure.

Likely PostgreSQL tables:

* `organizations`
* `users`
* `roles`
* `departments`
* `tasks`
* `time_blocks`
* `internal_forms`
* `form_submissions`
* `internal_requests`
* `work_orders`
* `inventory_items`
* `workspace_files`
* `sops`
* `sop_categories`
* `task_comments`
* `request_comments`
* `work_order_comments`
* `automation_rules`
* `activity_log`

NocoDB should be treated as the internal database/admin interface for managing records where appropriate.

Next.js should remain the application layer controlling the user experience, routing, UI, and app-specific logic.

Do not force database integration before the app is ready.
But do not structure the UI in a way that makes database integration painful later.

## Build Priority

Build in this order when deciding what to work on next:

1. Preserve/fix shell and navigation
2. Make every sidebar route real
3. Dashboard
4. Tasks
5. SOPs
6. Forms Center and Requests relationship
7. Work Orders
8. Employees
9. Inventory
10. Files
11. Reports
12. Automations
13. Admin Settings
14. Shared data models
15. Postgres schema planning
16. NocoDB table mapping
17. Real CRUD
18. Auth and roles

## Deliverable Standard

The deliverable is a real working internal operations app foundation with:

* complete sidebar navigation
* useful routes
* reusable layout
* shared components
* shared TypeScript types
* isolated mock data
* utility functions
* polished dashboard UI
* task management UI
* SOP/knowledge base UI
* forms/request workflow UI
* work order UI
* employee visibility UI
* inventory visibility UI
* files UI
* reports UI
* automations foundation UI
* admin settings UI

Do not claim something is implemented if it is only a placeholder.

If a button is nonfunctional, make it visually reasonable but do not lie about real backend behavior.

## Verification

After implementation:

1. Run the project build command.
2. Run lint/typecheck if available.
3. Fix errors introduced by your changes.
4. Check that every sidebar route renders.
5. Check that dark/light mode still works.
6. Check that no imports are broken.
7. Summarize exactly what files were created or changed.
8. Mention remaining Postgres/NocoDB integration steps.

## Final Agent Instruction

Stay focused.

This is not a concept doc.
This is not a brainstorming task.
This is not a fake demo.
This is not just a client walkthrough.

Build the actual repo files.
Make the routes render.
Make the UI coherent.
Use mock data where backend credentials are missing.
Keep the architecture ready for PostgreSQL and NocoDB.
Do not ask for unnecessary confirmation.
Do not add Supabase.
Do not invent CRM features.
Do not drift into unrelated modules.

Ship the real Diversified OS foundation.
