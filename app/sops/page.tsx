"use client";

import { useEffect, useState } from "react";

type Sop = {
  id: number;
  title: string;
  category: string | null;
  owner_name: string | null;
  status: string | null;
  version: string | number | null;
  last_updated: string | null;
};

export default function SopsPage() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSops() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/sops", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load SOPs (${response.status})`);
        }

        const data = (await response.json()) as Sop[];
        if (!cancelled) {
          setSops(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load SOPs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSops();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">SOPs</h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Live standard operating procedures from PostgreSQL with ownership, versioning, and review status.
        </p>
      </header>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading SOPs..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sops.map((sop) => (
            <article key={sop.id} className="rounded-xl border border-borderSubtle bg-surface p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{sop.category || "General"}</p>
                  <h2 className="mt-1 text-lg font-semibold text-textPrimary">{sop.title}</h2>
                </div>
                <SopStatusBadge status={sop.status} />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <InfoRow label="Owner" value={sop.owner_name || "Unassigned"} />
                <InfoRow label="Version" value={String(sop.version || "-" )} />
                <InfoRow label="Last Updated" value={formatDate(sop.last_updated)} />
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-borderSubtle pt-3 first:border-t-0 first:pt-0">
      <dt className="text-textMuted">{label}</dt>
      <dd className="text-right text-textPrimary">{value}</dd>
    </div>
  );
}

function SopStatusBadge({ status }: { status: string | null }) {
  const normalized = (status || "draft").toLowerCase();
  const styles: Record<string, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    draft: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    archived: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    needs_review: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[normalized] || styles.draft}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

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
