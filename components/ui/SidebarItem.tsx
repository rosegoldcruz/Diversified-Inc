import type { ComponentType } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
type PhosphorIcon = ComponentType<{
  className?: string;
  size?: number | string;
  weight?: IconWeight;
}>;

type SidebarItemProps = {
  label: string;
  href: string;
  icon: PhosphorIcon;
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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 ring-transparent transition-all duration-200",
        collapsed && "lg:justify-center lg:px-0",
        active
          ? "border border-white/40 bg-white/70 text-accent shadow-glass ring-white/25 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:text-blue-300 dark:ring-white/10"
          : "text-textSecondary hover:bg-white/55 hover:text-textPrimary hover:ring-white/25 hover:backdrop-blur-2xl dark:hover:bg-white/5 dark:hover:ring-white/10",
      )}
      title={collapsed ? label : undefined}
    >
      {active ? (
        <span className="absolute left-1 top-2 h-[calc(100%-1rem)] w-0.5 rounded-full bg-accent" />
      ) : null}
      <Icon className="h-4 w-4 shrink-0" weight={active ? "fill" : "regular"} />
      <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
    </Link>
  );
}
