export const ANON_LEVELS = ["L0", "L1", "L2", "L3"] as const;
export type AnonLevel = (typeof ANON_LEVELS)[number];

export const DATASET_FORMATS = [
  "CSV",
  "STATA",
  "SPSS",
  "R",
  "PARQUET",
  "EXCEL",
] as const;
export type DatasetFormat = (typeof DATASET_FORMATS)[number];

export interface WaveDataset {
  datasetId: string;
  waveId: string;
  waveCode: string;
  waveName: string;
  version: number;
  recordCount: number;
  buildStartedAt: string;
  buildCompletedAt?: string;
  checksum?: string;
  status: "BUILDING" | "READY" | "RELEASED" | "ARCHIVED";
}

export interface ResearchDataset {
  datasetId: string;
  waveId: string;
  waveCode: string;
  anonymizationLevel: AnonLevel;
  version: number;
  formats: DatasetFormat[];
  recordCount: number;
  releasedAt?: string;
  codebookRef?: string;
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED";
}

export interface DataRequest {
  requestId: string;
  datasetId: string;
  datasetCode: string;
  researcherName: string;
  researcherEmail: string;
  institution: string;
  purpose: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
  submittedAt: string;
  approvedAt?: string;
  accessExpiresAt?: string;
  duaSigned: boolean;
}

export interface AnonymizationConfig {
  level: AnonLevel;
  ageBracket: number; // 5 for 5-year bins, 0 to suppress
  incomeTopCode: number; // percentile, e.g. 99
  locationGranularity: "REGION" | "ZONE" | "WOREDA" | "KEBELE" | "REMOVED";
  suppressionThreshold: number; // k-anonymity
  addNoise: boolean;
}

export const DEFAULT_ANON_CONFIG: AnonymizationConfig = {
  level: "L2",
  ageBracket: 5,
  incomeTopCode: 99,
  locationGranularity: "ZONE",
  suppressionThreshold: 5,
  addNoise: false,
};

export interface PanelLink {
  panelId: string;
  treatmentGroupId: string;
  treatmentGroupName: string;
  wavesPresent: string[]; // ['W0','W1','W2']
  attritionWave?: string;
}