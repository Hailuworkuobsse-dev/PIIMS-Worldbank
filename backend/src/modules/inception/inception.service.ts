import { createHash } from 'node:crypto';
import { Prisma, InceptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { storage } from '@/config/storage.js';
import { buildInceptionKey } from '@/lib/file-naming.js';
import { writeAudit } from '@/lib/audit.js';
import { canAccessProject } from '@/lib/scope.js';
import { parsePagination, buildPaginationMeta, decodeCursor } from '@/utils/pagination.js';
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError
} from '@/lib/errors.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import type {
  InceptionReportDTO, ReviewCommentDTO, InceptionTemplateDTO,
  InceptionVersionSummaryDTO
} from './inception.types.js';
import type {
  SubmitInceptionInput, ReviewDecisionInput, NoObjectionInput,
  AddCommentInput, ListReportsQuery
} from './inception.schemas.js';

/* ─── Static template catalogue (until templates are DB-backed in a later step) */
const TEMPLATES: InceptionTemplateDTO[] = [
  {
    templateId: '11111111-1111-4111-8111-111111111111',
    code: 'WB-STANDARD',
    name: 'World Bank Standard Inception Report',
    sections: [
      { id: 'context', title: 'Project Context & Background', required: true },
      { id: 'definition', title: 'Project Definition & Objectives', required: true },
      { id: 'organization', title: 'Implementation Organization', required: true },
      { id: 'staffing', title: 'Staffing & Capacity', required: true },
      { id: 'procedures', title: 'Management Procedures', required: true },
      { id: 'workplan', title: 'Work Plan & Milestones', required: true },
      { id: 'methodology', title: 'Methodology & Approach', required: true },
      { id: 'risks', title: 'Risks & Mitigations', required: false }
    ],
    active: true
  },
  {
    templateId: '22222222-2222-4222-8222-222222222222',
    code: 'WB-SIMPLIFIED',
    name: 'World Bank Simplified Inception Report',
    sections: [
      { id: 'context', title: 'Project Context', required: true },
      { id: 'workplan', title: 'Work Plan', required: true },
      { id: 'methodology', title: 'Methodology', required: true }
    ],
    active: true
  }
];

const TEMPLATE_BY_ID: Record<string, InceptionTemplateDTO> = Object.fromEntries(
  TEMPLATES.map((t) => [t.templateId, t])
);

const reportInclude = {
  project: { select: { projectId: true, projectCode: true, name: true, ownerOrgId: true, createdById: true, location: true } },
  submittedBy: { select: { fullName: true } },
  reviewedBy: { select: { fullName: true } }
} satisfies Prisma.InceptionReportInclude;

type ReportWithRelations = Prisma.InceptionReportGetPayload<{ include: typeof reportInclude }>;

function toReportDTO(r: ReportWithRelations): InceptionReportDTO {
  const templateName = r.templateId ? TEMPLATE_BY_ID[r.templateId]?.name : undefined;
  return {
    reportId: r.reportId,
    projectId: r.projectId,
    projectCode: r.project.projectCode,
    projectName: r.project.name,
    version: r.version,
    ...(r.templateId ? { templateId: r.templateId } : {}),
    templateName: templateName ?? 'Standard Inception Report',
    ...(r.submissionDate ? { submissionDate: r.submissionDate.toISOString().slice(0, 10) } : {}),
    dueDate: r.dueDate.toISOString().slice(0, 10),
    status: r.status,
    ...(r.submittedById ? { submittedById: r.submittedById } : {}),
    ...(r.submittedBy ? { submittedByName: r.submittedBy.fullName } : {}),
    ...(r.reviewedById ? { reviewedById: r.reviewedById } : {}),
    ...(r.reviewedBy ? { reviewedByName: r.reviewedBy.fullName } : {}),
    ...(r.reviewedAt ? { reviewedAt: r.reviewedAt.toISOString() } : {}),
    noObjection: r.noObjection,
    ...(r.noObjectionDate ? { noObjectionDate: r.noObjectionDate.toISOString().slice(0, 10) } : {}),
    ...(r.documentId ? { documentId: r.documentId } : {}),
    ...(r.summary ? { summary: r.summary } : {})
  };
}

