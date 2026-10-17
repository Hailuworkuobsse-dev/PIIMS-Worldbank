import { api } from "@/lib/api/client";
import type {
  Beneficiary,
  BeneficiaryFilters,
  DuplicateCandidate,
  ServiceDelivery,
  ServiceDeliveryFilters,
} from "./beneficiary.types";
import type {
  BeneficiaryWithConsentFormData,
  ServiceDeliveryFormData,
} from "./beneficiary.schema";

interface Envelope<T> {
  data: T;
}

function bFiltersToParams(f: BeneficiaryFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.region) p.set("region", f.region);
  if (f.woreda) p.set("woreda", f.woreda);
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.gender?.length) p.set("gender", f.gender.join(","));
  if (f.registeredFrom) p.set("registered_from", f.registeredFrom);
  if (f.registeredTo) p.set("registered_to", f.registeredTo);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

export const beneficiaryApi = {
  async list(f: BeneficiaryFilters) {
    const { data } = await api.get<
      Envelope<Beneficiary[]> & { pagination: any }
    >(`/beneficiaries?${bFiltersToParams(f)}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async get(beneficiaryId: string): Promise<Beneficiary> {
    const { data } = await api.get<Envelope<Beneficiary>>(
      `/beneficiaries/${beneficiaryId}`,
    );
    return data.data;
  },

  /** Dedup check runs server-side during create; this is a preview endpoint. */
  async findDuplicates(
    input: Partial<BeneficiaryWithConsentFormData>,
  ): Promise<DuplicateCandidate[]> {
    const { data } = await api.post<Envelope<DuplicateCandidate[]>>(
      "/beneficiaries/dedupe-check",
      input,
    );
    return data.data;
  },

  async create(input: BeneficiaryWithConsentFormData): Promise<Beneficiary> {
    const { data } = await api.post<Envelope<Beneficiary>>(
      "/beneficiaries",
      input,
    );
    return data.data;
  },

  async update(
    beneficiaryId: string,
    patch: Partial<BeneficiaryWithConsentFormData>,
  ): Promise<Beneficiary> {
    const { data } = await api.patch<Envelope<Beneficiary>>(
      `/beneficiaries/${beneficiaryId}`,
      patch,
    );
    return data.data;
  },

  async verify(
    beneficiaryId: string,
    verified: boolean,
    notes?: string,
  ): Promise<Beneficiary> {
    const { data } = await api.post<Envelope<Beneficiary>>(
      `/beneficiaries/${beneficiaryId}/verify`,
      {
        verified,
        notes,
      },
    );
    return data.data;
  },

  async merge(primaryId: string, duplicateId: string): Promise<Beneficiary> {
    const { data } = await api.post<Envelope<Beneficiary>>(
      `/beneficiaries/${primaryId}/merge`,
      {
        duplicate_id: duplicateId,
      },
    );
    return data.data;
  },

  /* ---- Service Delivery ---- */
  async listDeliveries(f: ServiceDeliveryFilters) {
    const p = new URLSearchParams();
    if (f.projectId) p.set("project_id", f.projectId);
    if (f.supplierId) p.set("supplier_id", f.supplierId);
    if (f.status?.length) p.set("status", f.status.join(","));
    if (f.q) p.set("q", f.q);
    if (f.limit) p.set("limit", String(f.limit));
    if (f.cursor) p.set("cursor", f.cursor);
    const { data } = await api.get<
      Envelope<ServiceDelivery[]> & { pagination: any }
    >(`/service-deliveries?${p.toString()}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async createDelivery(
    input: ServiceDeliveryFormData,
    photo?: File,
  ): Promise<ServiceDelivery> {
    if (photo) {
      const fd = new FormData();
      Object.entries(input).forEach(([k, v]) => {
        if (v == null) return;
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      });
      fd.append("photo", photo);
      const { data } = await api.post<Envelope<ServiceDelivery>>(
        "/service-deliveries",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data.data;
    }
    const { data } = await api.post<Envelope<ServiceDelivery>>(
      "/service-deliveries",
      input,
    );
    return data.data;
  },

  async verifyDelivery(
    deliveryId: string,
    verified: boolean,
  ): Promise<ServiceDelivery> {
    const { data } = await api.post<Envelope<ServiceDelivery>>(
      `/service-deliveries/${deliveryId}/verify`,
      { verified },
    );
    return data.data;
  },

  /* ---- SMS/USSD intake ---- */
  async smsIntake(): Promise<Beneficiary[]> {
    const { data } = await api.get<Envelope<Beneficiary[]>>(
      "/beneficiaries?sms_intake=true&limit=100",
    );
    return data.data;
  },

  async bulkImport(file: File): Promise<{ jobId: string; statusUrl: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post<
      Envelope<{ jobId: string; statusUrl: string }>
    >("/beneficiaries/bulk-import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
};