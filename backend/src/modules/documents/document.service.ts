import { createHash } from 'node:crypto';
import { Prisma, DocType } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { storage } from '@/config/storage.js';
import { writeAudit } from '@/lib/audit.js';
import { buildDocumentKey } from '@/lib/file-naming.js';
import { canAccessProject } from '@/lib/scope.js';
import { parsePagination, buildPaginationMeta, decodeCursor } from '@/utils/pagination.js';
import { ForbiddenError, NotFoundError } from '@/lib/errors.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import type { DocumentDTO, DocumentVersionDTO, SignedUrlDTO } from './document.types.js';
import type { UploadDocumentInput, ListDocumentsQuery } from './document.schemas.js';

const docInclude = {
  project: { select: { projectId: true, projectCode: true, ownerOrgId: true, createdById: true, location: true } },
  uploadedBy: { select: { fullName: true } }
} satisfies Prisma.DocumentInclude;

type DocWithRelations = Prisma.DocumentGetPayload<{ include: typeof docInclude }>;

function toDTO(d: DocWithRelations): DocumentDTO {
  return {
    docId: d.docId,
    ...(d.projectId ? { projectId: d.projectId } : {}),
    ...(d.project ? { projectCode: d.project.projectCode } : {}),
    docType: d.docType,
    title: d.title,
    ...(d.description ? { description: d.description } : {}),
    version: d.version,
    filePath: d.filePath,
    fileSize: Number(d.fileSize),
    mimeType: d.mimeType,
    checksum: d.checksum,
    uploadedById: d.uploadedById,
    uploadedByName: d.uploadedBy.fullName,
    uploadedAt: d.createdAt.toISOString(),
    accessLevel: d.accessLevel,
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : []
  };
}

/* ════════════════════════════════════════════════════════════════════
 * LIST
 * ════════════════════════════════════════════════════════════════════ */