function toCommentDTO(c: {
  commentId: string; reportId: string; sectionId: string | null;
  authorId: string; text: string; createdAt: Date; resolved: boolean;
  resolvedById: string | null; resolvedAt: Date | null; parentId: string | null;
  author: { fullName: string; role: { name: string } };
}): ReviewCommentDTO {
  return {
    commentId: c.commentId,
    reportId: c.reportId,
    ...(c.sectionId ? { sectionId: c.sectionId } : {}),
    authorId: c.authorId,
    authorName: c.author.fullName,
    authorRole: c.author.role.name,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    resolved: c.resolved,
    ...(c.resolvedById ? { resolvedById: c.resolvedById } : {}),
    ...(c.resolvedAt ? { resolvedAt: c.resolvedAt.toISOString() } : {}),
    ...(c.parentId ? { parentId: c.parentId } : {})
  };
}

/* ════════════════════════════════════════════════════════════════════
 * LIST
 * ════════════════════════════════════════════════════════════════════ */

export async function listReports(
  query: ListReportsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<{
  data: InceptionReportDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  const filters: Prisma.InceptionReportWhereInput[] = [];

  if (query.project_id) filters.push({ projectId: query.project_id });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean) as InceptionStatus[];
    if (statuses.length) filters.push({ status: { in: statuses } });
  }
  if (query.from) filters.push({ dueDate: { gte: new Date(query.from) } });
  if (query.to) filters.push({ dueDate: { lte: new Date(query.to) } });
  if (query.overdue) {
    filters.push({
      dueDate: { lt: new Date() },
      status: { notIn: ['APPROVED', 'REJECTED'] }
    });
  }
  if (query.q) {
    filters.push({ project: { name: { contains: query.q } } });
  }
  if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      project: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] }
    });
  }

  const where: Prisma.InceptionReportWhereInput = filters.length ? { AND: filters } : {};

  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.InceptionReportWhereInput | undefined = cursorId
    ? { reportId: { not: cursorId } }
    : undefined;

  const [rows, totalCount] = await Promise.all([
    prisma.inceptionReport.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      include: reportInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: pagination.limit + 1
    }),
    prisma.inceptionReport.count({ where })
  ]);

  const { rows: trimmed, meta } = buildPaginationMeta(
    rows.map((r) => ({ id: r.reportId })),
    pagination.limit,
    totalCount
  );
  const trimmedIds = new Set(trimmed.map((t) => t.id));
  const finalRows = rows.filter((r) => trimmedIds.has(r.reportId));

  return {
    data: finalRows.map(toReportDTO),
    pagination: {
      ...(meta.nextCursor ? { nextCursor: meta.nextCursor } : {}),
      limit: meta.limit,
      totalCount: meta.totalCount,
      hasMore: meta.hasMore
    }
  };
}

/* ════════════════════════════════════════════════════════════════════
 * GET
 * ════════════════════════════════════════════════════════════════════ */

export async function getReport(reportId: string): Promise<InceptionReportDTO> {
  const report = await prisma.inceptionReport.findUnique({
    where: { reportId },
    include: reportInclude
  });
  if (!report) throw new NotFoundError('InceptionReport', reportId);
  return toReportDTO(report);
}

/* ════════════════════════════════════════════════════════════════════
 * TEMPLATES
 * ════════════════════════════════════════════════════════════════════ */

export function listTemplates(): InceptionTemplateDTO[] {
  return TEMPLATES.filter((t) => t.active);
}

/* ════════════════════════════════════════════════════════════════════
 * SUBMIT
 * ════════════════════════════════════════════════════════════════════ */

