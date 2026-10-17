import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import {
  contractFormSchema,
  type ContractFormData,
} from "./procurement.schema";
import { useCreateContract } from "./procurement.mutations";
import { CONTRACT_STATUSES } from "./procurement.types";
import { useProcurement } from "./procurement.queries";

const SUPPLIERS = [
  { value: "sup-001", label: "SolarTech Ethiopia PLC" },
  { value: "sup-002", label: "Green Energy Solutions Ltd" },
  { value: "sup-003", label: "Bright Homes Trading" },
];

export function ContractFormModal({
  open,
  onClose,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}) {
  const { t } = useTranslation();
  const create = useCreateContract();
  const { data: procurement } = useProcurement({ projectId: defaultProjectId });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      procurementId: "",
      projectId: defaultProjectId ?? "",
      supplierId: "",
      contractNo: "",
      title: "",
      amount: "",
      currency: "ETB",
      signedDate: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
    },
  });

  const onSubmit = async (v: ContractFormData) => {
    await create.mutateAsync(v);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("procurement.contractForm.title")}
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
          {...register("procurementId")}
          label={t("procurement.contractForm.procurement")}
          placeholder="—"
          options={(procurement?.data ?? []).map((p) => ({
            value: p.procurementId,
            label: `${p.planRef} · ${p.description}`,
          }))}
        />
        <Select
          {...register("supplierId")}
          label={t("procurement.contractForm.supplier")}
          required
          placeholder="—"
          error={errors.supplierId?.message}
          options={SUPPLIERS}
        />
        <Input
          {...register("contractNo")}
          label={t("procurement.contractForm.contractNo")}
          required
          error={errors.contractNo?.message}
        />
        <Input
          {...register("title")}
          label={t("procurement.contractForm.title")}
          required
          error={errors.title?.message}
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              {...register("amount")}
              label={t("procurement.contractForm.amount")}
              required
              inputMode="decimal"
              error={errors.amount?.message}
            />
          </div>
          <Select
            {...register("currency")}
            label={t("procurement.contractForm.currency")}
            required
            options={[
              { value: "ETB", label: "ETB" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <DateInput {...register("signedDate")} label="Signed" />
          <DateInput {...register("startDate")} label="Start" />
          <DateInput
            {...register("endDate")}
            label="End"
            error={errors.endDate?.message}
          />
        </div>
        <Select
          {...register("status")}
          label={t("procurement.contractForm.status")}
          options={CONTRACT_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </form>
    </Modal>
  );
}