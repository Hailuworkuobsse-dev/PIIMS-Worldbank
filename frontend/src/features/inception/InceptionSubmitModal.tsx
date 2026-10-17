import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileUpload } from "@/components/ui/FileUpload";
import { Banner } from "@/components/ui/Banner";
import {
  submitInceptionSchema,
  type SubmitInceptionFormData,
  MAX_REPORT_SIZE_MB,
} from "./inception.schema";
import { useSubmitInception } from "./inception.mutations";
import { useInceptionTemplates } from "./inception.queries";
import { useProjects } from "@/features/projects/project.queries";

export interface InceptionSubmitModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function InceptionSubmitModal({
  open,
  onClose,
  defaultProjectId,
}: InceptionSubmitModalProps) {
  const { t } = useTranslation();
  const submitMutation = useSubmitInception();
  const { data: templates } = useInceptionTemplates();
  const { data: projects } = useProjects({
    limit: 200,
    status: ["APPROVED", "ACTIVE"] as any,
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubmitInceptionFormData>({
    resolver: zodResolver(submitInceptionSchema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      templateId: "",
      version: 1,
      summary: "",
    },
  });

  const onSubmit = async (values: SubmitInceptionFormData) => {
    if (!file) {
      setFileError("Please attach the report document.");
      return;
    }
    setFileError(null);
    await submitMutation.mutateAsync({ ...values, file });
    reset();
    setFile(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit inception report"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={submitMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("actions.submit")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Banner tone="info">
          The inception report is due within 2–4 weeks of contract signing.
          Ensure all required sections are complete.
        </Banner>

        <Select
          {...register("projectId")}
          label="Project"
          required
          placeholder="—"
          error={errors.projectId?.message}
          options={(projects?.data ?? []).map((p) => ({
            value: p.projectId,
            label: `${p.projectCode} · ${p.name}`,
          }))}
        />

        <Select
          {...register("templateId")}
          label="Template"
          required
          placeholder="—"
          error={errors.templateId?.message}
          options={(templates ?? []).map((tpl) => ({
            value: tpl.templateId,
            label: tpl.name,
          }))}
        />

        <Textarea
          {...register("summary")}
          label="Summary"
          required
          rows={4}
          hint="Brief description of the report (min 20 characters)"
          error={errors.summary?.message}
        />

        <div>
          <FileUpload
            label="Report document"
            accept=".pdf,.docx"
            maxSizeMB={MAX_REPORT_SIZE_MB}
            required
            files={file ? [file] : []}
            onFiles={(fs) => {
              setFile(fs[0] ?? null);
              setFileError(null);
            }}
            error={fileError ?? undefined}
            hint={`PDF or DOCX · max ${MAX_REPORT_SIZE_MB} MB`}
          />
        </div>

        <input
          type="hidden"
          {...register("version", { valueAsNumber: true })}
        />
      </form>
    </Modal>
  );
}