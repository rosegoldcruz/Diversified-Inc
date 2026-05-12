import type { ComponentType } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
};

export function SidebarItem({
  label,
  href,
  icon: Icon,
  active = false,
  collapsed = false,
  onClick,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "lg:justify-center lg:px-0",
        active
          ? "bg-blue-50/90 text-accent shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)] dark:bg-blue-500/10 dark:text-blue-300"
          : "text-textSecondary hover:bg-bgDark/80 hover:text-textPrimary",
      )}
      title={collapsed ? label : undefined}
    >
      {active ? (
        <span className="absolute left-1 top-2 h-[calc(100%-1rem)] w-0.5 rounded-full bg-accent" />
      ) : null}
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
    </Link>
  );
}
