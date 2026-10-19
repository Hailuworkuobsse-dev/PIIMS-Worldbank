import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./utils/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // accessible name — required
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid";
  loading?: boolean;
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
      loading = false,
      disabled,
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
        aria-busy={loading || undefined}
        disabled={disabled || loading}
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
        <span aria-hidden>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        </span>
      </button>
    );
  },
);