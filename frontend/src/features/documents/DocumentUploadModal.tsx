import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  documentUploadSchema,
  validateFile,
  MAX_FILE_SIZE_MB,
  type DocumentUploadFormData,
} from "./document.schema";
import { useUploadDocument } from "./document.mutations";
import { DOC_TYPES, ACCESS_LEVELS } from "./document.types";
import { useProjects } from "@/features/projects/project.queries";

export function DocumentUploadModal({
  open,
  onClose,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string | undefined;
}) {
  const { t } = useTranslation();
  const upload = useUploadDocument();
  const { data: projects } = useProjects({ limit: 200 });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      docType: "REPORT",
      title: "",
      description: "",
      accessLevel: "INTERNAL",
    },
  });

  const onSubmit = async (v: DocumentUploadFormData) => {
    if (!file) {
      setFileError("Please select a file.");
      return;
    }
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    await upload.mutateAsync({ input: v, file });
    reset();
    setFile(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("documents.uploadTitle")}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={upload.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("documents.uploadButton")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select
          {...register("projectId")}
          label={t("documents.form.project")}
          placeholder={t("documents.form.noProject")}
          options={(projects?.data ?? []).map((p) => ({
            value: p.projectId,
            label: `${p.projectCode} · ${p.name}`,
          }))}
        />
        <Select
          {...register("docType")}
          label={t("documents.form.type")}
          required
          options={DOC_TYPES.map((dt) => ({ value: dt, label: dt }))}
        />
        <Input
          {...register("title")}
          label={t("documents.form.title")}
          required
          error={errors.title?.message}
        />
        <Textarea
          {...register("description")}
          label={t("documents.form.description")}
          rows={3}
        />
        <Select
          {...register("accessLevel")}
          label={t("documents.form.access")}
          required
          options={ACCESS_LEVELS.map((a) => ({
            value: a,
            label:
              a === "PUBLIC"
                ? "Public"
                : a === "INTERNAL"
                  ? "Internal"
                  : "Restricted",
          }))}
        />
        <FileUpload
          label={t("documents.form.file")}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
          maxSizeMB={MAX_FILE_SIZE_MB}
          required
          files={file ? [file] : []}
          onFiles={(fs) => {
            setFile(fs[0] ?? null);
            setFileError(null);
          }}
          error={fileError ?? undefined}
          hint={`PDF, Word, Excel, images, ZIP · max ${MAX_FILE_SIZE_MB} MB`}
        />
      </form>
    </Modal>
  );
}