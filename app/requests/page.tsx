"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type RequestPriority = "Low" | "Medium" | "High" | "Urgent";
type RequestStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Denied"
  | "Completed";

type Request = {
  id: number;
  request_id: string;
  requester: string;
  category: string;
  priority: RequestPriority;
  status: RequestStatus;
  submitted_date: string;
  assigned_reviewer: string | null;
  description: string | null;
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/requests", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load requests (${response.status})`);
        }

        const data = (await response.json()) as Request[];
        if (!cancelled) {
          setRequests(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load requests",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      total: requests.length,
      underReview: requests.filter(
        (request) => request.status === "Under Review",
      ).length,
      approved: requests.filter((request) => request.status === "Approved")
        .length,
    };
  }, [requests]);

  function openRequest(request: Request) {
    router.prefetch("/requests");
    setSelectedRequest(request);
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
          <ShinyText>Requests</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Internal requests from submission through approval.
        </p>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={90}
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatCard label="Total" value={metrics.total} />
        <StatCard label="Under Review" value={metrics.underReview} />
        <StatCard label="Approved" value={metrics.approved} />
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading requests..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={120}
          className="glass-surface overflow-hidden"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">Requester</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => openRequest(request)}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-textPrimary">
                        {request.requester}
                      </div>
                      <div className="text-xs text-textMuted">
                        {request.request_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {request.category}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={request.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {formatDate(request.submitted_date)}
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {request.assigned_reviewer || "Unassigned"}
                    </td>
                  </tr>
                ))}

                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-textSecondary"
                    >
                      No requests are available.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {requests.map((request) => (
              <article
                key={request.id}
                onClick={() => openRequest(request)}
                className="glass-surface cursor-pointer p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-textPrimary">
                      {request.requester}
                    </p>
                    <p className="mt-0.5 text-xs text-textMuted">
                      {request.request_id}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileField label="Category" value={request.category} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                      Priority
                    </p>
                    <div className="mt-1">
                      <PriorityBadge priority={request.priority} />
                    </div>
                  </div>
                  <MobileField
                    label="Submitted"
                    value={formatDate(request.submitted_date)}
                  />
                  <MobileField
                    label="Reviewer"
                    value={request.assigned_reviewer || "Unassigned"}
                  />
                </div>
              </article>
            ))}

            {requests.length === 0 ? (
              <article className="rounded-2xl border border-dashed border-white/30 bg-white/45 p-8 text-center text-sm text-textSecondary shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                No requests are available.
              </article>
            ) : null}
          </div>
        </FadeContent>
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 border-l border-white/30 bg-white/75 p-6 shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-transform duration-200 dark:border-white/10 dark:bg-slate-950/75 dark:ring-white/10 ${
          selectedRequest ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={selectedRequest ? "false" : "true"}
      >
        {selectedRequest ? (
          <div className="flex h-full flex-col">
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="absolute right-4 top-4 rounded-md border border-borderSubtle p-1.5 text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary"
              aria-label="Close request details"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pr-10">
              <h2 className="text-lg font-semibold text-textPrimary">
                {selectedRequest.request_id}
              </h2>
              <p className="mt-1 text-sm text-textSecondary">
                {selectedRequest.requester}
              </p>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <SlideOverRow
                label="Requester"
                value={selectedRequest.requester}
              />
              <SlideOverRow label="Category" value={selectedRequest.category} />
              <SlideOverRow
                label="Priority"
                value={<PriorityBadge priority={selectedRequest.priority} />}
              />
              <SlideOverRow
                label="Status"
                value={<StatusBadge status={selectedRequest.status} />}
              />
              <SlideOverRow
                label="Submitted"
                value={formatDate(selectedRequest.submitted_date)}
              />
              <SlideOverRow
                label="Reviewer"
                value={selectedRequest.assigned_reviewer || "Unassigned"}
              />
            </dl>

            <div className="mt-6 border-t border-borderSubtle pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                Description
              </p>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                {selectedRequest.description || "No description provided."}
              </p>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-textPrimary">{value}</p>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const styles: Record<RequestPriority, string> = {
    Low: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    Medium: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    High: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Urgent: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return <Badge label={priority} className={styles[priority]} />;
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Submitted:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    "Under Review":
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Approved:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    Denied: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    Completed:
      "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };

  return <Badge label={status} className={styles[status]} />;
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-1 text-textSecondary">{value}</p>
    </div>
  );
}

function SlideOverRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-borderSubtle pt-4 first:border-t-0 first:pt-0">
      <dt className="text-textMuted">{label}</dt>
      <dd className="text-right text-textPrimary">{value}</dd>
    </div>
  );
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

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
