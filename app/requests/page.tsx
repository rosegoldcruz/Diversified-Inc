import { ClipboardCheck, Filter, Search } from "lucide-react";

type RequestStatus = "Submitted" | "Under Review" | "Approved" | "Denied" | "Completed";
type RequestPriority = "Low" | "Medium" | "High" | "Urgent";

type InternalRequest = {
  id: string;
  requester: string;
  category: string;
  priority: RequestPriority;
  status: RequestStatus;
  submittedDate: string;
  assignedReviewer: string;
};

const requests: InternalRequest[] = [
  {
    id: "REQ-2026-041",
    requester: "Maya Chen",
    category: "Purchase Order",
    priority: "High",
    status: "Under Review",
    submittedDate: "May 9, 2026",
    assignedReviewer: "Jordan Blake",
  },
  {
    id: "REQ-2026-040",
    requester: "Andre Lawson",
    category: "Installer Scheduling",
    priority: "Urgent",
    status: "Submitted",
    submittedDate: "May 9, 2026",
    assignedReviewer: "Riley Patel",
  },
  {
    id: "REQ-2026-039",
    requester: "Riley Patel",
    category: "Claims Review",
    priority: "Medium",
    status: "Approved",
    submittedDate: "May 8, 2026",
    assignedReviewer: "Maya Chen",
  },
  {
    id: "REQ-2026-038",
    requester: "Jordan Blake",
    category: "Document Update",
    priority: "Low",
    status: "Completed",
    submittedDate: "May 8, 2026",
    assignedReviewer: "Andre Lawson",
  },
  {
    id: "REQ-2026-037",
    requester: "Elena Martinez",
    category: "Vehicle Request",
    priority: "Medium",
    status: "Denied",
    submittedDate: "May 7, 2026",
    assignedReviewer: "Jordan Blake",
  },
  {
    id: "REQ-2026-036",
    requester: "Sam Rivera",
    category: "Material Transfer",
    priority: "High",
    status: "Under Review",
    submittedDate: "May 7, 2026",
    assignedReviewer: "Maya Chen",
  },
];

const statusStyles: Record<RequestStatus, string> = {
  Submitted: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Under Review": "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Denied: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  Completed: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

const priorityStyles: Record<RequestPriority, string> = {
  Low: "bg-bgDark text-textMuted",
  Medium: "bg-cyber-cyan/10 text-cyber-cyan",
  High: "bg-cyber-yellow/10 text-cyber-yellow",
  Urgent: "bg-cyber-red/10 text-cyber-red",
};

export default function RequestsPage() {
  const activeCount = requests.filter((request) =>
    ["Submitted", "Under Review"].includes(request.status),
  ).length;

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-navy">Requests</h1>
          <p className="max-w-2xl text-sm text-textMuted">
            Track internal requests from submission through review, approval, and completion.
          </p>
        </div>
        <div className="inline-flex h-10 items-center gap-2 rounded-md border border-borderSubtle bg-surface px-3 text-sm font-semibold text-textSecondary shadow-soft">
          <ClipboardCheck className="h-4 w-4 text-cyber-cyan" />
          {activeCount} active
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Requests" value={requests.length} />
        <SummaryCard label="Under Review" value={requests.filter((request) => request.status === "Under Review").length} />
        <SummaryCard label="Completed" value={requests.filter((request) => request.status === "Completed").length} />
      </section>

      <section className="rounded-lg border border-borderSubtle bg-surface p-3 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-textDisabled" />
            <input
              className="h-10 w-full rounded-md border border-borderSubtle bg-bgDark pl-9 pr-3 text-sm text-textPrimary outline-none placeholder:text-textDisabled focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Search requests, categories, or team members"
            />
          </label>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-borderSubtle px-3 text-sm font-semibold text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-lg border border-borderSubtle bg-surface shadow-soft md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-bgDark text-xs uppercase tracking-wide text-textMuted">
              <tr>
                <th className="px-4 py-3 font-semibold">Requester</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted Date</th>
                <th className="px-4 py-3 font-semibold">Assigned Reviewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSubtle">
              {requests.map((request) => (
                <tr key={request.id} className="transition-colors hover:bg-bgDark">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-textPrimary">{request.requester}</div>
                    <div className="text-xs text-textMuted">{request.id}</div>
                  </td>
                  <td className="px-4 py-3 text-textSecondary">{request.category}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={request.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3 text-textSecondary">{request.submittedDate}</td>
                  <td className="px-4 py-3 text-textSecondary">{request.assignedReviewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 md:hidden">
        {requests.map((request) => (
          <article key={request.id} className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-textPrimary">{request.requester}</p>
                <p className="mt-0.5 text-xs text-textMuted">{request.id}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MobileField label="Category" value={request.category} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-textDisabled">Priority</p>
                <div className="mt-1">
                  <PriorityBadge priority={request.priority} />
                </div>
              </div>
              <MobileField label="Submitted" value={request.submittedDate} />
              <MobileField label="Reviewer" value={request.assignedReviewer} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-textDisabled">{label}</p>
      <p className="mt-1 text-textSecondary">{value}</p>
    </div>
  );
}
