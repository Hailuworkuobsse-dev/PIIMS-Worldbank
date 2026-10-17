import type { DocType, AccessLevel } from '@prisma/client';

export interface DocumentDTO {
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
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  accessLevel: AccessLevel;
  tags: string[];
}

export interface DocumentVersionDTO {
  versionId: string;
  docId: string;
  version: number;
  filePath: string;
  fileSize: number;
  checksum: string;
  notes?: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface SignedUrlDTO {
  url: string;
  expiresAt: string;
}