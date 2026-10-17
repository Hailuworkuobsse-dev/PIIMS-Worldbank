import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  invoiceUploadSchema,
  type InvoiceUploadFormData,
} from "./supplier.schema";
import { useUploadInvoice } from "./supplier.mutations";
import { useSupplierContracts } from "./supplier.queries";

export function InvoiceUploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const upload = useUploadInvoice();
  const { data: contracts } = useSupplierContracts();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InvoiceUploadFormData>({
    resolver: zodResolver(invoiceUploadSchema),
    defaultValues: {
      contractId: "",
      invoiceNo: "",
      amount: "",
      currency: "ETB",
    },
  });

  const onSubmit = async (v: InvoiceUploadFormData) => {
    if (!file) {
      setFileError("Please attach the invoice file.");
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
      title={t("supplier.invoices.uploadTitle")}
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
            {t("supplier.invoices.upload")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select
          {...register("contractId")}
          label={t("supplier.invoices.fields.contract")}
          required
          placeholder="—"
          error={errors.contractId?.message}
          options={(contracts ?? []).map((c) => ({
            value: c.contractId,
            label: `${c.contractNo} · ${c.title}`,
          }))}
        />
        <Input
          {...register("invoiceNo")}
          label={t("supplier.invoices.fields.invoiceNo")}
          required
          error={errors.invoiceNo?.message}
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              {...register("amount")}
              label={t("supplier.invoices.fields.amount")}
              required
              inputMode="decimal"
              error={errors.amount?.message}
            />
          </div>
          <Select
            {...register("currency")}
            label={t("supplier.invoices.fields.currency")}
            required
            options={[
              { value: "ETB", label: "ETB" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>
        <FileUpload
          label={t("supplier.invoices.fields.file")}
          accept=".pdf,image/*"
          maxSizeMB={10}
          required
          files={file ? [file] : []}
          onFiles={(fs) => {
            setFile(fs[0] ?? null);
            setFileError(null);
          }}
          error={fileError ?? undefined}
        />
      </form>
    </Modal>
  );
}