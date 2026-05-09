/**
 * AEON Operational Context Builder
 *
 * Builds a concise, token-efficient operational snapshot for the AEON system prompt.
 * Imports from mockData.ts where data is centralized; mirrors page-local mock data
 * for modules (Tasks, Requests) that define it within their own components.
 *
 * Do NOT expose secrets, environment variables, or credentials here.
 */

import { mockSops, mockWorkOrders, mockMaterials } from "@/app/lib/mockData";

// ─── Task data (mirrored from app/tasks/page.tsx) ─────────────────────────
type TaskStatus = "Open" | "In Progress" | "Pending" | "Completed" | "Overdue";
type TaskPriority = "High" | "Medium" | "Low";

const TASKS: {
  ref: string;
  task: string;
  division: string;
  assignedTo: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
}[] = [
  {
    ref: "TASK-1048",
    task: "Review PO request for cabinet hardware",
    division: "Purchasing",
    assignedTo: "Maya Chen",
    priority: "High",
    dueDate: "2026-05-08",
    status: "Open",
  },
  {
    ref: "TASK-1049",
    task: "Schedule installer follow-up for Mesa remodel",
    division: "Operations",
    assignedTo: "Andre Lawson",
    priority: "Medium",
    dueDate: "2026-05-08",
    status: "In Progress",
  },
  {
    ref: "TASK-1050",
    task: "Upload claim photos and notes",
    division: "Claims",
    assignedTo: "Riley Patel",
    priority: "High",
    dueDate: "2026-05-06",
    status: "Overdue",
  },
  {
    ref: "TASK-1051",
    task: "Confirm vehicle request availability",
    division: "Fleet",
    assignedTo: "Maya Chen",
    priority: "Low",
    dueDate: "2026-05-10",
    status: "Pending",
  },
  {
    ref: "TASK-1052",
    task: "Close completed work order packet",
    division: "Work Orders",
    assignedTo: "Jordan Blake",
    priority: "Medium",
    dueDate: "2026-05-07",
    status: "Completed",
  },
];

// ─── Request data (mirrored from app/requests/page.tsx) ───────────────────
type RequestStatus = "Submitted" | "Under Review" | "Approved" | "Denied" | "Completed";
type RequestPriority = "Low" | "Medium" | "High" | "Urgent";

