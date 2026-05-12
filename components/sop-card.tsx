import type { Sop } from "@/types/workspace";

type SopCardProps = {
  sop: Sop;
};

const STATUS_STYLES: Record<Sop["status"], string> = {
  Draft:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  Active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  "Needs Review":
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  Archived:
    "bg-slate-100 text-textMuted border-slate-200 dark:bg-slate-500/10 dark:border-slate-400/30",
};

export function SopCard({ sop }: SopCardProps) {
  const relatedItems = [
    sop.relatedFileIds?.length
      ? `${sop.relatedFileIds.length} file${sop.relatedFileIds.length === 1 ? "" : "s"}`
      : null,
    sop.relatedFormIds?.length
      ? `${sop.relatedFormIds.length} form${sop.relatedFormIds.length === 1 ? "" : "s"}`
      : null,
    sop.relatedTaskIds?.length
      ? `${sop.relatedTaskIds.length} task${sop.relatedTaskIds.length === 1 ? "" : "s"}`
      : null,
    sop.relatedWorkOrderIds?.length
      ? `${sop.relatedWorkOrderIds.length} work order${sop.relatedWorkOrderIds.length === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  return (
    <article className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft transition-colors hover:border-borderHover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-textDisabled">
            {sop.id}
          </p>
          <h3 className="mt-1 text-base font-semibold text-navy">
            {sop.title}
          </h3>
        </div>
        <span
          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[sop.status]}`}
        >
          {sop.status}
        </span>
      </div>

      <p className="mt-3 text-sm text-textSecondary">{sop.description}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-textDisabled">
            Category
          </dt>
          <dd className="mt-1 text-textPrimary">{sop.category}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-textDisabled">
            Department
          </dt>
          <dd className="mt-1 text-textPrimary">{sop.department}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-textDisabled">
            Owner
          </dt>
          <dd className="mt-1 text-textPrimary">{sop.owner}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-textDisabled">
            Last Updated
          </dt>
          <dd className="mt-1 text-textPrimary">
            {formatDate(sop.lastUpdated)}
          </dd>
        </div>
        {sop.reviewDate && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-textDisabled">
              Review Date
            </dt>
            <dd className="mt-1 text-textPrimary">
              {formatDate(sop.reviewDate)}
            </dd>
          </div>
        )}
      </dl>

      {relatedItems.length > 0 && (
        <p className="mt-4 rounded-md bg-bgDark px-3 py-2 text-xs text-textMuted">
          Related resources: {relatedItems.join(" • ")}
        </p>
      )}

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-md border border-borderSubtle bg-surface px-3 text-xs font-semibold text-textPrimary transition-colors hover:bg-bgDark"
        >
          View SOP
        </button>
      </div>
    </article>
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
