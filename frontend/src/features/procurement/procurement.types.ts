export const PROCUREMENT_METHODS = [
  "ICB",
  "NCB",
  "SHOPPING",
  "DIRECT",
  "OTHER",
] as const;
export type ProcurementMethod = (typeof PROCUREMENT_METHODS)[number];

export const PROCUREMENT_STATUSES = [
  "PLANNED",
  "ADVERTISED",
  "BID_OPEN",
  "EVALUATED",
  "AWARDED",
  "CANCELLED",
] as const;
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];

export const CONTRACT_STATUSES = [
  "DRAFT",
  "SIGNED",
  "ACTIVE",
  "COMPLETED",
  "TERMINATED",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface Procurement {
  procurementId: string;
  projectId: string;
  projectCode: string;
  componentId?: string;
  planRef: string;
  description: string;
  method: ProcurementMethod;
  estimatedAmount: string;
  currency: "ETB" | "USD" | "EUR";
  planDate: string;
  advertisementDate?: string;
  bidOpeningDate?: string;
  evaluationDate?: string;
  awardDate?: string;
  status: ProcurementStatus;
}

export interface Contract {
  contractId: string;
  procurementId?: string;
  projectId: string;
  projectCode: string;
  supplierId: string;
  supplierName: string;
  contractNo: string;
  title: string;
  amount: string;
  currency: "ETB" | "USD" | "EUR";
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  status: ContractStatus;
  amendmentNo: number;
  documentId?: string;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  contractsCount: number;
  contractsValue: string;
  deliveriesOnTime: number;
  deliveriesLate: number;
  qualityFlags: number;
  compositeScore: number;
}

export interface ProcurementDelay {
  procurementId: string;
  planRef: string;
  description: string;
  planDate: string;
  daysOverdue: number;
  status: ProcurementStatus;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ProcurementFilters {
  projectId?: string | undefined;
  status?: ProcurementStatus[] | undefined;
  method?: ProcurementMethod[] | undefined;
  q?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

export interface ContractFilters {
  projectId?: string;
  supplierId?: string;
  status?: ContractStatus[];
  q?: string;
  limit?: number;
  cursor?: string;
}