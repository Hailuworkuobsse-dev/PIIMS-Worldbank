import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import {
  BadRequestError, ConflictError, NotFoundError
} from '@/lib/errors.js';
import { parsePagination, decodeCursor } from '@/utils/pagination.js';
import { computeSlaDue, isTerminalStatus } from './grievance.utils.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import type { GrievanceDTO, GrievanceActionDTO, GrievanceStatsDTO } from './grievance.types.js';
import type {
  CreateGrievanceInput, ListGrievancesQuery,
  AssignInput, ResolveInput, EscalateInput, StatsQuery
} from './grievance.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

/* ════════════════════════════════════════════════════════════════════
 * TICKET NUMBER
 * ════════════════════════════════════════════════════════════════════ */

async function generateTicketNo(attempt = 1): Promise<string> {
  if (attempt > 5) throw new ConflictError('Could not generate ticket number');
  const year = new Date().getFullYear();
  const prefix = `GRV-${year}-`;
  const last = await prisma.grievance.findFirst({
    where: { ticketNo: { startsWith: prefix } },
    orderBy: { ticketNo: 'desc' },
    select: { ticketNo: true }
  });
  const next = last ? parseInt(last.ticketNo.split('-')[2] || '0', 10) + 1 : 1;
  const candidate = `${prefix}${String(next).padStart(5, '0')}`;
  const exists = await prisma.grievance.findUnique({ where: { ticketNo: candidate } });
  if (exists) return generateTicketNo(attempt + 1);
  return candidate;
}

/* ════════════════════════════════════════════════════════════════════
 * CREATE
 * ════════════════════════════════════════════════════════════════════ */

