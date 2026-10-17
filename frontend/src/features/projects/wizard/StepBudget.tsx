import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { IconButton } from "@/components/ui/IconButton";
import { stepBudgetSchema, type StepBudgetData } from "../project.schema";
import { FINANCING_SOURCES } from "../project.types";

export function StepBudget({
  defaultValues,
  onSubmit,
  formId,
}: {
  defaultValues: Partial<StepBudgetData>;
  onSubmit: (d: StepBudgetData) => void;
  formId: string;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<StepBudgetData>({
    resolver: zodResolver(stepBudgetSchema),
    defaultValues: {
      totalBudget: defaultValues.totalBudget ?? { amount: "", currency: "ETB" },
      financingSource: defaultValues.financingSource ?? [
        { source: "WORLD_BANK", amount: "", currency: "ETB" },
      ],
      startDate: defaultValues.startDate ?? "",
      endDate: defaultValues.endDate ?? "",
    },
    mode: "onBlur",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "financingSource",
  });

  const total = Number(watch("totalBudget.amount") || 0);
  const declared = (watch("financingSource") ?? []).reduce(
    (s, l) => s + Number(l?.amount || 0),
    0,
  );
  const mismatch = Math.abs(total - declared) > 0.01;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <h2 data-step-heading tabIndex={-1} className="text-h2 text-primary-900">
        {t("projects.wizard.steps.budget")}
      </h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            {...register("totalBudget.amount")}
            label={t("projects.wizard.fields.totalBudget")}
            required
            error={errors.totalBudget?.amount?.message}
            inputMode="decimal"
          />
        </div>
        <Select
          {...register("totalBudget.currency")}
          label={t("projects.wizard.fields.currency")}
          required
          options={[
            { value: "ETB", label: "ETB" },
            { value: "USD", label: "USD" },
            { value: "EUR", label: "EUR" },
          ]}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <DateInput
          {...register("startDate")}
          label={t("projects.wizard.fields.startDate")}
        />
        <DateInput
          {...register("endDate")}
          label={t("projects.wizard.fields.endDate")}
          error={errors.endDate?.message}
        />
      </div>

      <fieldset>
        <legend className="text-caption font-semibold text-neutral-600 mb-2">
          {t("projects.wizard.fields.financingSource")}
        </legend>
        <ul className="space-y-2">
          {fields.map((f, i) => (
            <li
              key={f.id}
              className="grid sm:grid-cols-[1fr_1fr_120px_140px_40px] gap-2 items-end"
            >
              <Select
                {...register(`financingSource.${i}.source` as const)}
                label={i === 0 ? "Source" : ""}
                options={FINANCING_SOURCES.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, " "),
                }))}
              />
              <Input
                {...register(`financingSource.${i}.amount` as const)}
                label={i === 0 ? "Amount" : ""}
                inputMode="decimal"
                required
              />
              <Select
                {...register(`financingSource.${i}.currency` as const)}
                label={i === 0 ? "CCY" : ""}
                options={[
                  { value: "ETB", label: "ETB" },
                  { value: "USD", label: "USD" },
                  { value: "EUR", label: "EUR" },
                ]}
              />
              <Input
                {...register(`financingSource.${i}.referenceNo` as const)}
                label={i === 0 ? t("projects.wizard.fields.referenceNo") : ""}
              />
              <div className="pb-0.5">
                <IconButton
                  type="button"
                  label={t("projects.wizard.fields.financingSourceRemove")}
                  icon={<Trash2 className="h-4 w-4" />}
                  variant="ghost"
                  onClick={() => fields.length > 1 && remove(i)}
                  disabled={fields.length === 1}
                />
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            append({
              source: "WORLD_BANK",
              amount: "",
              currency: "ETB",
              referenceNo: "",
            })
          }
          className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-primary-700 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t("projects.wizard.fields.financingSourceAdd")}
        </button>
      </fieldset>

      <div
        role={mismatch ? "alert" : "status"}
        className={`text-caption font-semibold ${mismatch ? "text-danger" : "text-green-700"}`}
      >
        {mismatch
          ? `Declared: ${declared.toLocaleString()} · Total: ${total.toLocaleString()} — ${t("projects.wizard.review.budgetMismatch")}`
          : `Declared: ${declared.toLocaleString()} ✓ matches total budget`}
      </div>
    </form>
  );
}