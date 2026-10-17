import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "./utils/cn";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label: string;
  hint?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, hint, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const sid = id ?? `sw-${auto}`;
  const hintId = hint ? `${sid}-hint` : undefined;

  return (
    <div className={cn("w-full flex items-start gap-3", className)}>
      <span className="relative inline-flex shrink-0 mt-0.5">
        <input
          ref={ref}
          id={sid}
          type="checkbox"
          role="switch"
          aria-describedby={hintId}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={cn(
            "h-5 w-9 rounded-full bg-neutral-300 transition-colors",
            "peer-checked:bg-primary-700",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-info peer-focus-visible:ring-offset-2",
            "peer-disabled:opacity-50",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            "peer-checked:translate-x-4",
          )}
        />
      </span>
      <label
        htmlFor={sid}
        className="text-body-sm text-neutral-900 leading-snug cursor-pointer"
      >
        {label}
        {hint && (
          <span
            id={hintId}
            className="block text-caption text-neutral-600 mt-0.5"
          >
            {hint}
          </span>
        )}
      </label>
    </div>
  );
});