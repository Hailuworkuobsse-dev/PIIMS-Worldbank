import type {
  ProcurementMethod, ProcurementStatus, ContractStatus
} from '@prisma/client';

export interface ProcurementDTO {
  procurementId: string;
  projectId: string;
  projectCode: string;
  componentId?: string;
  planRef: string;
  description: string;
  method: ProcurementMethod;
  estimatedAmount?: string;
  currency: string;
  planDate?: string;
  advertisementDate?: string;
  bidOpeningDate?: string;
  evaluationDate?: string;
  awardDate?: string;
  status: ProcurementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDTO {
  contractId: string;
  procurementId?: string;
  projectId: string;
  projectCode: string;
  supplierId: string;
  supplierName: string;
  contractNo: string;
  title: string;
  amount: string;
  currency: string;
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  status: ContractStatus;
  amendmentNo: number;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementDelayDTO {
  procurementId: string;
  planRef: string;
  description: string;
  planDate: string;
  daysOverdue: number;
  status: ProcurementStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SupplierPerformanceDTO {
  supplierId: string;
  supplierName: string;
  contractsCount: number;
  contractsValue: string;
  currency: string;
  deliveriesOnTime: number;
  deliveriesLate: number;
  qualityFlags: number;
  compositeScore: number;
}