"use client";

import Link from "next/link";
import { ArrowRight, GearSix } from "phosphor-react";
import { Badge } from "@/components/ui/Badge";
import { ShinyText } from "@/components/ui/ShinyText";

type HubCard = {
  title: string;
  description: string;
  status: "Configured" | "Partial" | "Internal Only";
  href?: string;
};

const HUB_CARDS: HubCard[] = [
  {
    title: "System",
    description:
      "Database health, runtime readiness, integrations, env checks, and deployment notes.",
    status: "Configured",
    href: "/settings/system",
  },
  {
    title: "Notifications",
    description:
      "Persist internal notification preferences for task, request, work order, and inventory events.",
    status: "Configured",
    href: "/settings/notifications",
  },
  {
    title: "Users & Roles / Admin",
    description:
      "Employee/user administration and role controls for internal operations.",
    status: "Partial",
    href: "/admin",
  },
  {
    title: "Integrations",
    description:
      "Read-only integration status for PostgreSQL, NocoDB, n8n, and AI provider.",
    status: "Configured",
    href: "/settings/system#integrations",
  },
  {
    title: "Data & Backups",
    description:
      "Backup strategy visibility, export readiness notes, and server-side runbook guidance.",
    status: "Partial",
    href: "/settings/system#backups",
  },
  {
    title: "Security",
    description:
      "Auth and RBAC readiness status with clear notes on what is not yet enforced.",
    status: "Partial",
    href: "/settings/system#security",
  },
  {
    title: "Audit Logs",
    description:
      "Recent configuration and system events from the internal audit table.",
    status: "Configured",
    href: "/settings/system#audit-logs",
  },
  {
    title: "Environment",
    description:
      "Safe configured/missing checklist for required environment groups.",
    status: "Configured",
    href: "/settings/system#environment",
  },
];

function statusVariant(status: HubCard["status"]) {
  if (status === "Configured") return "success" as const;
  if (status === "Partial") return "warning" as const;
  if (status === "Internal Only") return "neutral" as const;
  return "default" as const;
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-textPrimary">
          <ShinyText>System Control Center</ShinyText>
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Configure only what persists in this repository, and monitor real
          backend readiness for Diversified OS. Secrets remain in environment
          variables and server infrastructure.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {HUB_CARDS.map((card) => {
          const content = (
            <article className="glass-surface glass-surface-hover h-full rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GearSix
                      className="h-4 w-4 text-textSecondary"
                      weight="duotone"
                    />
                    <h2 className="text-base font-semibold text-textPrimary">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-sm text-textSecondary">
                    {card.description}
                  </p>
                </div>
                <Badge variant={statusVariant(card.status)}>
                  {card.status}
                </Badge>
              </div>
              <div className="mt-4 flex items-center text-xs font-medium text-accent">
                Open
                <ArrowRight className="ml-1 h-3.5 w-3.5" weight="bold" />
              </div>
            </article>
          );

          if (!card.href) {
            return <div key={card.title}>{content}</div>;
          }

          return (
            <Link key={card.title} href={card.href}>
              {content}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
