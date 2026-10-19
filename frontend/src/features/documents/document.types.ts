export const DOC_TYPES = [
  "APPRAISAL",
  "FEASIBILITY",
  "CONTRACT",
  "INVOICE",
  "REPORT",
  "INCEPTION",
  "PROCUREMENT",
  "LEGAL",
  "TECHNICAL",
  "OTHER",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const ACCESS_LEVELS = ["PUBLIC", "INTERNAL", "RESTRICTED"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export interface DocumentMeta {
  docId: string;
  projectId?: string;
  projectCode?: string;
  docType: DocType;
  title: string;
  description?: string;
  version: number;
  filePath: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  accessLevel: AccessLevel;
  tags?: string[];
}

export interface DocumentVersion {
  versionId: string;
  docId: string;
  version: number;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  notes?: string;
}

export interface DocumentFilters {
  projectId?: string | undefined;
  docType?: DocType[] | undefined;
  q?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}