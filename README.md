# Diversified OS

**Diversified OS** is a custom internal operations platform being built for Diversified Companies as a modern replacement for scattered SharePoint tools, manual tracking sheets, disconnected task lists, and fragile internal workflows.

This project starts as the **Workspace Environment Program** and is designed to expand into lead workflow visibility, ServiceTitan-adjacent reporting, marketing profitability tracking, AI assistance, and multi-company automation.

The goal is simple:

> Build one clean internal system that helps leadership, office staff, managers, and employees see what needs to be done, who is doing it, what is overdue, what is completed, and where operational bottlenecks exist.

---

## Live Project

- **Production URL:** https://app.snrglabs.com
- **Staging / Vercel:** https://diversified-inc.vercel.app
- **Repository:** `rosegoldcruz/Diversified-Inc`
- **Built by:** SNRG Labs LLC
- **System Name:** Diversified OS
- **Initial Product Lane:** Workspace Environment Program

---

## Product Definition

Diversified OS is not just a CRM, calendar, dashboard, or task manager.

It is a custom internal operating system designed around three major workstreams:

1. **Workspace Environment Program**
2. **Lead Workflow / CRM / ServiceTitan-adjacent visibility**
3. **Marketing / lead generation / profitability reporting**

The first version focuses on internal operations:

- Employee workspace
- Task projection
- Calendar-style planning
- Employee visibility
- Forms and internal requests
- Inventory and tracking reports
- Reports and graphs
- Timeclock and timesheets
- Mobile accessibility
- Admin control
- Future AI integration

---

## Why This Exists

Diversified currently has internal workflow tools built around SharePoint-style systems, forms, tracking sheets, manual communication, and calendar/task projection concepts.

The existing system has useful ideas, but it has limitations:

- Outdated visual appearance
- Not mobile-friendly
- Manual duplicate entry
- Fragile drag-and-drop behavior
- Free plugin limitations
- Screens blanking out / requiring refresh
- Limited automation
- Limited reporting
- Limited AI support
- Limited multi-company visibility
- Separated workflows across multiple companies

Diversified OS is intended to modernize that foundation into a clean, owned, scalable internal system.

---

## Current Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Self-hosted PostgreSQL |
| DB Admin | NocoDB |
| Automation Target | n8n |
| Hosting / Runtime | Node.js |
| Process Manager | PM2 |
| Reverse Proxy | nginx |
| Deployment | Manual server deploy / Vercel staging |

No Supabase.  
No Prisma.  
No ORM dependency.

The system is intentionally structured around owned infrastructure and direct database control.

---

## Current Core Modules

### Dashboard

Central operational overview for leadership and staff.

Planned / active dashboard functions:

- Company overview
- Task summaries
- Workload visibility
- Priority watchlist
- Open work
- Overdue work
- Reports and graph entry points
- Internal status visibility

---

### Tasks

Task management is a core part of the internal workspace.

Planned / active task functions:

- Create tasks
- Assign tasks to employees
- Reassign tasks
- Track status
- Track priority
- Track due dates
- Add task notes
- Add task comments
- Attach files
- Mark complete
- Mark canceled
- Mark rescheduled
- Carry unfinished tasks forward
- View tasks by employee
- View tasks by company
- View tasks by department

---

### Calendar / Projection Workflow

The calendar workflow is one of the most important parts of the concept.

The goal is not just to list tasks. The goal is to take a to-do list and project it into real scheduled work blocks.

Planned calendar features:

- Day view
- Week view
- Month view
- Employee-specific calendar
- Team-wide calendar
- Leadership overview calendar
- Drag task into calendar
- Move scheduled task blocks
- Resize task duration
- Time-slot planning
- Meeting blocks
- Personal work blocks
- Company task blocks
- Color-coded status
- Planned vs completed tracking

Color logic requested from the original workflow:

