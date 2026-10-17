import { Check } from "lucide-react";
import { cn } from "./utils/cn";

export interface StepDef {
  id: string;
  label: string;
  description?: string;
}

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: StepDef[];
  current: number;
  onStepClick?: (i: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 w-full">
      {steps.map((s, i) => {
        const state =
          i < current ? "done" : i === current ? "active" : "pending";
        return (
          <li
            key={s.id}
            className="flex items-center gap-2 flex-1 min-w-[140px]"
          >
            <button
              type="button"
              onClick={onStepClick ? () => onStepClick(i) : undefined}
              disabled={!onStepClick || i > current}
              className={cn(
                "flex items-center gap-2 flex-1 text-left rounded-md p-1",
                onStepClick && i <= current && "hover:bg-neutral-100",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-bold",
                  state === "done" && "bg-primary-700 text-white",
                  state === "active" && "bg-accent-500 text-primary-900",
                  state === "pending" && "bg-neutral-200 text-neutral-600",
                )}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span>
                <span
                  className={cn(
                    "block text-body-sm font-semibold",
                    state === "active"
                      ? "text-primary-900"
                      : "text-neutral-600",
                  )}
                >
                  {s.label}
                </span>
                {s.description && (
                  <span className="block text-caption text-neutral-600">
                    {s.description}
                  </span>
                )}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="hidden md:block h-px w-6 bg-neutral-300"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}