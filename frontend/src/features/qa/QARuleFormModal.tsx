import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  qaRuleSchema,
  THRESHOLD_SCHEMA,
  type QARuleFormData,
} from "./qa.rules.schema";
import { useCreateQARule, useUpdateQARule } from "./qa.rules.mutations";
import { QA_RULE_TYPES, QA_SEVERITIES, type QARule } from "./qa.types";

export function QARuleFormModal({
  open,
  onClose,
  rule,
}: {
  open: boolean;
  onClose: () => void;
  rule?: QARule;
}) {
  const { t } = useTranslation();
  const create = useCreateQARule();
  const update = useUpdateQARule();
  const isEdit = !!rule;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<QARuleFormData>({
    resolver: zodResolver(qaRuleSchema),
    defaultValues: rule
      ? {
          code: rule.code,
          name: rule.name,
          type: rule.type,
          threshold: rule.threshold,
          severity: rule.severity,
          active: rule.active,
        }
      : {
          code: "",
          name: "",
          type: "DURATION_SHORT",
          threshold: { multiplier: 0.5 },
          severity: "MEDIUM",
          active: true,
        },
  });

  const type = watch("type");
  const thresholdFields = THRESHOLD_SCHEMA[type] ?? [];

  // When type changes, seed default threshold values
  useEffect(() => {
    if (!isEdit || (rule && rule.type !== type)) {
      const defaults = Object.fromEntries(
        thresholdFields.map((f) => [f.field, f.default]),
      );
      setValue("threshold", defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (rule) {
      reset({
        code: rule.code,
        name: rule.name,
        type: rule.type,
        threshold: rule.threshold,
        severity: rule.severity,
        active: rule.active,
      });
    } else {
      reset({
        code: "",
        name: "",
        type: "DURATION_SHORT",
        threshold: { multiplier: 0.5 },
        severity: "MEDIUM",
        active: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule, open]);

  const onSubmit = async (v: QARuleFormData) => {
    if (isEdit && rule) {
      await update.mutateAsync({ ruleId: rule.ruleId, patch: v });
    } else {
      await create.mutateAsync(v);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit ? t("qa.rules.form.editTitle") : t("qa.rules.form.createTitle")
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={create.isPending || update.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("actions.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register("code")}
            label={t("qa.rules.form.code")}
            required
            placeholder="DURATION_SHORT"
            disabled={isEdit}
            error={errors.code?.message}
            hint="Uppercase, e.g. DURATION_SHORT"
          />
          <Select
            {...register("type")}
            label={t("qa.rules.form.type")}
            required
            disabled={isEdit}
            options={QA_RULE_TYPES.map((rt) => ({ value: rt, label: rt }))}
          />
        </div>
        <Input
          {...register("name")}
          label={t("qa.rules.form.name")}
          required
          error={errors.name?.message}
        />

        <div>
          <div className="text-caption font-semibold text-primary-900 mb-2">
            {t("qa.rules.form.threshold")}
          </div>
          <div className="space-y-2 border border-neutral-300 rounded-md p-3 bg-neutral-50">
            {thresholdFields.map((f) => (
              <div key={f.field}>
                <label
                  htmlFor={`threshold.${f.field}`}
                  className="block text-caption font-semibold text-neutral-900 mb-1"
                >
                  {f.label}
                </label>
                <input
                  id={`threshold.${f.field}`}
                  type={f.kind === "number" ? "number" : "text"}
                  step={f.kind === "number" ? "any" : undefined}
                  {...register(
                    `threshold.${f.field}` as const,
                    {
                      valueAsNumber: f.kind === "number",
                    } as any,
                  )}
                  className="w-full h-9 px-3 rounded-md text-body-sm border border-neutral-300 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/15 outline-none"
                />
                <p className="text-caption text-neutral-600 mt-1">{f.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <Select
          {...register("severity")}
          label={t("qa.rules.form.severity")}
          required
          options={QA_SEVERITIES.map((s) => ({ value: s, label: s }))}
        />
        <Checkbox {...register("active")} label={t("qa.rules.form.active")} />
      </form>
    </Modal>
  );
}