- Red = canceled
- Blue = rescheduled
- Gray = completed
- Additional colors for priority, company, department, task type, or user

---

### Employees

Employee visibility and accountability layer.

Planned / active employee functions:

- Employee directory
- Employee role
- Employee department
- Employee status
- Employee schedule
- Employee assigned tasks
- Employee time tracking
- Manager visibility
- Leadership view
- Active work visibility

---

### Work Orders

Internal work order and operational tracking.

Planned / active work order functions:

- Create work orders
- Assign work orders
- Track status
- Track priority
- Track owner
- Track due date
- Update status
- Report by category
- Report by employee/company

---

### Inventory

Inventory and tracking reporting are part of the requested Workspace Environment Program.

Planned / active inventory functions:

- Inventory list
- Inventory categories
- Stock level
- Low stock alerts
- Assigned equipment/assets
- Vehicle inventory
- Parts/material tracking
- Inventory requests
- Inventory reports
- Usage history
- Reorder alerts

---

### Forms Center

Forms are a major requested feature.

Planned form types:

- Vehicle work order form
- Internal request form
- Maintenance request form
- Time-off request form
- Equipment request form
- Purchase/material request form
- HR/admin request form
- General company request form

Planned form behavior:

- Submit form
- Route form to correct person
- Track submission status
- Assign owner
- Convert form into tracking record
- Report on form submissions
- Export/report form data

---

### Requests

Internal request tracking.

Planned request features:

- Submit internal request
- Assign request
- Track request status
- Add notes
- Add due date
- Notify owner
- Escalate overdue request
- Report request volume
- Route requests to Kathy/admin or department owner

---

### Timeclock

The timeclock is intended to reduce or replace manual timesheet entry over time.

Planned / active timeclock functions:

- Clock in
- Clock out
- Track active entries
- Track daily time
- Track weekly time
- Track task-level time
- Compare projected time vs actual time
- Manager review
- Timesheet connection

---

### Timesheets

Timesheet reporting and approval layer.

Planned / active timesheet functions:

- Weekly timesheet view
- Employee time summaries
- Submitted / approved / draft statuses
- Manager approval
- Exportable reports
- Connection to timeclock entries
- Future replacement of manual time entry

---

### SOPs

Internal knowledge and procedure library.

Planned / active SOP functions:

- SOP library
- SOP categories
- SOP search
- SOP cards
- Department filtering
- Internal documentation
- Future AI retrieval from SOPs

---

### Reports

Reporting is required across all three major lanes: workspace, lead workflow, and marketing.

Workspace reports:

- Tasks completed
- Tasks overdue
- Tasks by employee
- Tasks by company
- Tasks by department
- Time planned vs time worked
- Timeclock summary
- Timesheet summary
- Form submission count
- Internal request count
- Inventory report
- Workload by person
- Weekly productivity report

Lead workflow reports:

- Leads by company
- Leads by source
- Leads by status
- Leads by owner
- Response time
- Call volume
- Missed calls
- Appointments booked
- Close rate
- Pipeline value
- ServiceTitan visibility

Marketing reports:

- Leads generated
- Calls generated
- Cost per lead
- Cost per appointment
- Revenue by campaign
- Profitability by campaign
- Campaign justification
- Meta ads performance
- Organic vs paid performance
- Location-level performance

---

## Future Expansion: Lead Workflow

The second major lane is lead workflow.

This should not initially replace ServiceTitan. The safer first step is to build a visibility and intelligence layer around existing lead/job systems.

Planned lead workflow features:

- Multi-company lead dashboard
- Company selector
- Separate pipelines per company
- Lead assignment
- Lead routing
- Lead status tracking
- Lead source tracking
- Lead notes
- Lead activity history
- ServiceTitan visibility layer
- ServiceTitan job/customer lookup
- ServiceTitan reporting layer
- Missed call alerts
- Follow-up tasks
- Mobile lead access

Potential lead pipeline statuses:

