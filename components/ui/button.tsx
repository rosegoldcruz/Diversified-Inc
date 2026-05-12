import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-white/30 bg-accent/90 text-white shadow-glass backdrop-blur-2xl ring-1 ring-white/20 hover:-translate-y-px hover:border-white/50 hover:bg-accent hover:shadow-glassHover hover:backdrop-blur-3xl dark:border-white/10",
        destructive:
          "border border-red-600 bg-red-600 text-white shadow-soft hover:-translate-y-px hover:border-red-700 hover:bg-red-700",
        outline:
          "border border-white/30 bg-white/70 text-textPrimary shadow-glass backdrop-blur-2xl ring-1 ring-white/20 hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:shadow-glassHover hover:backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10 dark:hover:border-white/20 dark:hover:bg-zinc-950/75",
        secondary:
          "border border-white/25 bg-white/50 text-textPrimary shadow-glass backdrop-blur-2xl hover:border-white/45 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        ghost:
          "text-textSecondary hover:bg-white/45 hover:text-textPrimary dark:hover:bg-white/5",
        link: "h-auto rounded-none px-0 text-accent underline-offset-4 hover:underline",
        magenta:
          "border border-white/30 bg-white/70 text-textPrimary shadow-glass backdrop-blur-2xl ring-1 ring-white/20 hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:shadow-glassHover hover:backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10",
        yellow:
          "border border-white/30 bg-white/70 text-textPrimary shadow-glass backdrop-blur-2xl ring-1 ring-white/20 hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:shadow-glassHover hover:backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
