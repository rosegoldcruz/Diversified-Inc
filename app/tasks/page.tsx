"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

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

  const statusParam = searchParams?.get("status") ?? null;
  const priorityParam = searchParams?.get("priority") ?? null;

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
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-2"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
            <ShinyText>Tasks</ShinyText>
          </h1>
          <span className="inline-flex rounded-xl border border-white/30 bg-white/55 px-3 py-1 text-xs font-medium text-textMuted shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            {filteredTasks.length} of {tasks.length} Tasks
          </span>
        </div>
        <p className="max-w-3xl text-base text-textSecondary">
          Live task queue from PostgreSQL with assignment, priority, and due
          date visibility.
        </p>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={90}
        className="glass-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Filter By Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
            >
              <option>All</option>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Waiting</option>
              <option>Complete</option>
              <option>Blocked</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Filter By Priority
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
            >
              <option>All</option>
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </label>
        </div>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading tasks..." />
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
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Assigned To</th>
                  <th className="px-5 py-4 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4 font-medium text-textPrimary">
                      {task.title}
                    </td>
                    <td className="px-5 py-4">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4">
                      <TaskPriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {task.assigned_to_name || "Unassigned"}
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
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
                <article className="glass-surface p-5">
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
              <article className="rounded-2xl border border-dashed border-white/30 bg-white/45 p-8 text-center text-sm text-textSecondary shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                No tasks match the selected filters.
              </article>
            ) : null}
          </div>
        </FadeContent>
      )}
    </div>
  );
}

function toStatusFilterFromParam(value: string | null) {
  const normalized = (value || "").toLowerCase();
  if (
    normalized === "todo" ||
    normalized === "not_started" ||
    normalized === "not-started"
  ) {
    return "Not Started";
  }
  if (normalized === "in_progress" || normalized === "in-progress") {
    return "In Progress";
  }
  if (normalized === "waiting") return "Waiting";
  if (normalized === "completed" || normalized === "complete") {
    return "Complete";
  }
  if (normalized === "blocked") return "Blocked";
  return "All";
}

function toPriorityFilterFromParam(value: string | null) {
  const normalized = (value || "").toLowerCase();
  if (normalized === "urgent") return "Urgent";
  if (normalized === "high") return "High";
  if (normalized === "medium" || normalized === "normal") return "Normal";
  if (normalized === "low") return "Low";
  return "All";
}

function toStatusFilterValue(status: string | null) {
  const normalized = (status || "todo").toLowerCase();
  if (normalized === "todo" || normalized === "not_started") {
    return "Not Started";
  }
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "waiting") return "Waiting";
  if (normalized === "completed" || normalized === "complete")
    return "Complete";
  if (normalized === "blocked") return "Blocked";
  return "Not Started";
}

function toPriorityFilterValue(priority: string | null) {
  const normalized = (priority || "low").toLowerCase();
  if (normalized === "urgent") return "Urgent";
  if (normalized === "high") return "High";
  if (normalized === "medium" || normalized === "normal") return "Normal";
  return "Low";
}

function TaskStatusBadge({ status }: { status: string | null }) {
  const normalized = (status || "todo").toLowerCase();
  const styles: Record<string, string> = {
    todo: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    not_started:
      "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    in_progress:
      "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    completed:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    complete:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    waiting:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    blocked: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  const labels: Record<string, string> = {
    todo: "Not Started",
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Complete",
    complete: "Complete",
    waiting: "Waiting",
    blocked: "Blocked",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[normalized] || styles.todo}`}
    >
      {labels[normalized] || "Not Started"}
    </span>
  );
}

function TaskPriorityBadge({ priority }: { priority: string | null }) {
  const normalized = (priority || "low").toLowerCase();
  const styles: Record<string, string> = {
    urgent:
      "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    high: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    normal:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    low: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };

  const labels: Record<string, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Normal",
    normal: "Normal",
    low: "Low",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${styles[normalized] || styles.low}`}
    >
      {labels[normalized] || "Low"}
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
    <div className="rounded-xl border border-red-200 bg-red-50/90 p-5 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
