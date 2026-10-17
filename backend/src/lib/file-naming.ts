import { randomUUID } from 'node:crypto';

/**
 * Deterministic S3 keys. Every file lives under its logical parent so
 * a data manager can browse by project or by document type.
 */
export function buildDocumentKey(
  projectId: string | null,
  docId: string,
  version: number,
  originalName: string
): string {
  const safe = sanitize(originalName);
  const prefix = projectId ? `projects/${projectId}` : 'general';
  return `documents/${prefix}/${docId}/v${version}-${safe}`;
}

export function buildInceptionKey(
  projectId: string,
  reportId: string,
  version: number,
  originalName: string
): string {
  const safe = sanitize(originalName);
  return `inception/${projectId}/${reportId}/v${version}-${safe}`;
}

export function buildReportKey(
  reportId: string,
  format: 'PDF' | 'EXCEL' | 'CSV' | 'XML'
): string {
  const ext =
    format === 'PDF' ? 'pdf' : format === 'EXCEL' ? 'xlsx' : format === 'XML' ? 'xml' : 'csv';
  return `reports/${new Date().toISOString().slice(0, 7)}/${reportId}.${ext}`;
}

export function buildMediaKey(
  submissionId: string,
  originalName: string
): string {
  const safe = sanitize(originalName);
  return `media/${submissionId}/${randomUUID()}-${safe}`;
}

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-100);
}