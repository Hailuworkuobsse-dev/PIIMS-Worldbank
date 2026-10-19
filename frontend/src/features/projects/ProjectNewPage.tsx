import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WizardShell } from "./wizard/WizardShell";
import { StepIdentification } from "./wizard/StepIdentification";
import { StepClassification } from "./wizard/StepClassification";
import { StepLocation } from "./wizard/StepLocation";
import { StepBudget } from "./wizard/StepBudget";
import { StepReview } from "./wizard/StepReview";
import {
  createProjectSchema,
  WIZARD_STEPS,
  type CreateProjectInput,
} from "./project.schema";
import { useCreateProject } from "./project.mutations";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DRAFT_KEY = "piims.project.draft";

interface Draft extends Partial<CreateProjectInput> {
  __step?: number;
  __savedAt?: number;
}

function loadDraft(): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    return null;
  }
}
function saveDraft(d: Draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}
function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export default function ProjectNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateProject();

  const initialDraft = useRef<Draft>(loadDraft());
  const [step, setStep] = useState(initialDraft.current?.__step ?? 0);
  const [maxVisited, setMaxVisited] = useState(step);
  const [data, setData] = useState<
    CreateProjectInput | Partial<CreateProjectInput>
  >(initialDraft.current ?? {});
  const [savedAt, setSavedAt] = useState<number | null>(
    initialDraft.current?.__savedAt ?? null,
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  /* Autosave every 20 s */
  useEffect(() => {
    const id = window.setInterval(() => {
      saveDraft({ ...data, __step: step, __savedAt: Date.now() });
      setSavedAt(Date.now());
    }, 20_000);
    return () => window.clearInterval(id);
  }, [data, step]);

  const persistNow = (override?: Partial<CreateProjectInput>) => {
    // `override` lets callers persist values that were just merged into state
    // (the `data` closure is stale until the next render).
    saveDraft({ ...(override ?? data), __step: step, __savedAt: Date.now() });
    setSavedAt(Date.now());
  };

  const onStepSubmit = (values: any) => {
    const merged = { ...data, ...values };
    setData(merged);
    persistNow(merged);
    const next = Math.min(step + 1, WIZARD_STEPS.length - 1);
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
  };

  const onFinalSubmit = async () => {
    const parsed = createProjectSchema.safeParse(data);
    if (!parsed.success) {
      // Land on first invalid step
      const firstBadPath = parsed.error.issues[0]?.path[0];
      const stepMap: Record<string, number> = {
        name: 0,
        nameAm: 0,
        description: 0,
        subsector: 0,
        sector: 1,
        ownerOrgId: 1,
        implementationArrangement: 1,
        wbCreditNo: 1,
        region: 2,
        zone: 2,
        woreda: 2,
        kebele: 2,
        latitude: 2,
        longitude: 2,
        totalBudget: 3,
        financingSource: 3,
        startDate: 3,
        endDate: 3,
      };
      setStep(stepMap[String(firstBadPath)] ?? 0);
      return;
    }
    await createMutation.mutateAsync(parsed.data);
    clearDraft();
    navigate("/projects", { replace: true });
  };

  const stepProps = {
    identification: {
      defaultValues: data as any,
      onSubmit: onStepSubmit,
      formId: "wizard-form",
    },
    classification: {
      defaultValues: data as any,
      onSubmit: onStepSubmit,
      formId: "wizard-form",
    },
    location: {
      defaultValues: data as any,
      onSubmit: onStepSubmit,
      formId: "wizard-form",
    },
    budget: {
      defaultValues: data as any,
      onSubmit: onStepSubmit,
      formId: "wizard-form",
    },
    review: {
      data,
      onAcknowledgeChange: setAcknowledged,
      formId: "wizard-form",
      onAcknowledgeSubmit: onFinalSubmit,
    },
  } as const;

  const body = (() => {
    switch (WIZARD_STEPS[step].id) {
      case "identification":
        return <StepIdentification {...stepProps.identification} />;
      case "classification":
        return <StepClassification {...stepProps.classification} />;
      case "location":
        return <StepLocation {...stepProps.location} />;
      case "budget":
        return <StepBudget {...stepProps.budget} />;
      case "review":
        return <StepReview {...stepProps.review} />;
    }
  })();

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={() =>
          step === 0 ? setDiscardOpen(true) : setStep((s) => Math.max(0, s - 1))
        }
      >
        {step === 0
          ? t("projects.wizard.buttons.discard")
          : t("projects.wizard.buttons.back")}
      </Button>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => persistNow()}>
          {t("projects.wizard.buttons.saveDraft")}
        </Button>
        {step < WIZARD_STEPS.length - 1 ? (
          <Button type="submit" form="wizard-form">
            {t("projects.wizard.buttons.next")}
          </Button>
        ) : (
          <Button
            type="button"
            form="wizard-form"
            disabled={!acknowledged || createMutation.isPending}
            loading={createMutation.isPending}
            onClick={onFinalSubmit}
          >
            {t("projects.wizard.buttons.submit")}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <>
      <WizardShell
        current={step}
        maxVisited={maxVisited}
        onStepClick={setStep}
        draftSavedAt={savedAt}
        footer={footer}
      >
        {body}
      </WizardShell>

      <ConfirmDialog
        open={discardOpen}
        danger
        title={t("projects.wizard.buttons.discard")}
        message="All unsaved changes will be lost. This cannot be undone."
        confirmLabel={t("projects.wizard.buttons.discard")}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          clearDraft();
          navigate("/projects", { replace: true });
        }}
      />
    </>
  );
}