import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  label: string;
  options: SelectOption[];
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      options,
      hint,
      error,
      required,
      placeholder,
      className,
      id,
      ...rest
    },
    ref,
  ) {
    const auto = useId();
    const sid = id ?? `sel-${auto}`;
    const hintId = hint ? `${sid}-hint` : undefined;
    const errId = error ? `${sid}-err` : undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={sid}
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
          <select
            ref={ref}
            id={sid}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={
              [hintId, errId].filter(Boolean).join(" ") || undefined
            }
            className={cn(
              "w-full h-9 pl-3 pr-9 rounded-md text-body-sm bg-white border outline-none appearance-none",
              error
                ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                : "border-neutral-300 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/15",
              "disabled:bg-neutral-100 disabled:cursor-not-allowed",
              className,
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600"
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