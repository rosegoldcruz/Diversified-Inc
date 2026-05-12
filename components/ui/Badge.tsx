import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium leading-5 capitalize shadow-[inset_0_1px_0_rgba(255,255,255,0.36)] backdrop-blur-xl",
  {
    variants: {
      variant: {
        default:
          "border-white/30 bg-white/55 text-textSecondary dark:border-white/10 dark:bg-white/5",
        blue: "border-blue-200/70 bg-blue-50/70 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
        success:
          "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        warning:
          "border-amber-200/70 bg-amber-50/70 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        danger:
          "border-red-200/70 bg-red-50/70 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
        neutral:
          "border-slate-200/70 bg-slate-50/70 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { badgeVariants };
