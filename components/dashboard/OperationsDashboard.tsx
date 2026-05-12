import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  CheckSquare,
  ClipboardText,
  FileText,
  Briefcase,
  Users,
} from "phosphor-react";
import { KpiCard } from "@/components/ui/KpiCard";

const dashboardCards = [
  {
    label: "Open Tasks",
    value: 24,
    delta: "4 added today",
    variant: "blue" as const,
    icon: <CheckSquare className="h-5 w-5" weight="duotone" />,
  },
  {
    label: "Due Today",
    value: 7,
    delta: "Needs review",
    variant: "warning" as const,
    icon: <Calendar className="h-5 w-5" weight="duotone" />,
  },
  {
    label: "Overdue",
    value: 3,
    delta: "Action required",
    variant: "danger" as const,
    icon: <FileText className="h-5 w-5" weight="duotone" />,
  },
  {
    label: "Assigned To Me",
    value: 11,
    delta: "2 due this week",
    variant: "blue" as const,
    icon: <CheckCircle className="h-5 w-5" weight="duotone" />,
  },
  {
    label: "Forms Submitted This Week",
    value: 18,
    delta: "+6 vs last week",
    variant: "success" as const,
    icon: <ClipboardText className="h-5 w-5" weight="duotone" />,
  },
  {
    label: "Team Members Active",
    value: 9,
    delta: "of 12 total",
    variant: "blue" as const,
    icon: <Users className="h-5 w-5" weight="duotone" />,
  },
];

const quickLinks = [
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Projection Calendar", href: "/calendar", icon: Calendar },
  { label: "Forms Center", href: "/forms", icon: ClipboardText },
  { label: "Work Orders", href: "/work-orders", icon: Briefcase },
];

export function OperationsDashboard() {
  return (
    <div className="space-y-6 font-sans">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-textMuted">
          Track current work, team activity, forms, and scheduled operations.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            delta={card.delta}
            variant={card.variant}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-navy">Quick Links</h2>
            <p className="mt-1 text-sm text-textMuted">
              Open the core workspaces used throughout the day.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex min-h-20 items-center gap-3 rounded-md border border-borderSubtle bg-white px-4 py-3 text-left transition-colors hover:border-navy hover:bg-bgDark"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#EFF6FF] text-accent group-hover:bg-navy group-hover:text-white">
                  <Icon className="h-5 w-5" weight="duotone" />
                </span>
                <span className="text-sm font-semibold text-textPrimary">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