export async function listDocuments(
  query: ListDocumentsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<{
  data: DocumentDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  const filters: Prisma.DocumentWhereInput[] = [];

  if (query.project_id) {
    filters.push({ projectId: query.project_id });
  }
  if (query.doc_type) {
    const types = query.doc_type.split(',').filter(Boolean) as DocType[];
    if (types.length) filters.push({ docType: { in: types } });
  }
  if (query.q) {
    filters.push({ title: { contains: query.q } });
  }
  if (query.from) filters.push({ createdAt: { gte: new Date(query.from) } });
  if (query.to) filters.push({ createdAt: { lte: new Date(query.to) } });

  // Scope enforcement via project visibility (or public documents)
  if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      OR: [
        { accessLevel: 'PUBLIC' },
        { project: { is: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] } } }
      ]
    });
  }

  const where: Prisma.DocumentWhereInput = filters.length ? { AND: filters } : {};

  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.DocumentWhereInput | undefined = cursorId
    ? { docId: { not: cursorId } }
    : undefined;

  const [rows, totalCount] = await Promise.all([
    prisma.document.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      include: docInclude,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit + 1
    }),
    prisma.document.count({ where })
  ]);

  const { rows: trimmed, meta } = buildPaginationMeta(
    rows.map((r) => ({ id: r.docId })),
    pagination.limit,
    totalCount
  );
  const trimmedIds = new Set(trimmed.map((t) => t.id));
  const finalRows = rows.filter((r) => trimmedIds.has(r.docId));

  return {
    data: finalRows.map(toDTO),
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

export async function getDocument(docId: string): Promise<DocumentDTO> {
  const doc = await prisma.document.findUnique({
    where: { docId },
    include: docInclude
  });
  if (!doc) throw new NotFoundError('Document', docId);
  return toDTO(doc);
}

/* ════════════════════════════════════════════════════════════════════
 * UPLOAD
 * ════════════════════════════════════════════════════════════════════ */

export async function uploadDocument(
  input: UploadDocumentInput,
  file: { buffer: Buffer; size: number; originalname: string; mimetype: string },
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<DocumentDTO> {
  // Validate project access if linked
  if (input.projectId) {
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
  }

  const checksum = createHash('sha256').update(file.buffer).digest('hex');

  // Create the DB row first to get a docId, then upload to S3, then update
  const doc = await prisma.document.create({
    data: {
      ...(input.projectId ? { projectId: input.projectId } : {}),
      docType: input.docType,
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      version: 1,
      filePath: '', // placeholder — updated after S3 upload
      fileSize: BigInt(file.size),
      mimeType: file.mimetype,
      checksum,
      accessLevel: input.accessLevel,
      tags: input.tags,
      uploadedById: userId
    }
  });

  const key = buildDocumentKey(input.projectId || null, doc.docId, 1, file.originalname);

  try {
    await storage.upload(key, file.buffer, {
      contentType: file.mimetype,
      metadata: {
        docId: doc.docId,
        uploadedBy: userId,
        originalName: file.originalname
      }
    });
  } catch (err) {
    // Roll back the DB row if S3 failed
    await prisma.document.delete({ where: { docId: doc.docId } }).catch(() => {});
    throw err;
  }

  const updated = await prisma.document.update({
    where: { docId: doc.docId },
    data: { filePath: key },
    include: docInclude
  });

  await writeAudit({
    userId,
    entity: 'DOCUMENT',
    entityId: doc.docId,
    action: 'CREATE',
    newValue: {
      title: doc.title,
      docType: doc.docType,
      projectId: doc.projectId,
      sizeBytes: Number(doc.fileSize)
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * VERSIONS
 * ════════════════════════════════════════════════════════════════════ */

export async function listVersions(docId: string): Promise<DocumentVersionDTO[]> {
  const doc = await prisma.document.findUnique({ where: { docId } });
  if (!doc) throw new NotFoundError('Document', docId);

  const versions = await prisma.documentVersion.findMany({
    where: { docId },
    orderBy: { version: 'desc' },
    include: { uploadedBy: { select: { fullName: true } } }
  });

  return versions.map((v) => ({
    versionId: v.versionId,
    docId: v.docId,
    version: v.version,
    filePath: v.filePath,
    fileSize: Number(v.fileSize),
    checksum: v.checksum,
    ...(v.notes ? { notes: v.notes } : {}),
    uploadedById: v.uploadedById,
    uploadedByName: v.uploadedBy.fullName,
    uploadedAt: v.createdAt.toISOString()
  }));
}

export async function restoreVersion(
  docId: string,
  versionId: string,
  userId: string,
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<DocumentDTO> {
  const doc = await prisma.document.findUnique({ where: { docId } });
  if (!doc) throw new NotFoundError('Document', docId);

  const targetVersion = await prisma.documentVersion.findFirst({
    where: { versionId, docId }
  });
  if (!targetVersion) throw new NotFoundError('DocumentVersion', versionId);

  const newVersionNo = doc.version + 1;
  const checksum = createHash('sha256').update(targetVersion.checksum).digest('hex');

  const [updated] = await prisma.$transaction([
    prisma.document.update({
      where: { docId },
      data: {
        version: newVersionNo,
        filePath: targetVersion.filePath,
        fileSize: targetVersion.fileSize,
        checksum: targetVersion.checksum
      },
      include: docInclude
    }),
    prisma.documentVersion.create({
      data: {
        docId,
        version: newVersionNo,
        filePath: targetVersion.filePath,
        fileSize: targetVersion.fileSize,
        checksum,
        notes: `Restored from v${targetVersion.version}`,
        uploadedById: userId
      }
    })
  ]);

  await writeAudit({
    userId,
    entity: 'DOCUMENT',
    entityId: docId,
    action: 'UPDATE',
    oldValue: { version: doc.version },
    newValue: { version: newVersionNo, restoredFrom: targetVersion.version },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * SIGNED DOWNLOAD URL
 * ════════════════════════════════════════════════════════════════════ */

export async function getSignedUrl(
  docId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<SignedUrlDTO> {
  const doc = await prisma.document.findUnique({
    where: { docId },
    include: { project: { include: { location: true } } }
  });
  if (!doc) throw new NotFoundError('Document', docId);

  if (doc.accessLevel === 'RESTRICTED') {
    if (doc.projectId && doc.project) {
      const canAccess = canAccessProject(scope, orgId, userId, {
        ownerOrgId: doc.project.ownerOrgId,
        createdById: doc.project.createdById,
        location: doc.project.location
          ? {
              region: doc.project.location.region,
              zone: doc.project.location.zone,
              woreda: doc.project.location.woreda,
              kebele: doc.project.location.kebele
            }
          : null
      });
      if (!canAccess) throw new ForbiddenError('Access denied to this document');
    }
  }

  const url = await storage.signedUrl(doc.filePath, 900);
  const expiresAt = new Date(Date.now() + 900 * 1000).toISOString();
  return { url, expiresAt };
}