"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type WorkOrder = {
  id: number;
  title: string;
  type: string | null;
  division: string | null;
  status: string | null;
  priority: string | null;
  owner_name: string | null;
  due_date: string | null;
};

type EmployeeOption = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
};

type CreateWorkOrderForm = {
  title: string;
  description: string;
  type: string;
  division: string;
  status: string;
  priority: string;
  owner: string;
  due_date: string;
  notes: string;
};

const EMPTY_WORK_ORDER_FORM: CreateWorkOrderForm = {
  title: "",
  description: "",
  type: "General",
  division: "Operations",
  status: "open",
  priority: "medium",
  owner: "",
  due_date: "",
  notes: "",
};

const WORK_ORDER_TYPES = [
  "General",
  "Maintenance",
  "Facilities",
  "Safety",
  "Inventory",
  "IT / Access",
];

const DIVISIONS = [
  "Operations",
  "Admin",
  "Facilities",
  "Inventory",
  "Safety",
  "IT",
  "HR",
];

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading work orders..." />}>
      <WorkOrdersPageContent />
    </Suspense>
  );
}

function WorkOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWorkOrderForm>(
    EMPTY_WORK_ORDER_FORM,
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusParam = searchParams?.get("status") ?? null;

  const filteredWorkOrders = useMemo(() => {
    if (statusFilter === "All") {
      return workOrders;
    }

    return workOrders.filter(
      (workOrder) => toFilterStatus(workOrder.status) === statusFilter,
    );
  }, [statusFilter, workOrders]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrders() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/work-orders", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load work orders (${response.status})`);
        }

        const data = (await response.json()) as WorkOrder[];
        if (!cancelled) {
          setWorkOrders(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load work orders",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        const response = await fetch("/api/employees", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as EmployeeOption[];
        if (!cancelled) {
          setEmployees(data);
        }
      } catch {
        if (!cancelled) {
          setEmployees([]);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setStatusFilter(toWorkOrderFilterFromParam(statusParam));
  }, [statusParam]);

  async function createWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          owner: createForm.owner ? Number(createForm.owner) : null,
          due_date: createForm.due_date || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data && typeof data.error === "string"
            ? data.error
            : `Failed to create work order (${response.status})`,
        );
      }

      const created = data as WorkOrder;
      setWorkOrders((current) => [created, ...current]);
      setCreateForm(EMPTY_WORK_ORDER_FORM);
      setShowCreateForm(false);
      setSuccessMessage(`Created work order WO-${created.id}.`);
    } catch (createErrorValue) {
      setCreateError(
        createErrorValue instanceof Error
          ? createErrorValue.message
          : "Failed to create work order",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
              <ShinyText>Work Orders</ShinyText>
            </h1>
            <span className="inline-flex rounded-xl border border-white/30 bg-white/55 px-3 py-1 text-xs font-medium text-textMuted shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              {filteredWorkOrders.length} of {workOrders.length} Work Orders
            </span>
          </div>
          <p className="max-w-3xl text-base text-textSecondary">
            Live work orders with type, priority, ownership, and due dates from
            PostgreSQL.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setCreateError(null);
            setSuccessMessage(null);
          }}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-accent/90 px-5 text-sm font-semibold text-white shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-accent hover:shadow-glassHover"
        >
          {showCreateForm ? "Close" : "Create Work Order"}
        </button>
      </FadeContent>

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-soft dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {showCreateForm ? (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={70}
          className="glass-surface p-6"
        >
          <form onSubmit={createWorkOrder} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-textPrimary">
                New Work Order
              </h2>
              <p className="mt-1 text-sm text-textSecondary">
                Create an operational work item and assign ownership.
              </p>
            </div>

            {createError ? <ErrorPanel message={createError} /> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted md:col-span-2">
                Title
                <input
                  required
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                  placeholder="Describe the work order"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Category
                <select
                  value={createForm.type}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                >
                  {WORK_ORDER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Company / Division
                <select
                  value={createForm.division}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      division: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                >
                  {DIVISIONS.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Owner
                <select
                  value={createForm.owner}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      owner: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                >
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Status
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                >
                  <option value="open">Open</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting">Waiting</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Priority
                <select
                  value={createForm.priority}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Due Date
                <input
                  type="date"
                  value={createForm.due_date}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      due_date: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted md:col-span-2">
                Description
                <textarea
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-28 rounded-xl border border-white/30 bg-white/55 px-3 py-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                  placeholder="Add the operational context, location, blockers, or notes."
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted md:col-span-2">
                Notes
                <textarea
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="min-h-24 rounded-xl border border-white/30 bg-white/55 px-3 py-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
                  placeholder="Add follow-up notes, constraints, or handoff details."
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-accent/90 px-5 text-sm font-semibold text-white shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-accent hover:shadow-glassHover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Work Order"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm(EMPTY_WORK_ORDER_FORM);
                  setCreateError(null);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/55 px-5 text-sm font-semibold text-textPrimary shadow-glass backdrop-blur-xl transition-all hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </FadeContent>
      ) : null}

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={90}
        className="glass-surface p-6"
      >
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted sm:max-w-xs">
          Status Filter
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
          >
            <option>All</option>
            <option>Open</option>
            <option>Scheduled</option>
            <option>In Progress</option>
            <option>Waiting</option>
            <option>Complete</option>
            <option>Canceled</option>
          </select>
        </label>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading work orders..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={120}
          className="glass-surface overflow-hidden"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                <tr>
                  <th className="px-5 py-4 font-semibold">Title</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Division</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Owner</th>
                  <th className="px-5 py-4 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {filteredWorkOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    onClick={() => router.push(`/work-orders/${workOrder.id}`)}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4 font-medium text-textPrimary">
                      {workOrder.title}
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {workOrder.type || "Uncategorized"}
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {workOrder.division || "Operations"}
                    </td>
                    <td className="px-5 py-4">
                      <TaskStatusBadge status={workOrder.status} />
                    </td>
                    <td className="px-5 py-4">
                      <TaskPriorityBadge priority={workOrder.priority} />
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {workOrder.owner_name || "Unassigned"}
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {formatDate(workOrder.due_date)}
                    </td>
                  </tr>
                ))}

                {filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-textSecondary"
                    >
                      No work orders match this status filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {filteredWorkOrders.map((workOrder) => (
              <Link key={workOrder.id} href={`/work-orders/${workOrder.id}`}>
                <article className="glass-surface p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-textPrimary">
                        {workOrder.title}
                      </h2>
                      <p className="text-sm text-textSecondary">
                        {workOrder.type || "Uncategorized"}
                      </p>
                    </div>
                    <TaskPriorityBadge priority={workOrder.priority} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TaskStatusBadge status={workOrder.status} />
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    <InfoRow
                      label="Owner"
                      value={workOrder.owner_name || "Unassigned"}
                    />
                    <InfoRow
                      label="Due Date"
                      value={formatDate(workOrder.due_date)}
                    />
                  </dl>
                </article>
              </Link>
            ))}

            {filteredWorkOrders.length === 0 ? (
              <article className="rounded-2xl border border-dashed border-white/30 bg-white/45 p-8 text-center text-sm text-textSecondary shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                No work orders match this status filter.
              </article>
            ) : null}
          </div>
        </FadeContent>
      )}
    </div>
  );
}

