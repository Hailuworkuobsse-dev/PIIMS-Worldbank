import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "./utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, required, className, id, rows = 3, ...rest },
    ref,
  ) {
    const auto = useId();
    const tid = id ?? `ta-${auto}`;
    const hintId = hint ? `${tid}-hint` : undefined;
    const errId = error ? `${tid}-err` : undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={tid}
          className="block text-caption font-semibold text-primary-900 mb-1.5"
        >
          {label}
          {required && (
            <span aria-hidden className="text-danger ml-0.5">
              *
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          id={tid}
          rows={rows}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={
            [hintId, errId].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "w-full px-3 py-2 rounded-md text-body-sm bg-white border transition-colors resize-y",
            error
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-neutral-300 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/15",
            "outline-none disabled:bg-neutral-100",
            className,
          )}
          {...rest}
        />
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
  },
);