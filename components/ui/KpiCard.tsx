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

const VARIANT_MAP: Record<LegacyVariant | NewVariant, { iconBg: string; value: string; delta: string; dot: string }> = {
  blue:    { iconBg: "bg-[#EFF6FF] text-[#2563EB]", value: "text-[#1A2B4A]", delta: "text-[#2563EB]", dot: "bg-[#2563EB]" },
  success: { iconBg: "bg-[#F0FDF4] text-[#16A34A]", value: "text-[#1A2B4A]", delta: "text-[#16A34A]", dot: "bg-[#16A34A]" },
  warning: { iconBg: "bg-[#FFFBEB] text-[#D97706]", value: "text-[#D97706]", delta: "text-[#D97706]", dot: "bg-[#D97706]" },
  danger:  { iconBg: "bg-[#FEF2F2] text-[#DC2626]", value: "text-[#DC2626]", delta: "text-[#DC2626]", dot: "bg-[#DC2626]" },
  // Legacy variant names remapped to corporate equivalents
  cyan:    { iconBg: "bg-[#EFF6FF] text-[#2563EB]", value: "text-[#1A2B4A]", delta: "text-[#2563EB]", dot: "bg-[#2563EB]" },
  green:   { iconBg: "bg-[#F0FDF4] text-[#16A34A]", value: "text-[#1A2B4A]", delta: "text-[#16A34A]", dot: "bg-[#16A34A]" },
  yellow:  { iconBg: "bg-[#FFFBEB] text-[#D97706]", value: "text-[#1A2B4A]", delta: "text-[#D97706]", dot: "bg-[#D97706]" },
  magenta: { iconBg: "bg-[#F5F3FF] text-[#7C3AED]", value: "text-[#1A2B4A]", delta: "text-[#7C3AED]", dot: "bg-[#7C3AED]" },
};

export function KpiCard({ label, value, delta, icon, variant = "blue" }: KpiCardProps) {
  const styles = VARIANT_MAP[variant];

  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
            {label}
          </span>
          <span className={`text-2xl font-bold ${styles.value}`}>
            {value}
          </span>
          {delta && (
            <span className={`flex items-center gap-1.5 text-xs font-medium ${styles.delta}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              {delta}
            </span>
          )}
        </div>
        {icon && (
          <div className={`h-10 w-10 rounded-lg ${styles.iconBg} grid place-items-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
