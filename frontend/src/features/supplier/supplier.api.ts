import { api } from "@/lib/api/client";
import type {
  SupplierProfile,
  SupplierContract,
  DeliverySubmission,
  SupplierInvoice,
  WarrantyRecord,
  PaymentStatus,
  SupplierDashboard,
} from "./supplier.types";
import type {
  SupplierProfileFormData,
  DeliveryFormData,
  InvoiceUploadFormData,
} from "./supplier.schema";

interface Envelope<T> {
  data: T;
}

export const supplierApi = {
  async me(): Promise<SupplierProfile> {
    const { data } = await api.get<Envelope<SupplierProfile>>("/supplier/me");
    return data.data;
  },

  async updateProfile(
    input: SupplierProfileFormData,
  ): Promise<SupplierProfile> {
    const { data } = await api.put<Envelope<SupplierProfile>>(
      "/supplier/me",
      input,
    );
    return data.data;
  },

  async dashboard(): Promise<SupplierDashboard> {
    const { data } = await api.get<Envelope<SupplierDashboard>>(
      "/supplier/dashboard",
    );
    return data.data;
  },

  async contracts(): Promise<SupplierContract[]> {
    const { data } = await api.get<Envelope<SupplierContract[]>>(
      "/supplier/contracts",
    );
    return data.data;
  },

  async deliveries(contractId?: string): Promise<DeliverySubmission[]> {
    const p = contractId ? `?contract_id=${contractId}` : "";
    const { data } = await api.get<Envelope<DeliverySubmission[]>>(
      `/supplier/deliveries${p}`,
    );
    return data.data;
  },

  async submitDelivery(input: DeliveryFormData): Promise<DeliverySubmission> {
    const { data } = await api.post<Envelope<DeliverySubmission>>(
      "/supplier/deliveries",
      input,
    );
    return data.data;
  },

  async invoices(): Promise<SupplierInvoice[]> {
    const { data } =
      await api.get<Envelope<SupplierInvoice[]>>("/supplier/invoices");
    return data.data;
  },

  async uploadInvoice(
    input: InvoiceUploadFormData,
    file: File,
  ): Promise<SupplierInvoice> {
    const fd = new FormData();
    fd.append("contract_id", input.contractId);
    fd.append("invoice_no", input.invoiceNo);
    fd.append("amount", input.amount);
    fd.append("currency", input.currency);
    fd.append("file", file);
    const { data } = await api.post<Envelope<SupplierInvoice>>(
      "/supplier/invoices",
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data.data;
  },

  async warranties(): Promise<WarrantyRecord[]> {
    const { data } = await api.get<Envelope<WarrantyRecord[]>>(
      "/supplier/warranties",
    );
    return data.data;
  },

  async payments(): Promise<PaymentStatus[]> {
    const { data } =
      await api.get<Envelope<PaymentStatus[]>>("/supplier/payments");
    return data.data;
  },
};