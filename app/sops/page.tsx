"use client";

import { useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type Sop = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  owner_name: string | null;
  status: string | null;
  version: string | number | null;
  last_updated: string | null;
};

export default function SopsPage() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredSops = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sops;
    }

    return sops.filter((sop) => {
      const title = sop.title.toLowerCase();
      const description = (sop.description || "").toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [search, sops]);

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
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load SOPs",
          );
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
            <ShinyText>SOPs</ShinyText>
          </h1>
          <span className="inline-flex rounded-xl border border-white/30 bg-white/55 px-3 py-1 text-xs font-medium text-textMuted shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            {filteredSops.length} of {sops.length} SOPs
          </span>
        </div>
        <p className="max-w-3xl text-base text-textSecondary">
          Live standard operating procedures from PostgreSQL with ownership,
          versioning, and review status.
        </p>
      </FadeContent>

      <FadeContent
        blur={true}
        duration={800}
        delay={90}
        className="glass-surface p-5"
      >
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SOPs..."
            className="h-10 w-full rounded-xl border border-white/30 bg-white/55 px-3 pr-10 text-sm text-textPrimary outline-none backdrop-blur-xl transition-colors placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
          />
          {search.trim() ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear SOP search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-base leading-none text-textMuted transition-colors hover:bg-borderSubtle hover:text-textPrimary"
            >
              ×
            </button>
          ) : null}
        </div>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading SOPs..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={120}
          className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
        >
          {filteredSops.map((sop) => (
            <article
              key={sop.id}
              className="glass-surface glass-surface-hover p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CategoryBadge category={sop.category} />
                  <h2 className="mt-2 text-xl font-bold text-textPrimary">
                    {sop.title}
                  </h2>
                </div>
                <SopStatusBadge status={sop.status} />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <InfoRow label="Owner" value={sop.owner_name || "Unassigned"} />
                <InfoRow label="Version" value={formatVersion(sop.version)} />
                <InfoRow
                  label="Last Updated"
                  value={formatDate(sop.last_updated)}
                />
              </dl>
            </article>
          ))}

          {filteredSops.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-white/30 bg-white/45 p-8 text-center text-sm text-textSecondary shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 lg:col-span-2 xl:col-span-3">
              No SOPs match this search.
            </article>
          ) : null}
        </FadeContent>
      )}
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  const label = category || "General";
  const normalized = label.toLowerCase();
  const styles = getCategoryStyle(normalized);

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
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
  const normalized = normalizeStatus(status);
  const styles: Record<string, string> = {
    active:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    under_review:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    archived:
      "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };

  const labels: Record<string, string> = {
    active: "Active",
    under_review: "Under Review",
    archived: "Archived",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[normalized] || styles.archived}`}
    >
      {labels[normalized] || "Archived"}
    </span>
  );
}

function normalizeStatus(status: string | null) {
  const normalized = (status || "archived").toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "under_review" || normalized === "needs_review")
    return "under_review";
  if (normalized === "archived") return "archived";
  return "archived";
}

function getCategoryStyle(category: string) {
  if (category.includes("hr") || category.includes("employee")) {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
  }
  if (category.includes("safety") || category.includes("field")) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  if (category.includes("inventory")) {
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
  }
  if (category.includes("work order")) {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }
  if (category.includes("admin") || category.includes("office")) {
    return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
}

function formatVersion(value: string | number | null) {
  if (!value) {
    return "-";
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return "-";
  }

  return stringValue.toLowerCase().startsWith("v")
    ? stringValue
    : `v${stringValue}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
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
