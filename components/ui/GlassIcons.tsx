import type { ComponentType } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
type PhosphorIcon = ComponentType<{
  className?: string;
  size?: number | string;
  weight?: IconWeight;
}>;

type GlassIconItem = {
  label: string;
  href?: string;
  icon: PhosphorIcon;
  active?: boolean;
  onClick?: () => void;
};

type GlassIconsProps = {
  items: GlassIconItem[];
  className?: string;
};

export function GlassIcons({ items, className }: GlassIconsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/30 bg-white/60 text-accent shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:text-blue-300">
              <Icon className="h-4 w-4" weight="duotone" />
            </span>
            <span className="min-w-0 truncate text-xs font-medium text-textSecondary">
              {item.label}
            </span>
          </>
        );

        const baseClass = cn(
          "glass-surface glass-surface-hover flex min-h-14 items-center gap-2 px-3 py-2 text-left",
          item.active &&
            "border-white/50 bg-white/80 dark:border-white/20 dark:bg-white/10",
        );

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className={baseClass}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={baseClass}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