const REQUESTS: {
  id: string;
  requester: string;
  category: string;
  priority: RequestPriority;
  status: RequestStatus;
  assignedReviewer: string;
}[] = [
  {
    id: "REQ-2026-041",
    requester: "Maya Chen",
    category: "Purchase Order",
    priority: "High",
    status: "Under Review",
    assignedReviewer: "Jordan Blake",
  },
  {
    id: "REQ-2026-040",
    requester: "Andre Lawson",
    category: "Installer Scheduling",
    priority: "Urgent",
    status: "Submitted",
    assignedReviewer: "Riley Patel",
  },
  {
    id: "REQ-2026-039",
    requester: "Riley Patel",
    category: "Claims Review",
    priority: "Medium",
    status: "Approved",
    assignedReviewer: "Maya Chen",
  },
  {
    id: "REQ-2026-038",
    requester: "Jordan Blake",
    category: "Document Update",
    priority: "Low",
    status: "Completed",
    assignedReviewer: "Andre Lawson",
  },
  {
    id: "REQ-2026-037",
    requester: "Elena Martinez",
    category: "Vehicle Request",
    priority: "Medium",
    status: "Denied",
    assignedReviewer: "Jordan Blake",
  },
  {
    id: "REQ-2026-036",
    requester: "Sam Rivera",
    category: "Material Transfer",
    priority: "High",
    status: "Under Review",
    assignedReviewer: "Maya Chen",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function groupCount<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T,
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const val = String(item[key]);
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

// ─── Context builder ──────────────────────────────────────────────────────

/**
 * Returns a concise operational summary string for injection into the AEON
 * system prompt. Keep token usage reasonable — summarize signals, not raw records.
 */
export function buildOperationalContext(): string {
  const today = "2026-05-09";

  // Tasks
  const taskByStatus = groupCount(TASKS, "status");
  const taskByPriority = groupCount(TASKS, "priority");
  const overdueTasks = TASKS.filter((t) => t.status === "Overdue");
  const urgentOpenTasks = TASKS.filter(
    (t) =>
      t.priority === "High" && (t.status === "Open" || t.status === "Overdue"),
  );

  // Requests
  const pendingRequests = REQUESTS.filter((r) =>
    ["Submitted", "Under Review"].includes(r.status),
  );
  const urgentPendingRequests = pendingRequests.filter(
    (r) => r.priority === "Urgent" || r.priority === "High",
  );

  // Work Orders
  const woByStatus = groupCount(mockWorkOrders, "status");
  const blockedWorkOrders = mockWorkOrders.filter((wo) => wo.status === "pending");
  const flaggedWorkOrders = mockWorkOrders.filter(
    (wo) =>
      wo.notes.toLowerCase().includes("hold") ||
      wo.notes.toLowerCase().includes("await") ||
      wo.notes.toLowerCase().includes("delay") ||
      wo.notes.toLowerCase().includes("tbd"),
  );

  // SOPs
  const sopNeedsReview = mockSops.filter((s) => s.status === "Needs Review");
  const sopDraft = mockSops.filter((s) => s.status === "Draft");
  const sopOverdueReview = mockSops.filter((s) => {
    if (!s.reviewDate) return false;
    return new Date(s.reviewDate) <= new Date(today);
  });

  // Inventory
  const lowStock = mockMaterials.filter((m) => m.stockStatus === "low-stock");
  const outOfStock = mockMaterials.filter((m) => m.stockStatus === "out-of-stock");
  const onOrder = mockMaterials.filter((m) => m.stockStatus === "on-order");

  return `
=== DIVERSIFIED OS — OPERATIONAL CONTEXT (${today}) ===

TASKS
- Status breakdown: ${formatCounts(taskByStatus)}
- Priority breakdown: ${formatCounts(taskByPriority)}
- Overdue: ${overdueTasks.length > 0 ? overdueTasks.map((t) => `${t.ref} — "${t.task}" [assigned: ${t.assignedTo}]`).join("; ") : "None"}
- Urgent / High priority open: ${urgentOpenTasks.length > 0 ? urgentOpenTasks.map((t) => `${t.ref} — "${t.task}" [${t.assignedTo}]`).join("; ") : "None"}

REQUESTS
- Total pending (Submitted + Under Review): ${pendingRequests.length}
- Urgent / High priority pending: ${urgentPendingRequests.length > 0 ? urgentPendingRequests.map((r) => `${r.id} — ${r.category} [${r.priority}, reviewer: ${r.assignedReviewer}]`).join("; ") : "None"}
- All pending: ${pendingRequests.map((r) => `${r.id} ${r.category} (${r.priority}, ${r.status})`).join("; ")}

WORK ORDERS
- Status breakdown: ${formatCounts(woByStatus)}
- Blocked / pending action: ${blockedWorkOrders.length > 0 ? blockedWorkOrders.map((wo) => `${wo.id} — ${wo.notes}`).join(" | ") : "None"}
- Flagged for attention: ${flaggedWorkOrders.length > 0 ? flaggedWorkOrders.map((wo) => `${wo.id} [${wo.status}] — ${wo.notes}`).join(" | ") : "None"}

SOPs
- Needs Review: ${sopNeedsReview.length > 0 ? sopNeedsReview.map((s) => `${s.id} "${s.title}" (owner: ${s.owner}, review due: ${s.reviewDate ?? "—"})`).join("; ") : "None"}
- Draft: ${sopDraft.length > 0 ? sopDraft.map((s) => `${s.id} "${s.title}"`).join("; ") : "None"}
- Overdue review (past due date): ${sopOverdueReview.length > 0 ? sopOverdueReview.map((s) => `${s.id} "${s.title}" (was due ${s.reviewDate ?? "—"})`).join("; ") : "None"}

INVENTORY ALERTS
- Low stock: ${lowStock.length > 0 ? lowStock.map((m) => `${m.name} [${m.sku}]`).join(", ") : "None"}
- Out of stock: ${outOfStock.length > 0 ? outOfStock.map((m) => `${m.name} (ETA: ${m.eta})`).join(", ") : "None"}
- On order: ${onOrder.length > 0 ? onOrder.map((m) => `${m.name} (ETA: ${m.eta})`).join(", ") : "None"}

EMPLOYEE WORKLOAD SIGNALS
- Maya Chen: 2 open tasks (High PO review + Low fleet confirm); reviewing 2 requests
- Andre Lawson: 1 in-progress task (Operations); 1 urgent request pending review
- Riley Patel: 1 overdue high-priority task (Claims — photos not uploaded)
- Jordan Blake: 1 completed task; assigned reviewer on 1 high-priority request
- Sam Rivera: 1 high-priority material transfer request under review; no tasks

UPCOMING CALENDAR / WORK ORDER SCHEDULE
- WO-8801: 2026-05-09 — Botta Install Co. (confirm AM panel delivery before dispatch)
- WO-8804: in-progress since 2026-05-07 — Precision Kitchen Co. (final walkthrough due)
- WO-8803: target 2026-05-12 — installer not yet assigned (blocked)
- WO-8805: 2026-05-14 — material delivery confirmed 2026-05-13
- WO-8806: 2026-05-16 — vanity ETA delayed to 2026-05-15 (monitor)
`.trim();
}
