"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
};

type Task = {
  id: number;
  title: string;
  status: string | null;
  priority: string | null;
  assigned_to_name: string | null;
  assigned_person_name?: string | null;
};

type TimeclockEntry = {
  id: number;
  employee_id: number | null;
  employee_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  notes: string | null;
  created_at: string;
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [recentEntries, setRecentEntries] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setError("Invalid employee id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [employeeResponse, tasksResponse, timeclockResponse] =
          await Promise.all([
            fetch(`/api/employees/${employeeId}`, { cache: "no-store" }),
            fetch("/api/tasks", { cache: "no-store" }),
            fetch("/api/timeclock", { cache: "no-store" }),
          ]);

        if (!employeeResponse.ok) {
          throw new Error(
            `Failed to load employee (${employeeResponse.status})`,
          );
        }
        if (!tasksResponse.ok) {
          throw new Error(`Failed to load tasks (${tasksResponse.status})`);
        }
        if (!timeclockResponse.ok) {
          throw new Error(
            `Failed to load timeclock entries (${timeclockResponse.status})`,
          );
        }

        const [employeeData, tasksData, timeclockData] = (await Promise.all([
          employeeResponse.json(),
          tasksResponse.json(),
          timeclockResponse.json(),
        ])) as [Employee, Task[], TimeclockEntry[]];

        const employeeName = employeeData.name.trim().toLowerCase();

        const filteredTasks = tasksData.filter((task) => {
          const assignedTo = (task.assigned_to_name || "").trim().toLowerCase();
          const assignedPerson = (task.assigned_person_name || "")
            .trim()
            .toLowerCase();

          return assignedTo === employeeName || assignedPerson === employeeName;
        });

        const filteredEntries = timeclockData
          .filter((entry) => {
            const byId = entry.employee_id === employeeData.id;
            const byName =
              entry.employee_name.trim().toLowerCase() === employeeName;
            return byId || byName;
          })
          .slice(0, 5);

        if (!cancelled) {
          setEmployee(employeeData);
          setAssignedTasks(filteredTasks);
          setRecentEntries(filteredEntries);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load employee details",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
        Loading employee...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-textSecondary hover:text-textPrimary"
        >
          ← Back to Employees
        </button>
        <p className="text-sm text-red-700 dark:text-red-300">
          {error || "Employee not found"}
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
        ← Back to Employees
      </button>

      <section className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-textPrimary">
              {employee.name}
            </h1>
            <p className="mt-1 text-sm text-textSecondary">
              {employee.role || "Title not set"}
            </p>
          </div>
          <StatusBadge status={employee.status} />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <dl className="grid gap-3 rounded-lg border border-borderSubtle bg-bgDark p-4 sm:grid-cols-3">
          <InfoRow
            label="Department"
            value={employee.department || "Not set"}
          />
          <InfoRow label="Email" value={employee.email || "Not set"} />
          <InfoRow label="Phone" value={employee.phone || "Not set"} />
        </dl>
      </section>

      <section className="rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-textPrimary">
          Assigned Tasks
        </h2>
        <div className="mt-4 space-y-3">
          {assignedTasks.length === 0 ? (
            <p className="text-sm text-textSecondary">
              No assigned tasks found.
            </p>
          ) : (
            assignedTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-lg border border-borderSubtle bg-bgDark p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-medium text-textPrimary">{task.title}</h3>
                  <div className="flex gap-2">
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-textPrimary">
          Recent Timeclock
        </h2>
        <div className="mt-4 space-y-3">
          {recentEntries.length === 0 ? (
            <p className="text-sm text-textSecondary">
              No recent timeclock entries.
            </p>
          ) : (
            recentEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-lg border border-borderSubtle bg-bgDark p-4"
              >
                <p className="text-sm text-textPrimary">
                  {formatDateTime(entry.clock_in)} to{" "}
                  {entry.clock_out ? formatDateTime(entry.clock_out) : "Active"}
                </p>
                <p className="mt-1 text-sm text-textSecondary">
                  Total: {entry.total_minutes ?? "-"} minutes
                </p>
                {entry.notes ? (
                  <p className="mt-1 text-sm text-textMuted">{entry.notes}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
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
  const normalized =
    status?.toLowerCase() === "inactive" ? "inactive" : "active";
  const styles =
    normalized === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {normalized}
    </span>
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
