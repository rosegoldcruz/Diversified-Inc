"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type WorkOrder = {
  id: number;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  owner_name: string | null;
  due_date: string | null;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusParam = searchParams.get("status");

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
    setStatusFilter(toWorkOrderFilterFromParam(statusParam));
  }, [statusParam]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
            Work Orders
          </h1>
          <span className="inline-flex rounded-md border border-borderSubtle bg-bgDark px-3 py-1 text-xs font-medium text-textMuted">
            {filteredWorkOrders.length} of {workOrders.length} Work Orders
          </span>
        </div>
        <p className="max-w-3xl text-sm text-textSecondary">
          Live work orders with type, priority, ownership, and due dates from
          PostgreSQL.
        </p>
      </header>

      <section className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted sm:max-w-xs">
          Status Filter
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-borderSubtle bg-bgDark px-3 text-sm font-medium normal-case text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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
      </section>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading work orders..." />
      ) : (
        <section className="overflow-hidden rounded-lg border border-borderSubtle bg-surface shadow-soft">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-bgDark text-xs uppercase tracking-wide text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {filteredWorkOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    onClick={() => router.push(`/work-orders/${workOrder.id}`)}
                    className="cursor-pointer transition-colors hover:bg-bgDark"
                  >
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {workOrder.title}
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {workOrder.type || "Uncategorized"}
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={workOrder.status} />
                    </td>
                    <td className="px-4 py-3">
                      <TaskPriorityBadge priority={workOrder.priority} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {workOrder.owner_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {formatDate(workOrder.due_date)}
                    </td>
                  </tr>
                ))}

                {filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                <article className="rounded-lg border border-borderSubtle bg-bgDark p-5 shadow-soft">
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
              <article className="rounded-lg border border-dashed border-borderSubtle bg-bgDark p-8 text-center text-sm text-textSecondary">
                No work orders match this status filter.
              </article>
            ) : null}
          </div>
        </section>
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
    <div className="rounded-lg border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
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
