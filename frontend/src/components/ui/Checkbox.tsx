import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "./utils/cn";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, hint, error, className, id, ...rest }, ref) {
    const auto = useId();
    const cid = id ?? `cb-${auto}`;
    const hintId = hint ? `${cid}-hint` : undefined;
    const errId = error ? `${cid}-err` : undefined;

    return (
      <div className={cn("w-full", className)}>
        <label
          htmlFor={cid}
          className="inline-flex items-start gap-2.5 cursor-pointer select-none"
        >
          <span className="relative mt-0.5">
            <input
              ref={ref}
              id={cid}
              type="checkbox"
              aria-invalid={!!error || undefined}
              aria-describedby={
                [hintId, errId].filter(Boolean).join(" ") || undefined
              }
              className="peer sr-only"
              {...rest}
            />
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-[4px] border-2 transition-colors",
                "border-neutral-300 bg-white peer-checked:border-primary-700 peer-checked:bg-primary-700",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-info peer-focus-visible:ring-offset-2",
                error && "border-danger",
                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
              )}
            >
              <Check
                className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
                strokeWidth={3}
              />
            </span>
          </span>
          <span className="text-body-sm text-neutral-900 leading-snug">
            {label}
          </span>
        </label>
        {hint && !error && (
          <p id={hintId} className="mt-1 ml-7 text-caption text-neutral-600">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errId}
            role="alert"
            className="mt-1 ml-7 text-caption text-danger font-medium"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);