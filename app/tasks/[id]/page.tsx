"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TaskDetail = {
  id: number;
  title: string;
  description: string | null;
  notes?: string | null;
  status: string | null;
  priority: string | null;
  assigned_to_name: string | null;
  assigned_department: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const STATUS_OPTIONS = [
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "blocked" },
];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [status, setStatus] = useState("todo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setError("Invalid task id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTask() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tasks/${taskId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load task (${response.status})`);
        }

        const data = (await response.json()) as TaskDetail;

        if (!cancelled) {
          setTask(data);
          setStatus((data.status || "todo").toLowerCase());
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load task",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function updateStatus() {
    if (!taskId) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task (${response.status})`);
      }

      const data = (await response.json()) as TaskDetail;
      setTask(data);
      setStatus((data.status || status).toLowerCase());
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update task",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
        Loading task...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-textSecondary hover:text-textPrimary"
        >
          ← Back to Tasks
        </button>
        <p className="text-sm text-red-700 dark:text-red-300">
          {error || "Task not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-medium text-textSecondary hover:text-textPrimary"
      >
        ← Back to Tasks
      </button>

      <section className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-textPrimary">{task.title}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <dl className="grid gap-3 rounded-lg border border-borderSubtle bg-bgDark p-4 sm:grid-cols-2">
          <InfoRow label="Assigned To" value={task.assigned_to_name || "Unassigned"} />
          <InfoRow label="Due Date" value={formatDate(task.due_date)} />
          <InfoRow
            label="Department"
            value={task.assigned_department || "Not specified"}
          />
          <InfoRow label="Created At" value={formatDateTime(task.created_at)} />
        </dl>

        <section className="rounded-lg border border-borderSubtle bg-bgDark p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-textMuted">
            Description
          </h2>
          <p className="mt-2 text-sm text-textSecondary">
            {task.description || task.notes || "No description or notes available."}
          </p>
        </section>

        <section className="rounded-lg border border-borderSubtle bg-bgDark p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-textMuted">
            Update Status
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 min-w-52 rounded-md border border-borderSubtle bg-surface px-3 text-sm text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={updateStatus}
              disabled={saving}
              className="h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Status"}
            </button>
          </div>
        </section>

        <p className="text-sm text-textMuted">
          Last updated: {formatDateTime(task.updated_at || task.created_at)}
        </p>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-textPrimary">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
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
      {labelize(normalized)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
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

function labelize(value: string) {
  if (value === "in_progress") {
    return "In Progress";
  }
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
