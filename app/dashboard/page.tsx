"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Wrench,
  AlertTriangle,
  Users,
  Flame,
  Ban,
} from "lucide-react";

type DashboardStats = {
  total_tasks: number;
  open_work_orders: number;
  low_stock_items: number;
  total_employees: number;
  high_priority_tasks: number;
  blocked_tasks: number;
};

type Task = {
  id: number;
  title: string;
  status: string | null;
  priority: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const EMPTY_STATS: DashboardStats = {
  total_tasks: 0,
  open_work_orders: 0,
  low_stock_items: 0,
  total_employees: 0,
  high_priority_tasks: 0,
  blocked_tasks: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, tasksResponse] = await Promise.all([
          fetch("/api/dashboard", { cache: "no-store" }),
          fetch("/api/tasks", { cache: "no-store" }),
        ]);

        if (!statsResponse.ok) {
          throw new Error(`Failed to load dashboard (${statsResponse.status})`);
        }

        if (!tasksResponse.ok) {
          throw new Error(`Failed to load tasks (${tasksResponse.status})`);
        }

        const statsData = (await statsResponse.json()) as DashboardStats;
        const tasksData = (await tasksResponse.json()) as Task[];

        if (!cancelled) {
          setStats(statsData);
          setTasks(tasksData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load dashboard",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const quickTasks = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          task.priority?.toLowerCase() === "high" ||
          task.status?.toLowerCase() === "blocked",
      )
      .sort((left, right) => {
        const leftDate = new Date(
          left.updated_at || left.created_at || left.due_date || 0,
        ).getTime();
        const rightDate = new Date(
          right.updated_at || right.created_at || right.due_date || 0,
        ).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 5);
  }, [tasks]);

  const statCards = [
    {
      label: "Total Tasks",
      value: stats.total_tasks,
      icon: ClipboardList,
      color: "text-sky-500",
    },
    {
      label: "Open Work Orders",
      value: stats.open_work_orders,
      icon: Wrench,
      color: "text-sky-500",
    },
    {
      label: "Low Stock Items",
      value: stats.low_stock_items,
      icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      label: "Total Employees",
      value: stats.total_employees,
      icon: Users,
      color: "text-sky-500",
    },
    {
      label: "High Priority Tasks",
      value: stats.high_priority_tasks,
      icon: Flame,
      color: "text-red-500",
    },
    {
      label: "Blocked Tasks",
      value: stats.blocked_tasks,
      icon: Ban,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          Dashboard
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Live operational snapshot backed directly by PostgreSQL.
        </p>
      </header>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading dashboard..." />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-xl border border-borderSubtle bg-surface p-5 shadow-soft"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-5 w-5 ${card.color}`} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                      {card.label}
                    </p>
                  </div>
                  <p className="mt-3 text-5xl font-bold text-textPrimary">
                    {card.value}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="rounded-xl border border-borderSubtle bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-textPrimary">
                  Priority Watchlist
                </h2>
                <p className="text-sm text-textSecondary">
                  Five most recent high-priority or blocked tasks.
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                {quickTasks.length} items
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {quickTasks.length === 0 ? (
                <p className="text-sm text-textSecondary">
                  No high-priority or blocked tasks found.
                </p>
              ) : (
                quickTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-lg border border-borderSubtle bg-bgDark p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-textPrimary">
                          {task.title}
                        </h3>
                        <p className="mt-1 text-sm text-textSecondary">
                          {task.assigned_to_name || "Unassigned"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TaskStatusBadge status={task.status} />
                        <TaskPriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-textMuted">
                      Due {formatDate(task.due_date)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
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
