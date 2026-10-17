import { api } from "@/lib/api/client";
import type {
  Procurement,
  Contract,
  SupplierPerformance,
  ProcurementDelay,
  ProcurementFilters,
  ContractFilters,
} from "./procurement.types";
import type {
  ProcurementFormData,
  ContractFormData,
} from "./procurement.schema";

interface Envelope<T> {
  data: T;
}

export const procurementApi = {
  async list(f: ProcurementFilters) {
    const p = new URLSearchParams();
    if (f.projectId) p.set("project_id", f.projectId);
    if (f.status?.length) p.set("status", f.status.join(","));
    if (f.method?.length) p.set("method", f.method.join(","));
    if (f.q) p.set("q", f.q);
    if (f.limit) p.set("limit", String(f.limit));
    if (f.cursor) p.set("cursor", f.cursor);
    const { data } = await api.get<
      Envelope<Procurement[]> & { pagination: any }
    >(`/procurement?${p.toString()}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async create(input: ProcurementFormData): Promise<Procurement> {
    const { data } = await api.post<Envelope<Procurement>>(
      "/procurement",
      input,
    );
    return data.data;
  },

  async update(
    procurementId: string,
    patch: Partial<ProcurementFormData>,
  ): Promise<Procurement> {
    const { data } = await api.patch<Envelope<Procurement>>(
      `/procurement/${procurementId}`,
      patch,
    );
    return data.data;
  },

  async delays(projectId?: string): Promise<ProcurementDelay[]> {
    const p = projectId ? `?project_id=${projectId}` : "";
    const { data } = await api.get<Envelope<ProcurementDelay[]>>(
      `/procurement/delays${p}`,
    );
    return data.data;
  },

  async contracts(f: ContractFilters) {
    const p = new URLSearchParams();
    if (f.projectId) p.set("project_id", f.projectId);
    if (f.supplierId) p.set("supplier_id", f.supplierId);
    if (f.status?.length) p.set("status", f.status.join(","));
    if (f.q) p.set("q", f.q);
    if (f.limit) p.set("limit", String(f.limit));
    if (f.cursor) p.set("cursor", f.cursor);
    const { data } = await api.get<Envelope<Contract[]> & { pagination: any }>(
      `/contracts?${p.toString()}`,
    );
    return { data: data.data, pagination: (data as any).pagination };
  },

  async createContract(input: ContractFormData): Promise<Contract> {
    const { data } = await api.post<Envelope<Contract>>("/contracts", input);
    return data.data;
  },

  async updateContract(
    contractId: string,
    patch: Partial<ContractFormData>,
  ): Promise<Contract> {
    const { data } = await api.patch<Envelope<Contract>>(
      `/contracts/${contractId}`,
      patch,
    );
    return data.data;
  },

  async supplierPerformance(supplierId: string): Promise<SupplierPerformance> {
    const { data } = await api.get<Envelope<SupplierPerformance>>(
      `/suppliers/${supplierId}/performance`,
    );
    return data.data;
  },
};