import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  grievanceIntakeSchema,
  type GrievanceIntakeFormData,
} from "./grievance.schema";
import { useCreateGrievance } from "./grievance.mutations";
import {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_CHANNELS,
  SEVERITIES,
} from "./grievance.types";
import { useProjects } from "@/features/projects/project.queries";

export function GrievanceIntakeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateGrievance();
  const { data: projects } = useProjects({ limit: 200 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GrievanceIntakeFormData>({
    resolver: zodResolver(grievanceIntakeSchema),
    defaultValues: {
      projectId: "",
      beneficiaryId: "",
      category: "SERVICE_QUALITY",
      subcategory: "",
      description: "",
      channel: "IN_PERSON",
      severity: "MEDIUM",
      anonymous: false,
    },
  });

  const anonymous = watch("anonymous");

  const onSubmit = async (v: GrievanceIntakeFormData) => {
    await create.mutateAsync(v);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("grievance.form.title")}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={create.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("grievance.form.submit")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select
          {...register("projectId")}
          label={t("grievance.form.project")}
          placeholder={t("grievance.form.noProject")}
          options={(projects?.data ?? []).map((p) => ({
            value: p.projectId,
            label: `${p.projectCode} · ${p.name}`,
          }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            {...register("category")}
            label={t("grievance.form.category")}
            required
            options={GRIEVANCE_CATEGORIES.map((c) => ({
              value: c,
              label: t(`grievance.category.${c.toLowerCase()}`),
            }))}
          />
          <Select
            {...register("severity")}
            label={t("grievance.form.severity")}
            required
            options={SEVERITIES.map((s) => ({ value: s, label: s }))}
          />
        </div>
        <Input
          {...register("subcategory")}
          label={t("grievance.form.subcategory")}
        />
        <Textarea
          {...register("description")}
          label={t("grievance.form.description")}
          rows={4}
          required
          error={errors.description?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            {...register("channel")}
            label={t("grievance.form.channel")}
            required
            options={GRIEVANCE_CHANNELS.map((c) => ({ value: c, label: c }))}
          />
          <div className="flex items-end pb-1.5">
            <Checkbox
              {...register("anonymous")}
              label={t("grievance.form.anonymous")}
            />
          </div>
        </div>
        {!anonymous && (
          <Input
            {...register("beneficiaryId")}
            label={t("grievance.form.beneficiaryId")}
            placeholder="Beneficiary UUID (optional)"
          />
        )}
      </form>
    </Modal>
  );
}