import Link from "next/link";
import { AlertTriangle, ArrowRightCircle, Clock, Zap } from "lucide-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

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
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
            <ShinyText>Automations</ShinyText>
          </h1>
          <p className="max-w-3xl text-base text-textSecondary">
            Workflow automations managed via n8n.
          </p>
        </div>
        <Link
          href="https://auto.snrglabs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-accent/90 px-4 py-2 text-sm font-semibold text-white shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-accent hover:shadow-glassHover"
        >
          Open n8n Dashboard -&gt;
        </Link>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={100}
        className="grid gap-5 md:grid-cols-2"
      >
        {automations.map((automation) => {
          const Icon = automation.icon;
          return (
            <article
              key={automation.title}
              className="glass-surface glass-surface-hover p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-xl border border-white/30 bg-white/45 p-2 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
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
              <p className="mt-4 border-t border-white/30 pt-3 text-sm text-textMuted dark:border-white/10">
                {automation.meta}
              </p>
            </article>
          );
        })}
      </FadeContent>
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