export async function submitReport(
  input: SubmitInceptionInput,
  file: { buffer: Buffer; size: number; originalname: string; mimetype: string },
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<InceptionReportDTO> {
  // Verify project
  const project = await prisma.project.findFirst({
    where: { projectId: input.projectId, deletedAt: null },
    include: { location: true }
  });
  if (!project) throw new NotFoundError('Project', input.projectId);

  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: project.ownerOrgId,
      createdById: project.createdById,
      location: project.location
        ? {
            region: project.location.region,
            zone: project.location.zone,
            woreda: project.location.woreda,
            kebele: project.location.kebele
          }
        : null
    })
  ) {
    throw new ForbiddenError('You do not have access to this project');
  }

  // Check for existing DRAFT / SUBMITTED version with same number
  const existing = await prisma.inceptionReport.findFirst({
    where: { projectId: input.projectId, version: input.version }
  });
  if (existing && existing.status !== 'REVISION_REQUIRED' && existing.status !== 'DRAFT') {
    throw new ConflictError(
      `Version ${input.version} already exists with status ${existing.status}`
    );
  }

  // Verify template if provided
  if (input.templateId && !TEMPLATE_BY_ID[input.templateId]) {
    throw new BadRequestError('Invalid template ID');
  }

  // Upload file to S3 first
  const reportId = crypto.randomUUID();
  const key = buildInceptionKey(input.projectId, reportId, input.version, file.originalname);

  await storage.upload(key, file.buffer, {
    contentType: file.mimetype,
    metadata: {
      projectId: input.projectId,
      version: String(input.version),
      uploadedBy: userId
    }
  });

  const checksum = createHash('sha256').update(file.buffer).digest('hex');
  const dueDate = new Date(project.startDate ?? Date.now());
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from project start, or now

  const report = await prisma.inceptionReport.create({
    data: {
      reportId,
      projectId: input.projectId,
      version: input.version,
      ...(input.templateId ? { templateId: input.templateId } : {}),
      submissionDate: new Date(),
      dueDate,
      status: 'SUBMITTED',
      submittedById: userId,
      noObjection: false,
      ...(input.summary ? { summary: input.summary } : {})
    },
    include: reportInclude
  });

  // Also create a Document record for the uploaded file (linked to the project)
  const doc = await prisma.document.create({
    data: {
      projectId: input.projectId,
      docType: 'INCEPTION',
      title: `Inception Report v${input.version} – ${project.projectCode}`,
      version: input.version,
      filePath: key,
      fileSize: BigInt(file.size),
      mimeType: file.mimetype,
      checksum,
      accessLevel: 'INTERNAL',
      uploadedById: userId
    }
  });

  // Link the document to the report
  const updated = await prisma.inceptionReport.update({
    where: { reportId },
    data: { documentId: doc.docId },
    include: reportInclude
  });

  await writeAudit({
    userId,
    entity: 'INCEPTION_REPORT',
    entityId: reportId,
    action: 'CREATE',
    newValue: {
      projectId: input.projectId,
      version: input.version,
      status: 'SUBMITTED'
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toReportDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * REVIEW
 * ════════════════════════════════════════════════════════════════════ */

export async function reviewReport(
  reportId: string,
  input: ReviewDecisionInput,
  userId: string,
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<InceptionReportDTO> {
  const report = await prisma.inceptionReport.findUnique({ where: { reportId } });
  if (!report) throw new NotFoundError('InceptionReport', reportId);

  if (!['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)) {
    throw new BadRequestError(`Cannot review a report with status ${report.status}`);
  }

  const newStatus: InceptionStatus =
    input.decision === 'APPROVE'
      ? 'APPROVED'
      : input.decision === 'REJECT'
        ? 'REJECTED'
        : 'REVISION_REQUIRED';

  const updated = await prisma.inceptionReport.update({
    where: { reportId },
    data: {
      status: newStatus,
      reviewedById: userId,
      reviewedAt: new Date()
    },
    include: reportInclude
  });

  // Persist section-level comments
  if (input.sectionComments) {
    await prisma.reviewComment.createMany({
      data: Object.entries(input.sectionComments).map(([sectionId, text]) => ({
        reportId,
        sectionId,
        authorId: userId,
        text
      }))
    });
  }

  // General comment
  if (input.comments) {
    await prisma.reviewComment.create({
      data: {
        reportId,
        authorId: userId,
        text: input.comments
      }
    });
  }

  await writeAudit({
    userId,
    entity: 'INCEPTION_REPORT',
    entityId: reportId,
    action: input.decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
    oldValue: { status: report.status },
    newValue: { status: newStatus, decision: input.decision },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toReportDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * NO-OBJECTION
 * ════════════════════════════════════════════════════════════════════ */

export async function recordNoObjection(
  reportId: string,
  input: NoObjectionInput,
  userId: string,
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<InceptionReportDTO> {
  const report = await prisma.inceptionReport.findUnique({ where: { reportId } });
  if (!report) throw new NotFoundError('InceptionReport', reportId);

  if (report.status !== 'APPROVED') {
    throw new BadRequestError('No-objection can only be recorded on an APPROVED report');
  }

  const updated = await prisma.inceptionReport.update({
    where: { reportId },
    data: {
      noObjection: true,
      noObjectionDate: new Date(input.effectiveDate)
    },
    include: reportInclude
  });

  if (input.comments) {
    await prisma.reviewComment.create({
      data: { reportId, authorId: userId, text: `No-objection: ${input.comments}` }
    });
  }

  await writeAudit({
    userId,
    entity: 'INCEPTION_REPORT',
    entityId: reportId,
    action: 'APPROVE',
    newValue: { noObjection: true, effectiveDate: input.effectiveDate },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toReportDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * COMMENTS
 * ════════════════════════════════════════════════════════════════════ */

export async function listComments(reportId: string): Promise<ReviewCommentDTO[]> {
  const comments = await prisma.reviewComment.findMany({
    where: { reportId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { fullName: true, role: { select: { name: true } } } }
    }
  });
  return comments.map(toCommentDTO);
}

export async function addComment(
  reportId: string,
  input: AddCommentInput,
  userId: string
): Promise<ReviewCommentDTO> {
  const report = await prisma.inceptionReport.findUnique({ where: { reportId } });
  if (!report) throw new NotFoundError('InceptionReport', reportId);

  const created = await prisma.reviewComment.create({
    data: {
      reportId,
      authorId: userId,
      text: input.text,
      ...(input.section_id ? { sectionId: input.section_id } : {}),
      ...(input.parent_id ? { parentId: input.parent_id } : {})
    },
    include: {
      author: { select: { fullName: true, role: { select: { name: true } } } }
    }
  });

  return toCommentDTO(created);
}

export async function resolveComment(
  reportId: string,
  commentId: string,
  userId: string
): Promise<ReviewCommentDTO> {
  const comment = await prisma.reviewComment.findFirst({
    where: { commentId, reportId }
  });
  if (!comment) throw new NotFoundError('ReviewComment', commentId);

  const updated = await prisma.reviewComment.update({
    where: { commentId },
    data: { resolved: true, resolvedById: userId, resolvedAt: new Date() },
    include: {
      author: { select: { fullName: true, role: { select: { name: true } } } }
    }
  });

  return toCommentDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * VERSIONS
 * ════════════════════════════════════════════════════════════════════ */

export async function listVersions(projectId: string): Promise<InceptionVersionSummaryDTO[]> {
  const reports = await prisma.inceptionReport.findMany({
    where: { projectId },
    orderBy: { version: 'desc' },
    select: {
      reportId: true, version: true, status: true,
      submissionDate: true, reviewedAt: true,
      document: { select: { filePath: true } }
    }
  });

  return reports.map((r) => ({
    reportId: r.reportId,
    version: r.version,
    status: r.status,
    ...(r.submissionDate ? { submittedAt: r.submissionDate.toISOString().slice(0, 10) } : {}),
    ...(r.reviewedAt ? { reviewedAt: r.reviewedAt.toISOString() } : {}),
    ...(r.document?.filePath ? { filePath: r.document.filePath } : {})
  }));
}

/* ════════════════════════════════════════════════════════════════════
 * DOWNLOAD — returns a signed S3 URL for the report's Document
 * ════════════════════════════════════════════════════════════════════ */

export async function getDownloadUrl(reportId: string): Promise<{ url: string; expiresAt: string }> {
  const report = await prisma.inceptionReport.findUnique({
    where: { reportId },
    include: { document: true }
  });
  if (!report) throw new NotFoundError('InceptionReport', reportId);
  if (!report.document) throw new NotFoundError('Document for report', reportId);

  const url = await storage.signedUrl(report.document.filePath, 900);
  return { url, expiresAt: new Date(Date.now() + 900 * 1000).toISOString() };
}