- New Lead
- Attempted Contact
- Contacted
- Appointment Set
- Estimate Scheduled
- Estimate Completed
- Won
- Lost
- No Answer
- Callback
- Not Interested
- Follow-Up Needed
- Hot / Warm / Cold

---

## Future Expansion: Marketing Profitability

The third major lane is marketing, lead generation, and profitability reporting.

The goal is to help Diversified understand which marketing efforts are actually producing revenue and which programs should be kept, cut, or scaled.

Planned marketing features:

- Lead generation campaign tracking
- Landing pages
- Lead capture forms
- Call tracking
- Campaign phone numbers
- UTM/source tracking
- Meta ads reporting
- Google ads reporting later
- Organic campaign tracking
- Social content calendar
- Location-level reporting
- Cost per lead
- Cost per booked appointment
- Cost per customer
- Revenue attribution
- ROAS
- Program profitability
- Program justification
- Franchise marketing comparison
- Keep / cut / scale recommendations

---

## Future Expansion: AI

AI should be practical, not cosmetic.

Workspace AI features:

- Voice-create task
- Voice-create calendar block
- Voice-move scheduled item
- AI daily assistant
- AI admin assistant
- AI task prioritization
- AI overdue task finder
- AI schedule suggestions
- AI meeting notes into tasks
- AI weekly summary
- AI “what needs attention?” summary

Lead AI features:

- AI call answering
- AI lead qualification
- AI lead scoring
- AI intent detection
- AI call summaries
- AI follow-up suggestions
- AI missed-call response
- AI human handoff
- AI serious-vs-not-serious detection

Marketing AI features:

- AI campaign ideas
- AI ad copy
- AI social posts
- AI performance summaries
- AI profitability insights
- AI report generation
- AI local promotion suggestions

---

## Future Expansion: Automations

Automation is expected to be handled through n8n, APIs, database triggers, and external integrations where appropriate.

Workspace automations:

- Task assigned → notify user
- Task overdue → notify owner/manager
- Form submitted → route to admin
- Vehicle work order submitted → create tracking record
- Inventory low → alert
- Meeting added → sync Outlook
- Task completed → update report
- Timesheet submitted → manager review
- Daily summary email/text
- Weekly executive summary

Lead automations:

- New lead → assign owner
- Missed call → auto text
- Lead form → SMS/email follow-up
- No answer → follow-up sequence
- Appointment booked → reminders
- Estimate not closed → follow-up
- Hot lead → notify Jordan
- ServiceTitan status change → update dashboard
- Call recorded → transcript/summary

Marketing automations:

- New campaign lead → tag source
- Meta lead → route to CRM
- Campaign spend → update ROI report
- Weekly marketing summary
- Underperforming campaign → flag
- Review request after customer/order
- Social/content reminders

---

## Multi-Company Structure

Diversified OS should be designed with multi-company support in mind.

Known business entities / operating lanes discussed:

- Diversified Incorporated
- Overhead Door of Wisconsin
- Overhead Door of Wausau
- SportCourt Wisconsin
- Sneaky Bird Arizona locations
- Moving / storage company
- Former FedEx delivery operation

Planned multi-company features:

- Company selector
- Company-specific workspace
- Company-specific leads
- Company-specific marketing
- Company-specific employees
- Company-level permissions
- Consolidated executive view
- Separate reports by company
- Cross-company task visibility

---

## User Roles

Expected roles:

- Executive
- Admin
- Manager
- Employee
- Marketing
- Lead Workflow / Sales
- Workspace Admin
- Company-specific user

Known stakeholder mapping:

- Terry — executive / owner
- Jill — executive / owner
- Jordan — lead workflow / marketing / operations
- Jayden — marketing / local promotion
- Kathy — workspace admin
- Callie — marketing / internal support
- Employees — daily users
- Managers — department/team oversight

---

## Access Control

Future access control requirements:

