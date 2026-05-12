"use client";

import { useState } from "react";
import {
  Warning,
  Robot,
  Database,
  ArrowSquareOut,
  GearSix,
  Users,
  Lightning,
} from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

const employees = [
  { name: "Terry Strasser", role: "Admin" },
  { name: "Jordan Strasser", role: "Manager" },
  { name: "Cathy Kraft", role: "Admin" },
  { name: "Jill Strasser", role: "Manager" },
  { name: "Marcus Rivera", role: "Employee" },
  { name: "Callie Brooks", role: "Employee" },
  { name: "Luis Moreno", role: "Employee" },
  { name: "Sarah Kim", role: "Employee" },
  { name: "Derek Washington", role: "Employee" },
  { name: "Priya Patel", role: "Employee" },
];

const roleOptions = ["Admin", "Manager", "Employee"];

export default function AdminPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [timesheetReminder, setTimesheetReminder] = useState(true);

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
          <ShinyText>Admin Settings</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          System configuration, user management, and platform preferences.
        </p>
      </FadeContent>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={Users} title="Team & Roles" />
          <button
            type="button"
            disabled
            title="Coming in next release"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-semibold text-white opacity-50"
          >
            + Add Employee
          </button>
        </div>

        <div className="divide-y divide-borderSubtle">
          {employees.map((employee) => (
            <div
              key={employee.name}
              className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-textPrimary">{employee.name}</p>
                <p className="text-sm text-textMuted">{employee.role}</p>
              </div>
              <select
                value={employee.role}
                disabled
                className="h-10 cursor-not-allowed rounded-md border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary opacity-50"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <SectionTitle icon={GearSix} title="System Preferences" />
        <div className="space-y-3">
          <ToggleRow
            label="Email notifications on new requests"
            enabled={emailNotifs}
            onToggle={() => setEmailNotifs((value) => !value)}
          />
          <ToggleRow
            label="Auto-assign reviewer based on category"
            enabled={autoAssign}
            onToggle={() => setAutoAssign((value) => !value)}
          />
          <ToggleRow
            label="Timesheet reminder - Fridays at 4:00 PM"
            enabled={timesheetReminder}
            onToggle={() => setTimesheetReminder((value) => !value)}
          />
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <SectionTitle icon={Lightning} title="Integrations" />
        <div className="space-y-3">
          <IntegrationRow
            icon={Lightning}
            name="n8n Automation Platform"
            badge="Connected"
            href="https://auto.snrglabs.com"
          />
          <IntegrationRow
            icon={Database}
            name="NocoDB Database Admin"
            badge="Connected"
            href="https://data.snrglabs.com"
          />
          <IntegrationRow icon={Robot} name="AEON AI Chat" badge="Active" />
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <SectionTitle
          icon={Warning}
          title="Danger Zone"
          iconClassName="text-red-500"
        />
        <p className="text-sm text-textSecondary">
          Destructive actions are disabled in demo mode.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-600 opacity-50 dark:text-red-300"
          >
            Reset All Demo Data
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-borderSubtle px-4 py-2 text-sm font-semibold text-textSecondary opacity-50"
          >
            Export Full Database Backup
          </button>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  iconClassName = "text-accent",
}: {
  icon: typeof Users;
  title: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-bgDark p-2">
        <Icon className={`h-5 w-5 ${iconClassName}`} weight="duotone" />
      </div>
      <h2 className="text-base font-semibold text-textPrimary">{title}</h2>
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-borderSubtle bg-bgDark px-4 py-3">
      <p className="text-sm font-medium text-textPrimary">{label}</p>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? "bg-accent" : "bg-borderSubtle"
        }`}
        aria-pressed={enabled}
        aria-label={label}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function IntegrationRow({
  icon: Icon,
  name,
  badge,
  href,
}: {
  icon: typeof Users;
  name: string;
  badge: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-borderSubtle bg-bgDark px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-accent" weight="duotone" />
        <p className="font-medium text-textPrimary">{name}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {badge}
        </span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          >
            Open <ArrowSquareOut className="h-3.5 w-3.5" weight="bold" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