export async function createGrievance(
  input: CreateGrievanceInput,
  userId: string,
  ctx: Ctx
): Promise<GrievanceDTO> {
  const ticketNo = await generateTicketNo();
  const slaDue = computeSlaDue(input.severity);

  // Verify project if provided
  let locationId: string | null = null;
  if (input.projectId) {
    const p = await prisma.project.findUnique({
      where: { projectId: input.projectId },
      select: { locationId: true }
    });
    if (!p) throw new NotFoundError('Project', input.projectId);
    locationId = p.locationId;
  }

  const created = await prisma.grievance.create({
    data: {
      ticketNo,
      ...(input.projectId ? { projectId: input.projectId } : {}),
      ...(input.beneficiaryId ? { beneficiaryId: input.beneficiaryId } : {}),
      category: input.category,
      ...(input.subcategory ? { subcategory: input.subcategory } : {}),
      description: input.description,
      channel: input.channel,
      submittedAt: new Date(),
      ...(locationId ? { locationId } : {}),
      slaDue,
      severity: input.severity,
      status: 'OPEN',
      anonymous: input.anonymous
    },
    include: {
      project: { select: { projectCode: true } },
      beneficiary: { select: { fullName: true } }
    }
  });

  await writeAudit({
    userId, entity: 'GRIEVANCE', entityId: created.grievanceId, action: 'CREATE',
    newValue: {
      ticketNo: created.ticketNo, category: created.category,
      severity: created.severity, anonymous: created.anonymous
    },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toGrievanceDTO(created);
}

/* ════════════════════════════════════════════════════════════════════
 * LIST
 * ════════════════════════════════════════════════════════════════════ */

export async function listGrievances(
  query: ListGrievancesQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<{
  data: GrievanceDTO[];
  pagination: { limit: number; totalCount: number; hasMore: boolean };
}> {
  const filters: Prisma.GrievanceWhereInput[] = [];

  if (query.project_id) filters.push({ projectId: query.project_id });
  if (query.category) {
    const cats = query.category.split(',').filter(Boolean);
    if (cats.length) filters.push({ category: { in: cats as any[] } });
  }
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.severity) {
    const sevs = query.severity.split(',').filter(Boolean);
    if (sevs.length) filters.push({ severity: { in: sevs as any[] } });
  }
  if (query.assigned_to) filters.push({ assignedToId: query.assigned_to });
  if (query.overdue) {
    filters.push({
      slaDue: { lt: new Date() },
      status: { notIn: ['RESOLVED', 'CLOSED'] }
    });
  }
  if (query.from) filters.push({ submittedAt: { gte: new Date(query.from) } });
  if (query.to) filters.push({ submittedAt: { lte: new Date(query.to) } });
  if (query.q) {
    filters.push({
      OR: [
        { description: { contains: query.q } },
        { ticketNo: { contains: query.q } }
      ]
    });
  }

  // Scope: LG officers see own locality
  if (scope.orgLevel === 'REGIONAL' && scope.regions?.length) {
    filters.push({ location: { region: { in: scope.regions } } });
  }
  if (scope.orgLevel === 'WOREDA' && scope.woredas?.length) {
    filters.push({ location: { woreda: { in: scope.woredas } } });
  }
  if (scope.orgLevel === 'KEBELE' && scope.kebeles?.length) {
    filters.push({ location: { kebele: { in: scope.kebeles } } });
  }

  const where: Prisma.GrievanceWhereInput = filters.length ? { AND: filters } : {};
  const limit = Math.min(200, Number(query.limit) || 25);

  const [rows, totalCount] = await Promise.all([
    prisma.grievance.findMany({
      where,
      include: {
        project: { select: { projectCode: true } },
        beneficiary: { select: { fullName: true } },
        location: true,
        assignedTo: { select: { fullName: true } },
        escalatedTo: { select: { fullName: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit
    }),
    prisma.grievance.count({ where })
  ]);

  return {
    data: rows.map(toGrievanceDTO),
    pagination: { limit, totalCount, hasMore: totalCount > rows.length }
  };
}

export async function getGrievance(grievanceId: string): Promise<GrievanceDTO> {
  const g = await prisma.grievance.findUnique({
    where: { grievanceId },
    include: {
      project: { select: { projectCode: true } },
      beneficiary: { select: { fullName: true } },
      location: true,
      assignedTo: { select: { fullName: true } },
      escalatedTo: { select: { fullName: true } }
    }
  });
  if (!g) throw new NotFoundError('Grievance', grievanceId);
  return toGrievanceDTO(g);
}

/* ════════════════════════════════════════════════════════════════════
 * ASSIGN
 * ════════════════════════════════════════════════════════════════════ */

export async function assignGrievance(
  grievanceId: string,
  input: AssignInput,
  userId: string,
  ctx: Ctx
): Promise<GrievanceDTO> {
  const existing = await prisma.grievance.findUnique({ where: { grievanceId } });
  if (!existing) throw new NotFoundError('Grievance', grievanceId);
  if (isTerminalStatus(existing.status)) {
    throw new BadRequestError('Cannot assign a resolved/closed grievance');
  }

  const assignee = await prisma.user.findUnique({ where: { userId: input.assignedTo } });
  if (!assignee) throw new NotFoundError('User', input.assignedTo);

  await prisma.$transaction([
    prisma.grievance.update({
      where: { grievanceId },
      data: {
        assignedToId: input.assignedTo,
        assignedAt: new Date(),
        status: 'IN_PROGRESS'
      }
    }),
    prisma.grievanceAction.create({
      data: {
        grievanceId,
        actorId: userId,
        actionType: 'ASSIGN',
        notes: input.notes || `Assigned to ${assignee.fullName}`
      }
    })
  ]);

  await writeAudit({
    userId, entity: 'GRIEVANCE', entityId: grievanceId, action: 'UPDATE',
    newValue: { assignedTo: input.assignedTo, status: 'IN_PROGRESS' },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getGrievance(grievanceId);
}

/* ════════════════════════════════════════════════════════════════════
 * RESOLVE
 * ════════════════════════════════════════════════════════════════════ */

export async function resolveGrievance(
  grievanceId: string,
  input: ResolveInput,
  userId: string,
  ctx: Ctx
): Promise<GrievanceDTO> {
  const existing = await prisma.grievance.findUnique({ where: { grievanceId } });
  if (!existing) throw new NotFoundError('Grievance', grievanceId);
  if (existing.status === 'CLOSED') {
    throw new BadRequestError('Grievance is already closed');
  }

  await prisma.$transaction([
    prisma.grievance.update({
      where: { grievanceId },
      data: {
        resolution: input.resolution,
        resolvedAt: new Date(),
        status: 'RESOLVED'
      }
    }),
    prisma.grievanceAction.create({
      data: {
        grievanceId,
        actorId: userId,
        actionType: 'RESOLVE',
        notes: input.resolution
      }
    })
  ]);

  await writeAudit({
    userId, entity: 'GRIEVANCE', entityId: grievanceId, action: 'APPROVE',
    oldValue: { status: existing.status }, newValue: { status: 'RESOLVED' },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getGrievance(grievanceId);
}

/* ════════════════════════════════════════════════════════════════════
 * ESCALATE
 * ════════════════════════════════════════════════════════════════════ */

export async function escalateGrievance(
  grievanceId: string,
  input: EscalateInput,
  userId: string,
  ctx: Ctx
): Promise<GrievanceDTO> {
  const existing = await prisma.grievance.findUnique({ where: { grievanceId } });
  if (!existing) throw new NotFoundError('Grievance', grievanceId);
  if (isTerminalStatus(existing.status)) {
    throw new BadRequestError('Cannot escalate a resolved/closed grievance');
  }

  const escalatee = await prisma.user.findUnique({ where: { userId: input.escalatedTo } });
  if (!escalatee) throw new NotFoundError('User', input.escalatedTo);

  await prisma.$transaction([
    prisma.grievance.update({
      where: { grievanceId },
      data: {
        escalatedToId: input.escalatedTo,
        status: 'ESCALATED'
      }
    }),
    prisma.grievanceAction.create({
      data: {
        grievanceId,
        actorId: userId,
        actionType: 'ESCALATE',
        notes: `Escalated to ${escalatee.fullName}: ${input.reason}`
      }
    })
  ]);

  await writeAudit({
    userId, entity: 'GRIEVANCE', entityId: grievanceId, action: 'UPDATE',
    newValue: { escalatedTo: input.escalatedTo, status: 'ESCALATED', reason: input.reason },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getGrievance(grievanceId);
}

/* ════════════════════════════════════════════════════════════════════
 * ACTIONS HISTORY
 * ════════════════════════════════════════════════════════════════════ */

export async function listGrievanceActions(grievanceId: string): Promise<GrievanceActionDTO[]> {
  const actions = await prisma.grievanceAction.findMany({
    where: { grievanceId },
    include: { actor: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return actions.map((a) => ({
    actionId: a.actionId,
    grievanceId: a.grievanceId,
    actionType: a.actionType,
    actorId: a.actorId,
    actorName: a.actor.fullName,
    notes: a.notes,
    createdAt: a.createdAt.toISOString()
  }));
}

/* ════════════════════════════════════════════════════════════════════
 * STATS
 * ════════════════════════════════════════════════════════════════════ */

export async function getStats(query: StatsQuery): Promise<GrievanceStatsDTO> {
  const where: Prisma.GrievanceWhereInput = {};
  if (query.project_id) where.projectId = query.project_id;

  const all = await prisma.grievance.findMany({
    where,
    include: { location: { select: { region: true } } }
  });

  const now = new Date();
  const overdue = all.filter(
    (g) => g.slaDue < now && !['RESOLVED', 'CLOSED'].includes(g.status)
  ).length;

  const byCategory = new Map<string, number>();
  const byLocation = new Map<string, number>();
  let totalResolutionMs = 0;
  let resolutionCount = 0;

  for (const g of all) {
    byCategory.set(g.category, (byCategory.get(g.category) ?? 0) + 1);
    const region = g.location?.region ?? 'Unknown';
    byLocation.set(region, (byLocation.get(region) ?? 0) + 1);

    if (g.resolvedAt && g.submittedAt) {
      totalResolutionMs += g.resolvedAt.getTime() - g.submittedAt.getTime();
      resolutionCount++;
    }
  }

  return {
    total: all.length,
    open: all.filter((g) => g.status === 'OPEN').length,
    inProgress: all.filter((g) => g.status === 'IN_PROGRESS').length,
    resolved: all.filter((g) => g.status === 'RESOLVED').length,
    overdue,
    avgResolutionDays: resolutionCount > 0
      ? Math.round((totalResolutionMs / resolutionCount / (24 * 3600 * 1000)) * 10) / 10
      : 0,
    byCategory: Array.from(byCategory.entries()).map(([category, count]) => ({
      category: category as any, count
    })),
    byLocation: Array.from(byLocation.entries()).map(([region, count]) => ({ region, count }))
  };
}

/* ════════════════════════════════════════════════════════════════════
 * MAPPERS
 * ════════════════════════════════════════════════════════════════════ */

function toGrievanceDTO(g: any): GrievanceDTO {
  return {
    grievanceId: g.grievanceId,
    ticketNo: g.ticketNo,
    ...(g.projectId ? { projectId: g.projectId } : {}),
    ...(g.project ? { projectCode: g.project.projectCode } : {}),
    ...(g.beneficiaryId ? { beneficiaryId: g.beneficiaryId } : {}),
    ...(g.beneficiary ? { beneficiaryName: g.beneficiary.fullName } : {}),
    category: g.category,
    ...(g.subcategory ? { subcategory: g.subcategory } : {}),
    description: g.description,
    channel: g.channel,
    submittedAt: g.submittedAt.toISOString(),
    ...(g.location ? {
      location: {
        ...(g.location.region ? { region: g.location.region } : {}),
        ...(g.location.woreda ? { woreda: g.location.woreda } : {}),
        ...(g.location.kebele ? { kebele: g.location.kebele } : {})
      }
    } : {}),
    ...(g.assignedToId ? { assignedTo: g.assignedToId } : {}),
    ...(g.assignedTo ? { assignedToName: g.assignedTo.fullName } : {}),
    ...(g.assignedAt ? { assignedAt: g.assignedAt.toISOString() } : {}),
    slaDue: g.slaDue.toISOString(),
    severity: g.severity,
    status: g.status,
    ...(g.resolution ? { resolution: g.resolution } : {}),
    ...(g.resolvedAt ? { resolvedAt: g.resolvedAt.toISOString() } : {}),
    ...(g.escalatedToId ? { escalatedTo: g.escalatedToId } : {}),
    ...(g.escalatedTo ? { escalatedToName: g.escalatedTo.fullName } : {}),
    anonymous: g.anonymous
  };
}