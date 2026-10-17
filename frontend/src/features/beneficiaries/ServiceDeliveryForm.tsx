import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  serviceDeliverySchema,
  type ServiceDeliveryFormData,
} from "./beneficiary.schema";
import { useCreateServiceDelivery } from "./beneficiary.mutations";
import { useBeneficiaries } from "./beneficiary.queries";
import { useProjects } from "@/features/projects/project.queries";

export function ServiceDeliveryForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const submit = useCreateServiceDelivery();
  const { data: beneficiaries } = useBeneficiaries({ limit: 200 });
  const { data: projects } = useProjects({
    limit: 200,
    status: ["APPROVED", "ACTIVE"] as any,
  });
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ServiceDeliveryFormData>({
    resolver: zodResolver(serviceDeliverySchema),
    defaultValues: {
      beneficiaryId: "",
      projectId: "",
      supplierId: "",
      productId: "",
      productName: "",
      serialNo: "",
      quantity: 1,
      installDate: new Date().toISOString().slice(0, 10),
      warrantyStart: "",
      warrantyEnd: "",
    },
  });

  const captureGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const coords = { lat: p.coords.latitude, lon: p.coords.longitude };
      setGps(coords);
      setValue("installGps", coords);
    });
  };

  const onSubmit = async (v: ServiceDeliveryFormData) => {
    await submit.mutateAsync({ input: v, photo: photo ?? undefined });
    reset();
    setGps(null);
    setPhoto(null);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Select
        {...register("beneficiaryId")}
        label={t("beneficiaries.deliveries.form.beneficiary")}
        required
        placeholder="—"
        error={errors.beneficiaryId?.message}
        options={(beneficiaries?.data ?? []).map((b) => ({
          value: b.beneficiaryId,
          label: `${b.uniqueId} · ${b.fullName}`,
        }))}
      />
      <Select
        {...register("projectId")}
        label={t("beneficiaries.deliveries.form.project")}
        required
        placeholder="—"
        error={errors.projectId?.message}
        options={(projects?.data ?? []).map((p) => ({
          value: p.projectId,
          label: `${p.projectCode} · ${p.name}`,
        }))}
      />
      <Input
        {...register("productName")}
        label={t("beneficiaries.deliveries.form.product")}
        required
        error={errors.productName?.message}
        placeholder="Solar Home System 100W"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("serialNo")}
          label={t("beneficiaries.deliveries.form.serial")}
        />
        <Input
          {...register("quantity", { valueAsNumber: true })}
          type="number"
          label={t("beneficiaries.deliveries.form.quantity")}
          error={errors.quantity?.message}
        />
      </div>
      <DateInput
        {...register("installDate")}
        label={t("beneficiaries.deliveries.form.installDate")}
      />
      <div className="grid grid-cols-2 gap-4">
        <DateInput
          {...register("warrantyStart")}
          label={t("beneficiaries.deliveries.form.warrantyStart")}
        />
        <DateInput
          {...register("warrantyEnd")}
          label={t("beneficiaries.deliveries.form.warrantyEnd")}
          error={errors.warrantyEnd?.message}
        />
      </div>
      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<MapPin className="h-4 w-4" />}
          onClick={captureGps}
        >
          {gps
            ? t("beneficiaries.deliveries.form.recaptureGps")
            : t("beneficiaries.deliveries.form.captureGps")}
        </Button>
        {gps && (
          <span className="ml-3 text-caption text-green-700 font-semibold">
            ✓ {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}
          </span>
        )}
      </div>
      <FileUpload
        label={t("beneficiaries.deliveries.form.photo")}
        accept="image/*"
        maxSizeMB={5}
        files={photo ? [photo] : []}
        onFiles={(fs) => setPhoto(fs[0] ?? null)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onSuccess}>
          {t("actions.cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={submit.isPending}>
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}