- Authentication
- Role-based access
- Company-based access
- Read/write restrictions
- Admin-only settings
- Manager-level reporting
- Employee-only personal workspace
- Executive cross-company access
- Marketing module access
- Lead workflow module access

---

## Current Build Direction

The current app already covers the foundation for the Workspace Environment Program.

Already aligned:

- Dashboard
- Tasks
- Work orders
- Employees
- Inventory
- SOPs
- Timeclock
- Timesheets
- Reports
- Mobile responsive layout
- Live database
- Internal workspace foundation

Still needed:

- Requests real database/API
- Forms real database/API
- Calendar real database backing
- Admin settings
- Files/uploads
- n8n automation wiring
- Authentication/roles
- Create/edit/delete actions
- Outlook integration
- AI assistant
- ServiceTitan-adjacent reporting
- Lead workflow
- Marketing profitability dashboard

---

## Development Notes

This system should be built as owned infrastructure, not a fragile SaaS wrapper.

Guidelines:

- Use the existing Postgres database.
- Use direct database helper patterns already in the project.
- Do not add Supabase.
- Do not add Prisma.
- Do not add a new ORM.
- Keep design consistent with the existing Diversified OS UI.
- Keep modules mobile responsive.
- Keep write actions simple and auditable.
- Do not overbuild ServiceTitan replacement before discovery.
- Build the internal workspace first.
- Expand into lead workflow and marketing profitability after the foundation is stable.

---

## Phased Roadmap

### Phase 1 — Workspace Environment MVP

Goal: replace the fragile SharePoint-style internal workspace with a modern internal operations system.

Includes:

- Dashboard
- Tasks
- Employees
- Calendar/projection workflow
- Work orders
- Inventory
- Forms
- Requests
- Timeclock
- Timesheets
- Reports
- Mobile layout
- Basic admin settings

---

### Phase 2 — Workspace Automation & AI

Goal: reduce manual work and improve visibility.

Includes:

- Outlook calendar sync
- Notifications
- Daily summaries
- Weekly summaries
- Voice task creation
- AI admin assistant
- AI schedule assistant
- n8n automation wiring

---

### Phase 3 — Lead Workflow Visibility

Goal: build a lead workflow layer around existing company systems without immediately replacing ServiceTitan.

Includes:

- Multi-company lead dashboard
- Lead pipeline
- Lead assignment
- Lead routing
- Lead reports
- ServiceTitan visibility
- Mobile lead access
- Follow-up tracking

---

### Phase 4 — Marketing Profitability Layer

Goal: prove which programs, campaigns, and channels create actual business value.

Includes:

- Lead generation tracking
- Campaign reporting
- Meta/Google reporting
- Cost per lead
- Cost per appointment
- Revenue attribution
- Profitability reporting
- Program justification
- Keep/cut/scale insights

---

### Phase 5 — Productization

Goal: turn the internal system into a repeatable platform that can potentially be used by other companies.

Includes:

- White-label structure
- Multi-tenant architecture
- Company templates
- Reusable workspace engine
- Configurable roles
- Configurable forms
- Configurable reports
- Support/service package

---

## Clean Product Statement

Diversified OS is a custom internal operating system that starts with the Workspace Environment Program, then expands into lead workflow visibility, ServiceTitan-adjacent reporting, marketing profitability, AI assistance, and multi-company automation.

It is:

- Internal workspace
- Business visibility layer
- Lead workflow layer
- Marketing ROI layer
- Automation layer
- Future productization foundation

Built to help Diversified organize the work, see the bottlenecks, reduce manual communication, improve accountability, and create a scalable system across multiple companies.

---

## Brand / Builder

Built by **SNRG Labs LLC**.

SNRG Labs stands for **Strategic Network Revenue Growth**.

Core positioning:

> It all starts in the Lab.

Diversified OS is one of the first real-world internal operations systems being built under the SNRG Labs operating model.
