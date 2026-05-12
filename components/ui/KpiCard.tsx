import { ReactNode } from "react";

type LegacyVariant = "cyan" | "magenta" | "yellow" | "green";
type NewVariant = "blue" | "success" | "warning" | "danger";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  variant?: LegacyVariant | NewVariant;
}

const VARIANT_MAP: Record<
  LegacyVariant | NewVariant,
  { iconBg: string; value: string; delta: string; dot: string }
> = {
  blue: {
    iconBg: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    value: "text-textPrimary",
    delta: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-600",
  },
  success: {
    iconBg:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    value: "text-textPrimary",
    delta: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  warning: {
    iconBg:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    value: "text-textPrimary",
    delta: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  danger: {
    iconBg: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    value: "text-textPrimary",
    delta: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  // Legacy variant names remapped to corporate equivalents
  cyan: {
    iconBg: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    value: "text-textPrimary",
    delta: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-600",
  },
  green: {
    iconBg:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    value: "text-textPrimary",
    delta: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  yellow: {
    iconBg:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    value: "text-textPrimary",
    delta: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  magenta: {
    iconBg:
      "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
    value: "text-textPrimary",
    delta: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
  },
};

export function KpiCard({
  label,
  value,
  delta,
  icon,
  variant = "blue",
}: KpiCardProps) {
  const styles = VARIANT_MAP[variant];

  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft transition-colors hover:border-borderHover">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-textMuted">
            {label}
          </span>
          <span className={`text-2xl font-semibold ${styles.value}`}>
            {value}
          </span>
          {delta && (
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${styles.delta}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              {delta}
            </span>
          )}
        </div>
        {icon && (
          <div
            className={`h-9 w-9 rounded-md ${styles.iconBg} grid place-items-center shrink-0`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
