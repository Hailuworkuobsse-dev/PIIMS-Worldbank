import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Calendar } from "lucide-react";
import { cn } from "./utils/cn";

export interface DateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(
    { label, hint, error, required, className, id, ...rest },
    ref,
  ) {
    const auto = useId();
    const did = id ?? `dt-${auto}`;
    const hintId = hint ? `${did}-hint` : undefined;
    const errId = error ? `${did}-err` : undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={did}
          className="block text-caption font-semibold text-primary-900 mb-1.5"
        >
          {label}
          {required && (
            <span aria-hidden className="text-danger ml-0.5">
              *
            </span>
          )}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={did}
            type="date"
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={
              [hintId, errId].filter(Boolean).join(" ") || undefined
            }
            className={cn(
              "w-full h-9 pl-9 pr-3 rounded-md text-body-sm bg-white border outline-none",
              error
                ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                : "border-neutral-300 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/15",
              "disabled:bg-neutral-100",
              className,
            )}
            {...rest}
          />
          <Calendar
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600"
            aria-hidden
          />
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
  },
);