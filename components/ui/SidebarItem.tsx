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
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150",
        collapsed && "lg:justify-center lg:px-0",
        active
          ? "bg-blue-50 text-accent dark:bg-blue-500/10 dark:text-blue-300"
          : "text-textSecondary hover:bg-bgDark hover:text-textPrimary",
      )}
      title={collapsed ? label : undefined}
    >
      {active ? (
        <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-0.5 rounded-full bg-accent" />
      ) : null}
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
    </Link>
  );
}
