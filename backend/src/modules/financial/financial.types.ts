import type { DisbursementStatus, FinancingCategory } from '@prisma/client';

export interface BudgetDTO {
  budgetId: string;
  projectId: string;
  componentId?: string;
  fiscalYear: number;
  currency: string;
  appropriation: string;
  released: string;
  expended: string;
  committed: string;
  balance: string;
  fmisReference?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementDTO {
  disbursementId: string;
  projectId: string;
  projectCode: string;
  sourceOrgId: string;
  sourceOrgName: string;
  category: FinancingCategory;
  amount: string;
  currency: string;
  amountEtb: string;
  valueDate: string;
  referenceNo?: string;
  status: DisbursementStatus;
  fmisReference?: string;
  createdAt: string;
}

export interface FinancialExecutionDTO {
  totalAppropriation: string;
  totalReleased: string;
  totalExpended: string;
  totalCommitted: string;
  executionRate: number;
  currency: string;
  byComponent: {
    componentId: string;
    componentName: string;
    appropriation: string;
    released: string;
    expended: string;
    executionPct: number;
  }[];
}

export interface FmisSyncRunDTO {
  runId: string;
  kind: 'APPROPRIATION' | 'RELEASE' | 'EXPENDITURE';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  recordsProcessed: number;
  recordsFailed: number;
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorSummary?: string;
}

export interface CostPerOutputRowDTO {
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  actualValue: number;
  expendedEtb: string;
  costPerUnitEtb: string;
}

export interface FinancialExceptionDTO {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kind: 'OVER_BUDGET' | 'DELAYED_RELEASE' | 'LOW_BURN' | 'HIGH_BURN' | 'UNRECONCILED';
  projectId: string;
  projectCode: string;
  message: string;
  detectedAt: string;
  resolved: boolean;
}