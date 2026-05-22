"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type WorkOrderDetail = {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  status: string | null;
  priority: string | null;
  owner_name: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
  created_at: string | null;
  customer_name?: string | null;
  client_name?: string | null;
  site?: string | null;
  site_name?: string | null;
};

type SessionUser = {
  role: "Employee" | "Manager" | "Admin" | "Leadership";
};

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);

  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [status, setStatus] = useState("open");
  const [me, setMe] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workOrderId) {
      setError("Invalid work order id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadWorkOrder() {
      try {
        setLoading(true);
        setError(null);

        const [response, meResponse] = await Promise.all([
          fetch(`/api/work-orders/${workOrderId}`, {
            cache: "no-store",
          }),
          fetch("/api/auth/me", { cache: "no-store" }),
        ]);

        if (!response.ok) {
          throw new Error(`Failed to load work order (${response.status})`);
        }

        const data = (await response.json()) as WorkOrderDetail;

        if (!cancelled) {
          setWorkOrder(data);
          setStatus((data.status || "open").toLowerCase());
          if (meResponse.ok) {
            const meData = (await meResponse.json()) as {
              user: SessionUser | null;
            };
            setMe(meData.user);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load work order",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkOrder();

    return () => {
      cancelled = true;
    };
  }, [workOrderId]);

  const canDelete =
    me?.role === "Manager" || me?.role === "Admin" || me?.role === "Leadership";

  async function updateStatus() {
    if (!workOrderId) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update work order (${response.status})`);
      }

      const data = (await response.json()) as WorkOrderDetail;
      setWorkOrder(data);
      setStatus((data.status || status).toLowerCase());
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update work order",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkOrder() {
    if (!workOrderId || !workOrder) {
      return;
    }

    const confirmed = window.confirm(
      `Delete work order \"${workOrder.title}\"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          payload?.error || `Failed to delete work order (${response.status})`,
        );
      }

      router.push("/work-orders");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete work order",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-borderSubtle bg-surface/95 p-12 text-center text-sm text-textSecondary shadow-soft backdrop-blur-xl">
        Loading work order...
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="space-y-4 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-textSecondary hover:text-textPrimary"
        >
          ← Back to Work Orders
        </button>
        <p className="text-sm text-red-700 dark:text-red-300">
          {error || "Work order not found"}
        </p>
      </div>
    );
  }

  const clientValue =
    workOrder.client_name || workOrder.customer_name || "Not specified";
  const siteValue = workOrder.site_name || workOrder.site || "Not specified";
  const assignee =
    workOrder.assigned_to_name || workOrder.owner_name || "Unassigned";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-medium text-textSecondary hover:text-textPrimary"
      >
        ← Back to Work Orders
      </button>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-textPrimary">
              {workOrder.title}
            </h1>
            <p className="mt-1 text-sm text-textMuted">WO-{workOrder.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
            {canDelete ? (
              <button
                type="button"
                onClick={deleteWorkOrder}
                disabled={deleting}
                className="h-9 rounded-md border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <dl className="grid gap-3 rounded-lg border border-borderSubtle bg-bgDark p-4 sm:grid-cols-2">
          <InfoRow
            label="Client/Site"
            value={`${clientValue} / ${siteValue}`}
          />
          <InfoRow label="Assigned To" value={assignee} />
          <InfoRow label="Due Date" value={formatDate(workOrder.due_date)} />
          <InfoRow
            label="Created At"
            value={formatDateTime(workOrder.created_at)}
          />
        </dl>

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

        <section className="rounded-lg border border-borderSubtle bg-bgDark p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-textMuted">
            Timeline
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-textSecondary">
            <li>Created work order and added to operations queue.</li>
            <li>Status reviewed by operations manager.</li>
            <li>Current phase: {labelize(workOrder.status || "open")}.</li>
          </ul>
        </section>
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
  const normalized = (status || "open").toLowerCase();
  const styles: Record<string, string> = {
    open: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    in_progress:
      "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    pending:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    completed:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    cancelled: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    closed:
      "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[normalized] || styles.open}`}
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
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${styles[normalized] || styles.low}`}
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
