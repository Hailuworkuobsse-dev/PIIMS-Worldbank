export const DISBURSEMENT_STATUSES = [
  "PLANNED",
  "REQUESTED",
  "APPROVED",
  "DISBURSED",
  "RECONCILED",
  "REJECTED",
] as const;
export type DisbursementStatus = (typeof DISBURSEMENT_STATUSES)[number];

export const FINANCING_CATEGORIES = [
  "CATEGORY_1",
  "CATEGORY_2",
  "CATEGORY_3",
  "OTHER",
] as const;
export type FinancingCategory = (typeof FINANCING_CATEGORIES)[number];

export type Currency = "ETB" | "USD" | "EUR";

export interface Budget {
  budgetId: string;
  projectId: string;
  componentId?: string;
  fiscalYear: number;
  currency: Currency;
  appropriation: string;
  released: string;
  expended: string;
  committed: string;
  balance: string;
  fmisReference?: string;
  lastSyncAt?: string;
}

export interface Disbursement {
  disbursementId: string;
  projectId: string;
  projectCode: string;
  sourceOrgId: string;
  sourceOrgName: string;
  category: FinancingCategory;
  amount: string;
  currency: Currency;
  amountEtb: string;
  valueDate: string;
  referenceNo?: string;
  status: DisbursementStatus;
  fmisReference?: string;
  createdAt: string;
}

export interface FinancialExecution {
  totalAppropriation: string;
  totalReleased: string;
  totalExpended: string;
  totalCommitted: string;
  executionRate: number;
  currency: Currency;
  byComponent: {
    componentId: string;
    componentName: string;
    appropriation: string;
    released: string;
    expended: string;
    executionPct: number;
  }[];
}

export interface FmisSyncRun {
  runId: string;
  kind: "APPROPRIATION" | "RELEASE" | "EXPENDITURE";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  recordsProcessed: number;
  recordsFailed: number;
  status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  errorSummary?: string;
}

export interface CostPerOutputRow {
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  actualValue: number;
  expendedEtb: string;
  costPerUnitEtb: string;
}

export interface FinancialException {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  kind:
    | "OVER_BUDGET"
    | "DELAYED_RELEASE"
    | "LOW_BURN"
    | "HIGH_BURN"
    | "UNRECONCILED";
  projectId: string;
  projectCode: string;
  message: string;
  detectedAt: string;
  resolved: boolean;
}

export interface BudgetFilters {
  projectId?: string;
  fiscalYear?: number;
  componentId?: string;
}

export interface DisbursementFilters {
  projectId?: string;
  status?: DisbursementStatus[];
  sourceOrgId?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}