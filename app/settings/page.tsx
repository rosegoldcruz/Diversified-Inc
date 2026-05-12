"use client";

import Link from "next/link";
import { CreditCard, Bell, Settings, Shield } from "lucide-react";

function KpiCard({
  label,
  value,
  variant = "cyan",
}: {
  label: string;
  value: string | number;
  variant?: "cyan" | "green" | "yellow" | "magenta";
}) {
  const colors = {
    cyan: {
      icon: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    yellow: {
      icon: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
    magenta: {
      icon: "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
    },
  };
  const c = colors[variant];
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft">
      <div className={`mb-3 h-1.5 w-10 rounded-sm ${c.icon}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-textPrimary">{value}</p>
    </div>
  );
}

const SETTINGS_SECTIONS = [
  {
    icon: CreditCard,
    title: "Billing & Plan",
    description: "Manage your subscription, invoices, and payment methods",
    href: "/settings/billing",
    accent: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/30",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alerts, email preferences, and SMS settings",
    href: "/settings/notifications",
    accent: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-500/30",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    icon: Settings,
    title: "System Config",
    description: "Branding, integrations, feature flags, and system settings",
    href: "/settings/system",
    accent: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-500/30",
    iconBg: "bg-slate-50 dark:bg-slate-500/10",
  },
  {
    icon: Shield,
    title: "Security & Audit",
    description: "API keys, two-factor auth, and system access controls",
    href: "/settings/system",
    accent: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/30",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary">
          Settings
        </h1>
        <p className="text-sm text-textSecondary">
          System configuration, billing, and preferences
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Plan" value="Pro" variant="cyan" />
        <KpiCard label="Users" value="8" variant="green" />
        <KpiCard label="Integrations" value="3" variant="yellow" />
        <KpiCard label="API Keys" value="2 active" variant="magenta" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <div className="cursor-pointer rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft transition-colors hover:border-borderHover hover:bg-surfaceHover">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${section.border} ${section.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${section.accent}`} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-textPrimary">
                      {section.title}
                    </h2>
                    <p className="mt-1 text-sm text-textSecondary">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
