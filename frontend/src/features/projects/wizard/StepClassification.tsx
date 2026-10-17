import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import {
  stepClassificationSchema,
  type StepClassificationData,
} from "../project.schema";
import { PROJECT_SECTORS, IMPL_ARRANGEMENTS } from "../project.types";
import { sectorLabelKey } from "../project.utils";

const ORGS = [
  { value: "org-mowe", label: "Ministry of Water and Energy" },
  { value: "org-mof", label: "Ministry of Finance" },
  { value: "org-dbe", label: "Development Bank of Ethiopia" },
  { value: "org-regional", label: "Regional Water Bureau" },
];

export function StepClassification({
  defaultValues,
  onSubmit,
  formId,
}: {
  defaultValues: Partial<StepClassificationData>;
  onSubmit: (d: StepClassificationData) => void;
  formId: string;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StepClassificationData>({
    resolver: zodResolver(stepClassificationSchema),
    defaultValues,
    mode: "onBlur",
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <h2 data-step-heading tabIndex={-1} className="text-h2 text-primary-900">
        {t("projects.wizard.steps.classification")}
      </h2>
      <Select
        {...register("sector")}
        label={t("projects.wizard.fields.sector")}
        required
        placeholder="—"
        error={errors.sector?.message}
        options={PROJECT_SECTORS.map((s) => ({
          value: s,
          label: t(sectorLabelKey(s)),
        }))}
      />
      <Select
        {...register("ownerOrgId")}
        label={t("projects.wizard.fields.ownerOrgId")}
        required
        placeholder="—"
        error={errors.ownerOrgId?.message}
        options={ORGS}
      />
      <Select
        {...register("implementationArrangement")}
        label={t("projects.wizard.fields.implementationArrangement")}
        required
        placeholder="—"
        error={errors.implementationArrangement?.message}
        options={IMPL_ARRANGEMENTS.map((a) => ({
          value: a,
          label: a
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/^./, (c) => c.toUpperCase()),
        }))}
      />
      <Input
        {...register("wbCreditNo")}
        label={t("projects.wizard.fields.wbCreditNo")}
        placeholder="IDA-XXXX"
        error={errors.wbCreditNo?.message}
      />
    </form>
  );
}