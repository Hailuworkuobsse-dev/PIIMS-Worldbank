/* =========================================================================
 * Enums — mirror the Data Dictionary + API Spec
 * ========================================================================= */
export const PROJECT_STATUSES = [
  "IDEA",
  "PROFILE",
  "PRE_FEASIBILITY",
  "FEASIBILITY",
  "APPRAISAL",
  "APPROVED",
  "ACTIVE",
  "CLOSED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_SECTORS = ["WATER", "ENERGY", "BOTH", "OTHER"] as const;
export type ProjectSector = (typeof PROJECT_SECTORS)[number];

export const IMPL_ARRANGEMENTS = [
  "PIU",
  "LINE_MINISTRY",
  "REGIONAL",
  "OTHER",
] as const;
export type ImplementationArrangement = (typeof IMPL_ARRANGEMENTS)[number];

export const FINANCING_SOURCES = [
  "WORLD_BANK",
  "GOVERNMENT",
  "DBE",
  "OTHER",
] as const;
export type FinancingSource = (typeof FINANCING_SOURCES)[number];

export const STAGE_ORDER: ProjectStatus[] = [
  "IDEA",
  "PROFILE",
  "PRE_FEASIBILITY",
  "FEASIBILITY",
  "APPRAISAL",
  "APPROVED",
  "ACTIVE",
  "CLOSED",
];

/* =========================================================================
 * Core entity
 * ========================================================================= */
export interface Money {
  amount: string; // string decimal per API contract
  currency: "ETB" | "USD" | "EUR";
}

export interface ProjectLocation {
  locationId?: string;
  region: string;
  regionCode?: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  latitude?: number;
  longitude?: number;
}

export interface FinancingLine {
  source: FinancingSource;
  amount: string;
  currency: "ETB" | "USD" | "EUR";
  referenceNo?: string;
}

export interface Project {
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
  location?: ProjectLocation;
  totalBudget: Money;
  wbCreditNo?: string;
  approvalDate?: string;
  startDate?: string;
  endDate?: string;
  actualStart?: string;
  actualEnd?: string;
  implementationArrangement?: ImplementationArrangement;
  financingSource?: FinancingLine[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProjectSummary extends Pick<
  Project,
  | "projectId"
  | "projectCode"
  | "name"
  | "sector"
  | "status"
  | "totalBudget"
  | "startDate"
  | "endDate"
  | "createdAt"
  | "updatedAt"
> {
  ownerOrgName?: string;
  region?: string;
  /** Derived — % of active indicators on-track */
  progressPct?: number;
}

/* =========================================================================
 * Filters
 * ========================================================================= */
export interface ProjectFilters {
  q?: string;
  status?: ProjectStatus[];
  sector?: ProjectSector[];
  region?: string;
  ownerOrgId?: string;
  createdAfter?: string;
  createdBefore?: string;
  sort?: string; // e.g. '-updatedAt,name'
  cursor?: string;
  limit?: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}

/* =========================================================================
 * Stage transitions
 * ========================================================================= */
export interface StageAdvanceRequest {
  targetStage: ProjectStatus;
  checklist: Record<string, boolean>;
  notes?: string;
}

export interface ProjectHistoryEntry {
  logId: number;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "ADVANCE";
  userId: string;
  userName: string;
  at: string;
  changes: { field: string; before?: unknown; after?: unknown }[];
  notes?: string;
}