function toWorkOrderFilterFromParam(value: string | null) {
  const normalized = (value || "").toLowerCase();

  if (normalized === "open") return "Open";
  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "in_progress" || normalized === "in-progress") {
    return "In Progress";
  }
  if (normalized === "pending" || normalized === "waiting") return "Waiting";
  if (normalized === "completed" || normalized === "complete") {
    return "Complete";
  }
  if (normalized === "canceled" || normalized === "cancelled") {
    return "Canceled";
  }

  return "All";
}

function toFilterStatus(status: string | null) {
  const normalized = (status || "open").toLowerCase();

  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "pending" || normalized === "waiting") return "Waiting";
  if (normalized === "completed" || normalized === "complete")
    return "Complete";
  if (normalized === "canceled" || normalized === "cancelled") {
    return "Canceled";
  }
  return "Open";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-borderSubtle pt-3 first:border-t-0 first:pt-0">
      <dt className="text-textMuted">{label}</dt>
      <dd className="text-right text-textPrimary">{value}</dd>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string | null }) {
  const normalized = (status || "todo").toLowerCase();
  const styles: Record<string, string> = {
    todo: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    pending:
      "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    in_progress:
      "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    completed:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    blocked: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[normalized] || styles.todo}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

function TaskPriorityBadge({ priority }: { priority: string | null }) {
  const normalized = (priority || "low").toLowerCase();
  const styles: Record<string, string> = {
    high: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    low: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${styles[normalized] || styles.low}`}
    >
      {normalized}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "No due date";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-12 text-center text-sm text-textSecondary shadow-soft backdrop-blur-xl">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
