import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean | undefined;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-700 text-white hover:bg-primary-900 active:bg-primary-900",
  secondary:
    "bg-white text-primary-700 border border-primary-300 hover:bg-primary-100",
  ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100",
  danger: "bg-danger text-white hover:bg-red-700 active:bg-red-800",
  link: "bg-transparent text-primary-700 underline-offset-2 hover:underline p-0 h-auto min-h-0",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-caption",
  md: "h-9 px-4 text-body-sm",
  lg: "h-11 px-5 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          base,
          variant !== "link" && sizes[size],
          variants[variant],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {!loading && leftIcon && (
          <span className="shrink-0" aria-hidden>
            {leftIcon}
          </span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden>
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);