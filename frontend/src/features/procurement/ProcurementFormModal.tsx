import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DateInput } from "@/components/ui/DateInput";
import {
  procurementFormSchema,
  type ProcurementFormData,
} from "./procurement.schema";
import { useCreateProcurement } from "./procurement.mutations";
import { PROCUREMENT_METHODS } from "./procurement.types";
import { useComponents } from "@/features/results/results.queries";

export function ProcurementFormModal({
  open,
  onClose,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}) {
  const { t } = useTranslation();
  const create = useCreateProcurement();
  const { data: components } = useComponents(defaultProjectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProcurementFormData>({
    resolver: zodResolver(procurementFormSchema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      componentId: "",
      planRef: "",
      description: "",
      method: "ICB",
      estimatedAmount: "",
      currency: "ETB",
      planDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (v: ProcurementFormData) => {
    await create.mutateAsync(v);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("procurement.form.title")}
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
        <input type="hidden" {...register("projectId")} />
        <Select
          {...register("componentId")}
          label={t("procurement.form.component")}
          placeholder={t("procurement.form.wholeProject")}
          options={(components ?? []).map((c) => ({
            value: c.componentId,
            label: `${c.code} · ${c.name}`,
          }))}
        />
        <Input
          {...register("planRef")}
          label={t("procurement.form.planRef")}
          required
          error={errors.planRef?.message}
          placeholder="PROC-2026-001"
        />
        <Textarea
          {...register("description")}
          label={t("procurement.form.description")}
          required
          rows={3}
          error={errors.description?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            {...register("method")}
            label={t("procurement.form.method")}
            required
            options={PROCUREMENT_METHODS.map((m) => ({ value: m, label: m }))}
          />
          <DateInput
            {...register("planDate")}
            label={t("procurement.form.planDate")}
            required
            error={errors.planDate?.message}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              {...register("estimatedAmount")}
              label={t("procurement.form.estimatedAmount")}
              required
              inputMode="decimal"
              error={errors.estimatedAmount?.message}
            />
          </div>
          <Select
            {...register("currency")}
            label={t("procurement.form.currency")}
            required
            options={[
              { value: "ETB", label: "ETB" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}