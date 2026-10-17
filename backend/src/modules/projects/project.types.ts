import type { ProjectStatus, ProjectSector, ImplArrangement } from '@prisma/client';

/**
 * API shapes — match the frontend `Project`, `ProjectSummary`,
 * `ProjectLocation`, `FinancingLine`, `Money` types exactly.
 */

export interface MoneyDTO {
  amount: string;   // string decimal, per API contract
  currency: string;
}

export interface ProjectLocationDTO {
  locationId?: string;
  region: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  latitude?: number;
  longitude?: number;
}

export interface FinancingLineDTO {
  source: 'WORLD_BANK' | 'GOVERNMENT' | 'DBE' | 'OTHER';
  amount: string;
  currency: string;
  referenceNo?: string;
}

export interface ProjectDTO {
  projectId: string;
  projectCode: string;
  name: string;
  nameAm?: string;
  description?: string;
  sector: ProjectSector;
  subsector?: string;
  status: ProjectStatus;
  stageGate?: string;
  ownerOrgId: string;
  ownerOrgName?: string;
  location?: ProjectLocationDTO;
  totalBudget: MoneyDTO;
  wbCreditNo?: string;
  approvalDate?: string;
  startDate?: string;
  endDate?: string;
  actualStart?: string;
  actualEnd?: string;
  implementationArrangement?: ImplArrangement;
  financingSource?: FinancingLineDTO[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProjectSummaryDTO {
  projectId: string;
  projectCode: string;
  name: string;
  sector: ProjectSector;
  status: ProjectStatus;
  totalBudget: MoneyDTO;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  ownerOrgName?: string;
  region?: string;
  progressPct?: number;
}

export interface StageAdvanceDTO {
  projectId: string;
  projectCode: string;
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
  advancedAt: string;
  advancedBy: string;
}

export interface PipelineCountsDTO {
  IDEA: number;
  PROFILE: number;
  PRE_FEASIBILITY: number;
  FEASIBILITY: number;
  APPRAISAL: number;
  APPROVED: number;
  ACTIVE: number;
  CLOSED: number;
  CANCELLED: number;
}