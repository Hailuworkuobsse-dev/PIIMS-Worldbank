import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { parsePagination, buildPaginationMeta, decodeCursor } from '@/utils/pagination.js';
import type { AuditLogDTO } from './admin.types.js';
import type { ListAuditQuery } from './admin.schemas.js';

export async function listAuditLogs(
  query: ListAuditQuery
): Promise<{
  data: AuditLogDTO[];
  pagination: {
    nextCursor?: string;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  const filters: Prisma.AuditLogWhereInput[] = [];
  if (query.user_id) filters.push({ userId: query.user_id });
  if (query.entity) filters.push({ entity: query.entity });
  if (query.entity_id) filters.push({ entityId: query.entity_id });
  if (query.action) filters.push({ action: query.action as any });
  if (query.from) filters.push({ createdAt: { gte: new Date(query.from) } });
  if (query.to) filters.push({ createdAt: { lte: new Date(query.to) } });
  if (query.q) {
    filters.push({
      OR: [
        { entity: { contains: query.q } },
        { entityId: { contains: query.q } }
      ]
    });
  }

  const where: Prisma.AuditLogWhereInput = filters.length ? { AND: filters } : {};

  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.AuditLogWhereInput | undefined = cursorId
    ? { logId: { lt: BigInt(cursorId) } }
    : undefined;

  const [rows, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      orderBy: { logId: 'desc' },
      take: pagination.limit + 1,
      include: { user: { select: { fullName: true, username: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);

  const hasMore = rows.length > pagination.limit;
  const trimmed = hasMore ? rows.slice(0, pagination.limit) : rows;
  const last = trimmed[trimmed.length - 1];

  return {
    data: trimmed.map((r) => ({
      logId: String(r.logId),
      ...(r.userId ? { userId: r.userId } : {}),
      ...(r.user ? { userName: r.user.fullName } : {}),
      entity: r.entity,
      ...(r.entityId ? { entityId: r.entityId } : {}),
      action: r.action,
      ...(r.oldValue ? { oldValue: r.oldValue } : {}),
      ...(r.newValue ? { newValue: r.newValue } : {}),
      ...(r.ipAddress ? { ipAddress: r.ipAddress } : {}),
      ...(r.userAgent ? { userAgent: r.userAgent } : {}),
      createdAt: r.createdAt.toISOString(),
      recordHash: r.recordHash
    })),
    pagination: {
      ...(hasMore && last ? { nextCursor: Buffer.from(String(last.logId)).toString('base64url') } : {}),
      limit: pagination.limit,
      totalCount,
      hasMore
    }
  };
}