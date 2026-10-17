import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { questionSchema, type QuestionFormData } from "./survey.schema";
import { useAddQuestion } from "./survey.mutations";
import { QUESTION_TYPES } from "./survey.types";

export function QuestionEditor({
  sectionId,
  versionId,
  orderNo,
  onSuccess,
}: {
  sectionId: string;
  versionId: string;
  orderNo: number;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const add = useAddQuestion(versionId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      sectionId,
      code: "",
      type: "TEXT",
      text: "",
      textAm: "",
      hint: "",
      required: false,
      orderNo,
      indicatorId: "",
      disaggregationKey: "",
      calculation: "",
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });
  const type = watch("type");
  const isChoice = type === "SINGLE" || type === "MULTI";

  const onSubmit = async (v: QuestionFormData) => {
    await add.mutateAsync(v);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("sectionId")} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("code")}
          label={t("survey.form.code")}
          required
          error={errors.code?.message}
          placeholder="Q1.1"
        />
        <Select
          {...register("type")}
          label={t("survey.form.type")}
          required
          options={QUESTION_TYPES.map((qt) => ({ value: qt, label: qt }))}
        />
      </div>
      <Textarea
        {...register("text")}
        label={t("survey.form.text")}
        required
        rows={2}
        error={errors.text?.message}
      />
      <Input {...register("textAm")} label={t("survey.form.textAm")} />
      <Input {...register("hint")} label={t("survey.form.hint")} />
      <Checkbox {...register("required")} label={t("survey.form.required")} />

      {isChoice && (
        <div>
          <div className="text-caption font-semibold text-primary-900 mb-2">
            Options
          </div>
          <ul className="space-y-2">
            {fields.map((f, i) => (
              <li
                key={f.id}
                className="grid grid-cols-[100px_1fr_1fr_40px] gap-2 items-end"
              >
                <Input
                  {...register(`options.${i}.code` as const)}
                  label={i === 0 ? "Code" : ""}
                />
                <Input
                  {...register(`options.${i}.label` as const)}
                  label={i === 0 ? "Label" : ""}
                />
                <Input
                  {...register(`options.${i}.labelAm` as const)}
                  label={i === 0 ? "Label (AM)" : ""}
                />
                <div className="pb-0.5">
                  <IconButton
                    type="button"
                    label="Remove"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => remove(i)}
                  />
                </div>
                <input
                  type="hidden"
                  {...register(`options.${i}.value` as const)}
                  value={`${i}`}
                />
                <input
                  type="hidden"
                  {...register(`options.${i}.orderNo` as const)}
                  value={i}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              append({
                code: "",
                label: "",
                labelAm: "",
                value: "",
                orderNo: fields.length,
              })
            }
            className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary-700 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add option
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={add.isPending}>
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}