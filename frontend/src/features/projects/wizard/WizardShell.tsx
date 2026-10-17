import { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Stepper } from "@/components/ui/Stepper";
import { WIZARD_STEPS } from "../project.schema";
import { cn } from "@/components/ui/utils/cn";

export interface WizardShellProps {
  current: number;
  onStepClick?: (i: number) => void;
  maxVisited: number;
  draftSavedAt?: number | null;
  children: ReactNode;
  footer: ReactNode;
}

export function WizardShell({
  current,
  onStepClick,
  maxVisited,
  draftSavedAt,
  children,
  footer,
}: WizardShellProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Move focus to first heading of the step for screen readers
    ref.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus();
  }, [current]);

  return (
    <div ref={ref} className="space-y-6">
      <header>
        <h1 className="text-h1 text-primary-900">
          {t("projects.wizard.title")}
        </h1>
        <p className="text-body-sm text-neutral-600 mt-1">
          {t("projects.wizard.subtitle")}
        </p>
        {draftSavedAt && (
          <p
            className="text-caption text-green-700 mt-2"
            role="status"
            aria-live="polite"
          >
            {t("projects.wizard.draftSaved", {
              time: new Date(draftSavedAt).toLocaleTimeString(),
            })}
          </p>
        )}
      </header>

      <Stepper
        steps={WIZARD_STEPS.map((s) => ({ id: s.id, label: t(s.labelKey) }))}
        current={current}
        onStepClick={(i) => i <= maxVisited && onStepClick?.(i)}
      />

      <div className={cn("bg-white border border-neutral-300 rounded-md p-6")}>
        {children}
      </div>

      <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-neutral-50 border-t border-neutral-300 flex justify-between gap-2 z-10">
        {footer}
      </div>
    </div>
  );
}