import * as React from "react";
import { cn } from "@/lib/utils";

type ShinyTextProps = React.HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

export function ShinyText({
  children,
  className,
  active = true,
  ...props
}: ShinyTextProps) {
  return (
    <span
      className={cn(
        "inline-block text-textPrimary",
        active &&
          "bg-[linear-gradient(110deg,rgb(var(--color-text-primary))_0%,rgb(var(--color-text-primary))_32%,rgba(255,255,255,0.96)_45%,rgb(96,165,250)_52%,rgb(var(--color-text-primary))_66%,rgb(var(--color-text-primary))_100%)] bg-[length:220%_100%] bg-clip-text text-transparent animate-shine-sweep dark:bg-[linear-gradient(110deg,rgb(var(--color-text-primary))_0%,rgb(var(--color-text-primary))_30%,rgba(255,255,255,0.98)_44%,rgb(147,197,253)_54%,rgb(var(--color-text-primary))_68%,rgb(var(--color-text-primary))_100%)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
