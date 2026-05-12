import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type StatTone = "blue" | "success" | "warning" | "danger" | "neutral";

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  trend?: string;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
};

const toneClasses: Record<StatTone, string> = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  neutral: "bg-bgDark text-textSecondary",
};

export function StatCard({
  label,
  value,
  description,
  trend,
  icon,
  tone = "blue",
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-textPrimary">
            {value}
          </p>
        </div>
        {icon ? (
          <div
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-md",
              toneClasses[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex min-h-5 items-center justify-between gap-3">
        {description ? (
          <p className="text-sm text-textSecondary">{description}</p>
        ) : (
          <span />
        )}
        {trend ? (
          <Badge variant={tone === "neutral" ? "default" : tone}>{trend}</Badge>
        ) : null}
      </div>
    </Card>
  );
}
