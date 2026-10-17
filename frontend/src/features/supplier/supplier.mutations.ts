import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierApi } from "./supplier.api";
import { supplierKeys } from "./supplier.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  SupplierProfileFormData,
  DeliveryFormData,
  InvoiceUploadFormData,
} from "./supplier.schema";

export function useUpdateSupplierProfile() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: SupplierProfileFormData) =>
      supplierApi.updateProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.me() });
      push("success", "Profile updated");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Update failed"),
  });
}

export function useSubmitDelivery() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: DeliveryFormData) => supplierApi.submitDelivery(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      push("success", "Delivery submitted");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Submission failed"),
  });
}

export function useUploadInvoice() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      input,
      file,
    }: {
      input: InvoiceUploadFormData;
      file: File;
    }) => supplierApi.uploadInvoice(input, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.invoices() });
      push("success", "Invoice uploaded");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Upload failed"),
  });
}