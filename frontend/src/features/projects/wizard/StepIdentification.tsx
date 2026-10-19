import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  stepIdentificationSchema,
  type StepIdentificationData,
} from "../project.schema";

export function StepIdentification({
  defaultValues,
  onSubmit,
  formId,
  onValuesChange,
}: {
  defaultValues: Partial<StepIdentificationData>;
  onSubmit: (d: StepIdentificationData) => void;
  onValuesChange?: (d: Partial<StepIdentificationData>) => void;
  formId: string;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StepIdentificationData>({
    resolver: zodResolver(stepIdentificationSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    const subscription = watch((values) => onValuesChange?.(values as Partial<StepIdentificationData>));
    return () => subscription.unsubscribe();
  }, [watch, onValuesChange]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <h2 data-step-heading tabIndex={-1} className="text-h2 text-primary-900">
        {t("projects.wizard.steps.identification")}
      </h2>

      <Input
        {...register("name")}
        label={t("projects.wizard.fields.name")}
        required
        error={errors.name?.message}
        autoFocus
      />
      <Input
        {...register("nameAm")}
        label={t("projects.wizard.fields.nameAm")}
        error={errors.nameAm?.message}
      />
      <Input
        {...register("subsector")}
        label={t("projects.wizard.fields.subsector")}
        error={errors.subsector?.message}
      />
      <Textarea
        {...register("description")}
        label={t("projects.wizard.fields.description")}
        rows={4}
        error={errors.description?.message}
      />
    </form>
  );
}