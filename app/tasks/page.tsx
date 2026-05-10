"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  status: string | null;
  priority: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
};

export default function TasksPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading tasks..." />}>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatches =
        statusFilter === "All" ||
        toStatusFilterValue(task.status) === statusFilter;
      const priorityMatches =
        priorityFilter === "All" ||
        toPriorityFilterValue(task.priority) === priorityFilter;
      return statusMatches && priorityMatches;
    });
  }, [priorityFilter, statusFilter, tasks]);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/tasks", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load tasks (${response.status})`);
        }

        const data = (await response.json()) as Task[];
        if (!cancelled) {
          setTasks(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load tasks",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextStatus = toStatusFilterFromParam(statusParam);
    const nextPriority = toPriorityFilterFromParam(priorityParam);
    setStatusFilter(nextStatus);
    setPriorityFilter(nextPriority);
  }, [priorityParam, statusParam]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          Tasks
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Live task queue from PostgreSQL with assignment, priority, and due
          date visibility.
        </p>
      </header>

      <section className="rounded-xl border border-borderSubtle bg-surface p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Filter By Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-md border border-borderSubtle bg-bgDark px-3 text-sm font-medium normal-case text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option>All</option>
              <option>Todo</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Blocked</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Filter By Priority
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-10 rounded-md border border-borderSubtle bg-bgDark px-3 text-sm font-medium normal-case text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading tasks..." />
      ) : (
        <section className="overflow-hidden rounded-xl border border-borderSubtle bg-surface shadow-soft">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-bgDark text-xs uppercase tracking-wide text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="cursor-pointer transition-colors hover:bg-bgDark"
                  >
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {task.title}
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <TaskPriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {task.assigned_to_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {formatDate(task.due_date)}
                    </td>
                  </tr>
                ))}

                {filteredTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-textSecondary"
                    >
                      No tasks match the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {filteredTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <article className="rounded-lg border border-borderSubtle bg-bgDark p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-medium text-textPrimary">
                      {task.title}
                    </h2>
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <p className="mt-3 text-sm text-textSecondary">
                    Assigned to {task.assigned_to_name || "Unassigned"}
                  </p>
                  <p className="mt-1 text-sm text-textMuted">
                    Due {formatDate(task.due_date)}
                  </p>
                </article>
              </Link>
            ))}

            {filteredTasks.length === 0 ? (
              <article className="rounded-lg border border-dashed border-borderSubtle bg-bgDark p-6 text-center text-sm text-textSecondary">
                No tasks match the selected filters.
              </article>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

function toStatusFilterFromParam(value: string | null) {
  const normalized = (value || "").toLowerCase();
  if (normalized === "todo" || normalized === "not_started") return "Todo";
  if (normalized === "in_progress" || normalized === "in-progress") {
    return "In Progress";
  }
  if (normalized === "completed" || normalized === "complete") {
    return "Completed";
  }
  if (normalized === "blocked") return "Blocked";
  return "All";
}

function toPriorityFilterFromParam(value: string | null) {
  const normalized = (value || "").toLowerCase();
  if (normalized === "high" || normalized === "urgent") return "High";
  if (normalized === "medium" || normalized === "normal") return "Medium";
  if (normalized === "low") return "Low";
  return "All";
}

function toStatusFilterValue(status: string | null) {
  const normalized = (status || "todo").toLowerCase();
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "completed" || normalized === "complete")
    return "Completed";
  if (normalized === "blocked") return "Blocked";
  return "Todo";
}

function toPriorityFilterValue(priority: string | null) {
  const normalized = (priority || "low").toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "medium" || normalized === "normal") return "Medium";
  return "Low";
}

function TaskStatusBadge({ status }: { status: string | null }) {
  const normalized = (status || "todo").toLowerCase();
  const styles: Record<string, string> = {
    todo: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    in_progress:
      "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    completed:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    blocked: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[normalized] || styles.todo}`}
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
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[normalized] || styles.low}`}
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
    <div className="rounded-xl border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}
