import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { stepLocationSchema, type StepLocationData } from "../project.schema";

const REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambella",
  "Harari",
  "Oromia",
  "Sidama",
  "SNNP",
  "Somali",
  "South West Ethiopia",
  "Tigray",
];

export function StepLocation({
  defaultValues,
  onSubmit,
  formId,
}: {
  defaultValues: Partial<StepLocationData>;
  onSubmit: (d: StepLocationData) => void;
  formId: string;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StepLocationData>({
    resolver: zodResolver(stepLocationSchema),
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
        {t("projects.wizard.steps.location")}
      </h2>
      <Select
        {...register("region")}
        label={t("projects.wizard.fields.region")}
        required
        placeholder="—"
        error={errors.region?.message}
        options={REGIONS.map((r) => ({ value: r, label: r }))}
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <Input {...register("zone")} label={t("projects.wizard.fields.zone")} />
        <Input
          {...register("woreda")}
          label={t("projects.wizard.fields.woreda")}
        />
        <Input
          {...register("kebele")}
          label={t("projects.wizard.fields.kebele")}
        />
      </div>
      <fieldset className="border border-neutral-300 rounded-md p-3">
        <legend className="text-caption font-semibold text-neutral-600 px-1">
          Optional · GPS coordinates
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            type="number"
            step="0.0000001"
            label={t("projects.wizard.fields.latitude")}
            {...register("latitude", { valueAsNumber: true })}
            error={errors.latitude?.message}
          />
          <Input
            type="number"
            step="0.0000001"
            label={t("projects.wizard.fields.longitude")}
            {...register("longitude", { valueAsNumber: true })}
            error={errors.longitude?.message}
          />
        </div>
      </fieldset>
    </form>
  );
}