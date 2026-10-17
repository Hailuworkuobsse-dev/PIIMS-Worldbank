import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { skipLogicSchema, type SkipLogicFormData } from "./survey.schema";
import { useAddSkipLogic } from "./survey.mutations";
import { evaluateCondition } from "./skipLogic";
import type { Question } from "./survey.types";

export function SkipLogicEditor({
  versionId,
  question,
  allQuestions,
  onSuccess,
}: {
  versionId: string;
  question: Question;
  allQuestions: Question[];
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const add = useAddSkipLogic(versionId);
  const [preview, setPreview] = useState<{
    ok: boolean;
    error?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SkipLogicFormData>({
    resolver: zodResolver(skipLogicSchema),
    defaultValues: {
      questionId: question.questionId,
      condition: "",
      action: "SHOW",
      targetQuestionId: "",
    },
  });

  const condition = watch("condition");

  const testCondition = () => {
    try {
      // evaluate with empty context — validates syntax
      evaluateCondition(condition || "", {});
      setPreview({ ok: true });
    } catch (err: any) {
      setPreview({ ok: false, error: err.message });
    }
  };

  const onSubmit = async (v: SkipLogicFormData) => {
    await add.mutateAsync(v);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("questionId")} />
      <div className="text-caption text-neutral-600 mb-2">
        Configuring skip logic for{" "}
        <code className="text-primary-700 font-bold">{question.code}</code> ·{" "}
        {question.text}
      </div>

      <Banner tone="info">
        Use <code>{"${field}"}</code> to reference other questions. Example:{" "}
        <code>{`\${q1_2} = 'F' and \${q1_3} > 18`}</code>
      </Banner>

      <Input
        {...register("condition")}
        label={t("survey.skipForm.condition")}
        required
        error={errors.condition?.message}
        placeholder={`\${q1_2} = 'F'`}
      />

      <Button type="button" variant="ghost" size="sm" onClick={testCondition}>
        Validate syntax
      </Button>
      {preview && (
        <div
          className={`text-caption font-semibold ${preview.ok ? "text-green-700" : "text-danger"}`}
          role="status"
        >
          {preview.ok ? "✓ Valid expression" : `✗ ${preview.error}`}
        </div>
      )}

      <Select
        {...register("action")}
        label={t("survey.skipForm.action")}
        required
        options={[
          {
            value: "SHOW",
            label: "Show target question when condition is true",
          },
          {
            value: "HIDE",
            label: "Hide target question when condition is true",
          },
          {
            value: "SKIP",
            label: "Skip target question when condition is true",
          },
          {
            value: "REQUIRE",
            label: "Mark this question as required when condition is true",
          },
        ]}
      />

      <Select
        {...register("targetQuestionId")}
        label={t("survey.skipForm.target")}
        placeholder="—"
        options={allQuestions
          .filter((q) => q.questionId !== question.questionId)
          .map((q) => ({
            value: q.questionId,
            label: `${q.code} · ${q.text}`,
          }))}
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={add.isPending}>
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}