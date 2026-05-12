import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-accent bg-accent text-white shadow-soft hover:-translate-y-px hover:border-accentSoft hover:bg-accentSoft hover:shadow-cyberMd",
        destructive:
          "border border-red-600 bg-red-600 text-white shadow-soft hover:-translate-y-px hover:border-red-700 hover:bg-red-700",
        outline:
          "border border-borderSubtle bg-surface/90 text-textPrimary shadow-soft backdrop-blur-xl hover:-translate-y-px hover:border-borderHover hover:bg-surface",
        secondary:
          "border border-borderSubtle bg-bgDark text-textPrimary hover:border-borderHover hover:bg-bgMedium",
        ghost: "text-textSecondary hover:bg-bgDark hover:text-textPrimary",
        link: "h-auto rounded-none px-0 text-accent underline-offset-4 hover:underline",
        magenta:
          "border border-borderSubtle bg-surface/90 text-textPrimary shadow-soft backdrop-blur-xl hover:-translate-y-px hover:border-borderHover hover:bg-surface",
        yellow:
          "border border-borderSubtle bg-surface/90 text-textPrimary shadow-soft backdrop-blur-xl hover:-translate-y-px hover:border-borderHover hover:bg-surface",
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
