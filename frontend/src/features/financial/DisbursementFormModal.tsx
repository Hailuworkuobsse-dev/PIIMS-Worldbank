import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { Banner } from "@/components/ui/Banner";
import {
  disbursementFormSchema,
  type DisbursementFormData,
} from "./financial.schema";
import { useCreateDisbursement } from "./financial.mutations";
import { useProjects } from "@/features/projects/project.queries";

const ORGS = [
  { value: "org-wb", label: "World Bank" },
  { value: "org-mof", label: "Ministry of Finance" },
  { value: "org-dbe", label: "Development Bank of Ethiopia" },
];

export function DisbursementFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateDisbursement();
  const { data: projects } = useProjects({
    limit: 200,
    status: ["APPROVED", "ACTIVE"] as any,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DisbursementFormData>({
    resolver: zodResolver(disbursementFormSchema),
    defaultValues: {
      projectId: "",
      sourceOrgId: "",
      category: "CATEGORY_1",
      amount: "",
      currency: "ETB",
      valueDate: new Date().toISOString().slice(0, 10),
      referenceNo: "",
      status: "APPROVED",
    },
  });

  const onSubmit = async (v: DisbursementFormData) => {
    await create.mutateAsync(v);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("financial.disbursements.form.title")}
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
            {t("actions.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Banner tone="warning">
          {t("financial.disbursements.form.warning")}
        </Banner>

        <Select
          {...register("projectId")}
          label={t("financial.disbursements.form.project")}
          required
          placeholder="—"
          error={errors.projectId?.message}
          options={(projects?.data ?? []).map((p) => ({
            value: p.projectId,
            label: `${p.projectCode} · ${p.name}`,
          }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            {...register("sourceOrgId")}
            label={t("financial.disbursements.form.source")}
            required
            placeholder="—"
            error={errors.sourceOrgId?.message}
            options={ORGS}
          />
          <Select
            {...register("category")}
            label={t("financial.disbursements.form.category")}
            required
            options={[
              { value: "CATEGORY_1", label: "Category 1" },
              { value: "CATEGORY_2", label: "Category 2" },
              { value: "CATEGORY_3", label: "Category 3" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              {...register("amount")}
              label={t("financial.disbursements.form.amount")}
              required
              inputMode="decimal"
              error={errors.amount?.message}
            />
          </div>
          <Select
            {...register("currency")}
            label={t("financial.disbursements.form.currency")}
            required
            options={[
              { value: "ETB", label: "ETB" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DateInput
            {...register("valueDate")}
            label={t("financial.disbursements.form.valueDate")}
            required
            error={errors.valueDate?.message}
          />
          <Input
            {...register("referenceNo")}
            label={t("financial.disbursements.form.referenceNo")}
            placeholder="WB-DISB-2026-001234"
          />
        </div>

        <Select
          {...register("status")}
          label={t("financial.disbursements.form.status")}
          options={[
            { value: "PLANNED", label: "Planned" },
            { value: "REQUESTED", label: "Requested" },
            { value: "APPROVED", label: "Approved" },
            { value: "DISBURSED", label: "Disbursed" },
          ]}
        />
      </form>
    </Modal>
  );
}