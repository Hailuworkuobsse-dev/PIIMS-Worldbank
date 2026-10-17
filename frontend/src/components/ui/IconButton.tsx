import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // accessible name — required
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid";
}

const sizeCls = {
  sm: "h-7 w-7 text-sm",
  md: "h-9 w-9 text-base",
  lg: "h-11 w-11 text-lg",
};
const variantCls = {
  ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100",
  solid: "bg-primary-700 text-white hover:bg-primary-900",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      icon,
      size = "md",
      variant = "ghost",
      className,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeCls[size],
          variantCls[variant],
          className,
        )}
        {...rest}
      >
        <span aria-hidden>{icon}</span>
      </button>
    );
  },
);