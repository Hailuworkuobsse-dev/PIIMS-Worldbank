import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  supplierProfileSchema,
  type SupplierProfileFormData,
} from "./supplier.schema";
import { useSupplierProfile } from "./supplier.queries";
import { useUpdateSupplierProfile } from "./supplier.mutations";

export function SupplierProfileForm() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierProfile();
  const update = useUpdateSupplierProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SupplierProfileFormData>({
    resolver: zodResolver(supplierProfileSchema),
    values: data
      ? {
          name: data.name,
          nameAm: data.nameAm ?? "",
          tin: data.tin,
          licenseNo: data.licenseNo,
          category: data.category,
          contactPerson: data.contactPerson,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
        }
      : undefined,
  });

  if (isLoading) return <LoadingState />;

  const onSubmit = async (v: SupplierProfileFormData) => {
    await update.mutateAsync(v);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-2xl"
      noValidate
    >
      <Input
        {...register("name")}
        label={t("supplier.profile.fields.name")}
        required
        error={errors.name?.message}
      />
      <Input
        {...register("nameAm")}
        label={t("supplier.profile.fields.nameAm")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("tin")}
          label={t("supplier.profile.fields.tin")}
          required
          error={errors.tin?.message}
        />
        <Input
          {...register("licenseNo")}
          label={t("supplier.profile.fields.licenseNo")}
          required
          error={errors.licenseNo?.message}
        />
      </div>
      <Select
        {...register("category")}
        label={t("supplier.profile.fields.category")}
        required
        options={[
          { value: "MANUFACTURER", label: "Manufacturer" },
          { value: "IMPORTER", label: "Importer" },
          { value: "INSTALLER", label: "Installer" },
          { value: "DISTRIBUTOR", label: "Distributor" },
          { value: "OTHER", label: "Other" },
        ]}
      />
      <Input
        {...register("contactPerson")}
        label={t("supplier.profile.fields.contactPerson")}
        required
        error={errors.contactPerson?.message}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("contactEmail")}
          type="email"
          label={t("supplier.profile.fields.contactEmail")}
          required
          error={errors.contactEmail?.message}
        />
        <Input
          {...register("contactPhone")}
          label={t("supplier.profile.fields.contactPhone")}
          required
          error={errors.contactPhone?.message}
        />
      </div>
      <Textarea
        {...register("address")}
        label={t("supplier.profile.fields.address")}
        required
        rows={3}
        error={errors.address?.message}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          loading={update.isPending}
          disabled={!isDirty}
        >
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}