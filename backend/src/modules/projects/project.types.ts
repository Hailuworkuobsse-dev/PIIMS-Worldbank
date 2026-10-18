import type { ProjectStatus, ProjectSector, ImplArrangement } from '@prisma/client';

/**
 * API shapes — match the frontend `Project`, `ProjectSummary`,
 * `ProjectLocation`, `FinancingLine`, `Money` types exactly.
 *
 * NOTE: this project compiles with `exactOptionalPropertyTypes: true`, so any
 * optional property that may be assigned a possibly-undefined value must
 * explicitly include `| undefined` in its type (e.g. `foo?: T | undefined`).
 */

export interface MoneyDTO {
  amount: string;   // string decimal, per API contract
  currency: string;
}

export interface ProjectLocationDTO {
  locationId?: string | undefined;
  region: string;
  zone?: string | undefined;
  woreda?: string | undefined;
  kebele?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export interface FinancingLineDTO {
  source: 'WORLD_BANK' | 'GOVERNMENT' | 'DBE' | 'OTHER';
  amount: string;
  currency: string;
  referenceNo?: string | undefined;
}

export interface ProjectDTO {
  projectId: string;
  projectCode: string;
  name: string;
  nameAm?: string | undefined;
  description?: string | undefined;
  sector: ProjectSector;
  subsector?: string | undefined;
  status: ProjectStatus;
  stageGate?: string | undefined;
  ownerOrgId: string;
  ownerOrgName?: string | undefined;
  location?: ProjectLocationDTO | undefined;
  totalBudget: MoneyDTO;
  wbCreditNo?: string | undefined;
  approvalDate?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  actualStart?: string | undefined;
  actualEnd?: string | undefined;
  implementationArrangement?: ImplArrangement | undefined;
  financingSource?: FinancingLineDTO[] | undefined;
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
  startDate?: string | undefined;
  endDate?: string | undefined;
  createdAt: string;
  updatedAt: string;
  ownerOrgName?: string | undefined;
  region?: string | undefined;
  progressPct?: number | undefined;
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