import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { budgetFormSchema, type BudgetFormData } from "./financial.schema";
import { useCreateBudget } from "./financial.mutations";
import { useComponents } from "@/features/results/results.queries";

export function BudgetFormModal({
  open,
  onClose,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}) {
  const { t } = useTranslation();
  const create = useCreateBudget();
  const { data: components } = useComponents(defaultProjectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      componentId: "",
      fiscalYear: new Date().getFullYear(),
      currency: "ETB",
      appropriation: "",
      notes: "",
    },
  });

  const onSubmit = async (v: BudgetFormData) => {
    await create.mutateAsync(v);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("financial.budget.form.title")}
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
          label={t("financial.budget.form.component")}
          placeholder={t("financial.budget.form.wholeProject")}
          options={(components ?? []).map((c) => ({
            value: c.componentId,
            label: `${c.code} · ${c.name}`,
          }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register("fiscalYear", { valueAsNumber: true })}
            type="number"
            label={t("financial.budget.form.fiscalYear")}
            required
            error={errors.fiscalYear?.message}
          />
          <Select
            {...register("currency")}
            label={t("financial.budget.form.currency")}
            required
            options={[
              { value: "ETB", label: "ETB" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>
        <Input
          {...register("appropriation")}
          label={t("financial.budget.form.appropriation")}
          required
          inputMode="decimal"
          error={errors.appropriation?.message}
        />
        <Textarea
          {...register("notes")}
          label={t("financial.budget.form.notes")}
          rows={2}
        />
      </form>
    </Modal>
  );
}