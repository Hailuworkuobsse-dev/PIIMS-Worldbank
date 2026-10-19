import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import {
  compositeSchema,
  type CompositeFormData,
} from "./impactIndicator.schema";
import { useCreateComposite } from "./impactIndicator.mutations";
import type { ImpactIndicator } from "./impactIndicator.types";

export function CompositeIndexBuilder({
  indicators,
  onSuccess,
}: {
  indicators: ImpactIndicator[];
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateComposite();
  const baseIndicators = indicators.filter((i) => !i.isComposite);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CompositeFormData>({
    resolver: zodResolver(compositeSchema),
    defaultValues: {
      name: "",
      components: [
        { indicatorId: baseIndicators[0]?.indicatorId ?? "", weight: 50 },
        { indicatorId: baseIndicators[1]?.indicatorId ?? "", weight: 50 },
      ],
      normalization: "MIN_MAX",
      aggregation: "WEIGHTED_AVG",
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });

  const components = watch("components");
  const totalWeight = (components ?? []).reduce(
    (s, c) => s + (Number(c.weight) || 0),
    0,
  );
  const valid = Math.abs(totalWeight - 100) < 0.01;

  const onSubmit = async (v: CompositeFormData) => {
    await create.mutateAsync(v);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        {...register("name")}
        label={t("impactIndicators.compositeForm.name")}
        required
        error={errors.name?.message}
        placeholder="Women's Empowerment Index"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          {...register("normalization")}
          label={t("impactIndicators.compositeForm.normalization")}
          options={[
            { value: "MIN_MAX", label: "Min-Max (0-1)" },
            { value: "Z_SCORE", label: "Z-score" },
            { value: "NONE", label: "None" },
          ]}
        />
        <Select
          {...register("aggregation")}
          label={t("impactIndicators.compositeForm.aggregation")}
          options={[
            { value: "WEIGHTED_SUM", label: "Weighted sum" },
            { value: "WEIGHTED_AVG", label: "Weighted average" },
          ]}
        />
      </div>

      <div>
        <div className="text-caption font-semibold text-primary-900 mb-2">
          {t("impactIndicators.compositeForm.components")}
        </div>
        <ul className="space-y-2">
          {fields.map((f, i) => (
            <li
              key={f.id}
              className="grid grid-cols-[1fr_120px_40px] gap-2 items-end"
            >
              <Select
                {...register(`components.${i}.indicatorId` as const)}
                label={i === 0 ? "Indicator" : ""}
                options={baseIndicators.map((ind) => ({
                  value: ind.indicatorId,
                  label: `${ind.code} · ${ind.name}`,
                }))}
              />
              <Input
                {...register(`components.${i}.weight` as const, {
                  valueAsNumber: true,
                })}
                label={i === 0 ? "Weight %" : ""}
                type="number"
                inputMode="numeric"
              />
              <div className="pb-0.5">
                <IconButton
                  type="button"
                  label="Remove"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => fields.length > 2 && remove(i)}
                  disabled={fields.length <= 2}
                />
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => append({ indicatorId: "", weight: 0 })}
          className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary-700 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add component
        </button>
      </div>

      <div
        role={valid ? "status" : "alert"}
        className={`text-caption font-semibold ${valid ? "text-green-700" : "text-danger"}`}
      >
        Total weight: {totalWeight}% {valid ? "✓" : "— must equal 100%"}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          loading={create.isPending}
          disabled={!valid}
        >
          {t("impactIndicators.compositeForm.create")}
        </Button>
      </div>
    </form>
  );
}