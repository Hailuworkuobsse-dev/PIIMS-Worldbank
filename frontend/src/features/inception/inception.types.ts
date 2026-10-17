export const REPORT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "APPROVED",
  "REJECTED",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface InceptionReportTemplate {
  templateId: string;
  code: string;
  name: string;
  sections: { id: string; title: string; required: boolean }[];
  active: boolean;
}

export interface ReviewComment {
  commentId: string;
  reportId: string;
  sectionId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  parentId?: string;
}

export interface InceptionReport {
  reportId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  version: number;
  templateId: string;
  templateName: string;
  submissionDate?: string;
  dueDate: string;
  status: ReportStatus;
  submittedBy?: string;
  submittedByName?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  noObjection: boolean;
  noObjectionDate?: string;
  documentId?: string;
  documentPath?: string;
  summary?: string;
}

export interface InceptionReportListFilters {
  projectId?: string;
  status?: ReportStatus[];
  from?: string;
  to?: string;
  overdue?: boolean;
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface SubmitInceptionInput {
  projectId: string;
  templateId: string;
  version: number;
  summary: string;
  file: File;
}

export interface ReviewDecisionInput {
  decision: "APPROVE" | "REQUEST_REVISION" | "REJECT";
  comments?: string;
  sectionComments?: Record<string, string>;
}

export interface NoObjectionInput {
  noObjection: boolean;
  effectiveDate: string;
  comments?: string;
}

export interface ReportVersionSummary {
  reportId: string;
  version: number;
  status: ReportStatus;
  submittedAt?: string;
  reviewedAt?: string;
  filePath?: string;
}