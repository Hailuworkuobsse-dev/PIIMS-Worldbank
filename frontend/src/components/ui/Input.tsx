import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./utils/cn";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: string;
  /** Visually hide the label (still exposed to screen readers) */
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel = false,
    hint,
    error,
    required,
    leftIcon,
    rightSlot,
    className,
    id,
    "aria-describedby": ariaDesc,
    ...rest
  },
  ref,
) {
  const auto = useId();
  const inputId = id ?? `in-${auto}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const describedBy =
    [ariaDesc, hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={cn(
          "block text-caption font-semibold text-primary-900 mb-1.5",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required && (
          <span aria-hidden className="text-danger ml-0.5">
            *
          </span>
        )}
      </label>

      <div className={cn("relative flex items-center", leftIcon && "pl-9")}>
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-3 text-neutral-600"
            aria-hidden
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full h-9 px-3 rounded-md text-body-sm bg-white",
            "border transition-colors",
            error
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-neutral-300 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/15",
            "placeholder:text-neutral-600/60 outline-none disabled:bg-neutral-100 disabled:cursor-not-allowed",
            rightSlot && "pr-10",
            className,
          )}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute right-2 flex items-center">
            {rightSlot}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1 text-caption text-neutral-600">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errId}
          role="alert"
          className="mt-1 text-caption text-danger font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
});