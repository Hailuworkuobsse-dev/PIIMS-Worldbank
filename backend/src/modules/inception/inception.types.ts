import type { InceptionStatus } from '@prisma/client';

export interface InceptionReportDTO {
  reportId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  version: number;
  templateId?: string;
  templateName: string;
  submissionDate?: string;
  dueDate: string;
  status: InceptionStatus;
  submittedById?: string;
  submittedByName?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  noObjection: boolean;
  noObjectionDate?: string;
  documentId?: string;
  summary?: string;
}

export interface ReviewCommentDTO {
  commentId: string;
  reportId: string;
  sectionId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  resolvedById?: string;
  resolvedAt?: string;
  parentId?: string;
}

export interface InceptionTemplateDTO {
  templateId: string;
  code: string;
  name: string;
  sections: { id: string; title: string; required: boolean }[];
  active: boolean;
}

export interface InceptionVersionSummaryDTO {
  reportId: string;
  version: number;
  status: InceptionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  filePath?: string;
}