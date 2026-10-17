import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { deliveryFormSchema, type DeliveryFormData } from "./supplier.schema";
import { useSubmitDelivery } from "./supplier.mutations";
import { useSupplierContracts } from "./supplier.queries";
import { useState } from "react";

export function DeliveryForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const submit = useSubmitDelivery();
  const { data: contracts } = useSupplierContracts();
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      contractId: "",
      productId: "",
      productName: "",
      beneficiaryId: "",
      serialNo: "",
      quantity: 1,
      installDate: new Date().toISOString().slice(0, 10),
      warrantyMonths: 24,
    },
  });

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setGps(coords);
        setValue("installGps", coords);
        setGpsError(null);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const onSubmit = async (v: DeliveryFormData) => {
    await submit.mutateAsync(v);
    reset();
    setGps(null);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Banner tone="info">{t("supplier.deliveries.formHint")}</Banner>

      <Select
        {...register("contractId")}
        label={t("supplier.deliveries.fields.contract")}
        required
        placeholder="—"
        error={errors.contractId?.message}
        options={(contracts ?? []).map((c) => ({
          value: c.contractId,
          label: `${c.contractNo} · ${c.title}`,
        }))}
      />

      <Input
        {...register("productName")}
        label={t("supplier.deliveries.fields.product")}
        required
        error={errors.productName?.message}
        placeholder="e.g. Solar Home System 100W"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("serialNo")}
          label={t("supplier.deliveries.fields.serialNo")}
          required
          error={errors.serialNo?.message}
          placeholder="SN-2026-000123"
        />
        <Input
          {...register("quantity", { valueAsNumber: true })}
          type="number"
          label={t("supplier.deliveries.fields.quantity")}
          required
          error={errors.quantity?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DateInput
          {...register("installDate")}
          label={t("supplier.deliveries.fields.installDate")}
          required
          error={errors.installDate?.message}
        />
        <Input
          {...register("warrantyMonths", { valueAsNumber: true })}
          type="number"
          label={t("supplier.deliveries.fields.warrantyMonths")}
          error={errors.warrantyMonths?.message}
        />
      </div>

      <div>
        <span className="text-caption font-semibold text-primary-900 block mb-1.5">
          {t("supplier.deliveries.fields.gps")}
        </span>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<MapPin className="h-4 w-4" />}
            onClick={captureGps}
          >
            {gps
              ? t("supplier.deliveries.gpsRecaptured")
              : t("supplier.deliveries.captureGps")}
          </Button>
          {gps && (
            <span className="text-caption text-green-700 font-semibold">
              ✓ {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}
            </span>
          )}
        </div>
        {gpsError && (
          <p role="alert" className="text-caption text-danger mt-1">
            {gpsError}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" type="button" onClick={() => onSuccess?.()}>
          {t("actions.cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={submit.isPending}>
          {t("actions.submit")}
        </Button>
      </div>
    </form>
  );
}