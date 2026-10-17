import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  waveAssignmentSchema,
  type WaveAssignmentFormData,
} from "./impactIndicator.schema";
import { useAssignIndicatorWave } from "./impactIndicator.mutations";
import type { ImpactIndicator } from "./impactIndicator.types";

const WAVES = [
  { value: "wave-w0", label: "W0 · Baseline" },
  { value: "wave-w1", label: "W1 · Midline" },
  { value: "wave-w2", label: "W2 · Endline" },
  { value: "wave-w3", label: "W3 · Ex-post" },
];

export function WaveAssignmentModal({
  open,
  indicator,
  onClose,
}: {
  open: boolean;
  indicator: ImpactIndicator;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const assign = useAssignIndicatorWave();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaveAssignmentFormData>({
    resolver: zodResolver(waveAssignmentSchema),
    defaultValues: {
      indicatorId: indicator.indicatorId,
      waveId: "",
      targetValue: undefined,
      required: true,
      collectionWindowStart: "",
      collectionWindowEnd: "",
    },
  });

  const onSubmit = async (v: WaveAssignmentFormData) => {
    await assign.mutateAsync(v);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("impactIndicators.waveForm.title")}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={assign.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("actions.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="text-caption text-neutral-600 mb-2">
          <code className="text-primary-700 font-bold">{indicator.code}</code> ·{" "}
          {indicator.name}
        </div>
        <input type="hidden" {...register("indicatorId")} />
        <Select
          {...register("waveId")}
          label={t("impactIndicators.waveForm.wave")}
          required
          placeholder="—"
          error={errors.waveId?.message}
          options={WAVES}
        />
        <Input
          {...register("targetValue", { valueAsNumber: true })}
          type="number"
          label={t("impactIndicators.waveForm.target")}
          error={errors.targetValue?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <DateInput
            {...register("collectionWindowStart")}
            label="Window start"
          />
          <DateInput {...register("collectionWindowEnd")} label="Window end" />
        </div>
        <Checkbox
          {...register("required")}
          label={t("impactIndicators.waveForm.required")}
        />
      </form>
    </Modal>
  );
}