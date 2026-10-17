import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "./utils/cn";

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  hint?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, hint, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const rid = id ?? `rd-${auto}`;
  const hintId = hint ? `${rid}-hint` : undefined;

  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={rid}
        className="inline-flex items-start gap-2.5 cursor-pointer select-none"
      >
        <span className="relative mt-0.5">
          <input
            ref={ref}
            id={rid}
            type="radio"
            aria-describedby={hintId}
            className="peer sr-only"
            {...rest}
          />
          <span
            aria-hidden
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
              "border-neutral-300 bg-white peer-checked:border-primary-700",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-info peer-focus-visible:ring-offset-2",
              "peer-disabled:opacity-50",
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-primary-700 opacity-0 peer-checked:opacity-100" />
          </span>
        </span>
        <span className="text-body-sm text-neutral-900 leading-snug">
          {label}
        </span>
      </label>
      {hint && (
        <p id={hintId} className="mt-1 ml-7 text-caption text-neutral-600">
          {hint}
        </p>
      )}
    </div>
  );
});

export interface RadioGroupProps {
  label?: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: {
    value: string;
    label: string;
    hint?: string;
    disabled?: boolean;
  }[];
  className?: string;
}

export function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn("w-full", className)}>
      {label && (
        <legend className="text-caption font-semibold text-primary-900 mb-2">
          {label}
        </legend>
      )}
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <Radio
            key={o.value}
            name={name}
            value={o.value}
            label={o.label}
            hint={o.hint}
            disabled={o.disabled}
            checked={value === o.value}
            onChange={(e) => onChange(e.target.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}