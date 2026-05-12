import Link from "next/link";
import { AlertTriangle, ArrowRightCircle, Clock, Zap } from "lucide-react";

const automations = [
  {
    title: "Work Order Notifications",
    description:
      "Triggers an alert when a work order status changes to In Progress or Completed.",
    status: "Active",
    meta: "Last run: Continuous",
    icon: Zap,
    iconClassName: "text-accent",
  },
  {
    title: "Low Inventory Alerts",
    description:
      "Monitors inventory nightly and sends an alert when any item falls below its reorder threshold.",
    status: "Active",
    meta: "Last run: Daily at 11:00 PM",
    icon: AlertTriangle,
    iconClassName: "text-amber-500",
  },
  {
    title: "Timesheet Submission Reminder",
    description:
      "Reminds employees every Friday at 4:00 PM to submit their weekly timesheet before payroll cutoff.",
    status: "Active",
    meta: "Last run: Weekly - Fridays",
    icon: Clock,
    iconClassName: "text-accent",
  },
  {
    title: "New Request Intake",
    description:
      "When a new internal request is submitted, routes it to the assigned reviewer with a summary notification.",
    status: "Scheduled",
    meta: "Last run: Pending activation",
    icon: ArrowRightCircle,
    iconClassName: "text-amber-500",
  },
];

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
            Automations
          </h1>
          <p className="max-w-3xl text-sm text-textSecondary">
            Workflow automations managed via n8n.
          </p>
        </div>
        <Link
          href="https://auto.snrglabs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accentSoft"
        >
          Open n8n Dashboard -&gt;
        </Link>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {automations.map((automation) => {
          const Icon = automation.icon;
          return (
            <article
              key={automation.title}
              className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-lg bg-bgDark p-2">
                  <Icon className={`h-5 w-5 ${automation.iconClassName}`} />
                </div>
                <StatusBadge status={automation.status} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-textPrimary">
                {automation.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-textSecondary">
                {automation.description}
              </p>
              <p className="mt-4 border-t border-borderSubtle pt-3 text-sm text-textMuted">
                {automation.meta}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  const styles = active
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
