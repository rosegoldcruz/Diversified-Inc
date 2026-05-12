import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
};

const paddingClasses = {
  none: "p-0",
  sm: "p-5",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

export function GlassCard({
  children,
  className,
  padding = "md",
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-surface glass-inner-highlight",
        interactive && "glass-surface-hover",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
