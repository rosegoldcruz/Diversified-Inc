import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-accent bg-accent text-white shadow-soft hover:bg-accentSoft hover:border-accentSoft",
        destructive:
          "border border-red-600 bg-red-600 text-white shadow-soft hover:bg-red-700 hover:border-red-700",
        outline:
          "border border-borderSubtle bg-surface text-textPrimary shadow-soft hover:bg-bgDark hover:border-borderHover",
        secondary:
          "border border-borderSubtle bg-bgDark text-textPrimary hover:bg-bgMedium hover:border-borderHover",
        ghost: "text-textSecondary hover:bg-bgDark hover:text-textPrimary",
        link: "h-auto rounded-none px-0 text-accent underline-offset-4 hover:underline",
        magenta:
          "border border-borderSubtle bg-surface text-textPrimary shadow-soft hover:bg-bgDark hover:border-borderHover",
        yellow:
          "border border-borderSubtle bg-surface text-textPrimary shadow-soft hover:bg-bgDark hover:border-borderHover",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
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
