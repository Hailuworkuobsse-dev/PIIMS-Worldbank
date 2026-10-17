import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { DateInput } from "@/components/ui/DateInput";
import { Button } from "@/components/ui/Button";
import {
  impactIndicatorSchema,
  type ImpactIndicatorFormData,
} from "./impactIndicator.schema";
import { useCreateImpactIndicator } from "./impactIndicator.mutations";
import { IMPACT_DOMAINS, INDICATOR_DIRECTION } from "./impactIndicator.types";

const DISAGG_OPTIONS = [
  "gender",
  "region",
  "wealth_quintile",
  "age_band",
  "urban_rural",
];

export function ImpactIndicatorForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const create = useCreateImpactIndicator();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ImpactIndicatorFormData>({
    resolver: zodResolver(impactIndicatorSchema),
    defaultValues: {
      domain: "INCOME",
      code: "",
      name: "",
      nameAm: "",
      description: "",
      unit: "",
      direction: "INCREASE",
      method: "",
      disaggregation: ["gender", "region"],
      standardRef: "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (v: ImpactIndicatorFormData) => {
    await create.mutateAsync(v);
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Select
          {...register("domain")}
          label={t("impactIndicators.form.domain")}
          required
          options={IMPACT_DOMAINS.map((d) => ({ value: d, label: d }))}
        />
        <Input
          {...register("code")}
          label={t("impactIndicators.form.code")}
          required
          error={errors.code?.message}
          placeholder="IMP-INC-001"
        />
      </div>
      <Input
        {...register("name")}
        label={t("impactIndicators.form.name")}
        required
        error={errors.name?.message}
      />
      <Input
        {...register("nameAm")}
        label={t("impactIndicators.form.nameAm")}
      />
      <Textarea
        {...register("description")}
        label={t("impactIndicators.form.description")}
        rows={2}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("unit")}
          label={t("impactIndicators.form.unit")}
          required
          error={errors.unit?.message}
          placeholder="ETB/month"
        />
        <Select
          {...register("direction")}
          label={t("impactIndicators.form.direction")}
          required
          options={INDICATOR_DIRECTION.map((d) => ({ value: d, label: d }))}
        />
      </div>
      <Textarea
        {...register("method")}
        label={t("impactIndicators.form.method")}
        rows={2}
      />
      <div>
        <div className="text-caption font-semibold text-primary-900 mb-2">
          {t("impactIndicators.form.disagg")}
        </div>
        <div className="flex flex-wrap gap-3">
          {DISAGG_OPTIONS.map((d) => (
            <Checkbox
              key={d}
              {...register(`disaggregation` as any)}
              value={d}
              label={d}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("standardRef")}
          label={t("impactIndicators.form.standardRef")}
          placeholder="WB-CORE-INC-01"
        />
        <DateInput
          {...register("effectiveFrom")}
          label={t("impactIndicators.form.effectiveFrom")}
          required
          error={errors.effectiveFrom?.message}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={create.isPending}>
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}