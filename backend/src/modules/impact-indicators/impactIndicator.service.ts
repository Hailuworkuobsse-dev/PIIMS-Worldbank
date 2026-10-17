import { Prisma, ImpactStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { ConflictError, NotFoundError, BadRequestError } from '@/lib/errors.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import type {
  CreateDomainInput, CreateImpactIndicatorInput, WaveAssignmentInput, ListIndicatorsQuery
} from './impactIndicator.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

export interface ImpactDomainDTO {
  domainId: string;
  code: string;
  name: string;
  nameAm?: string;
  description?: string;
  orderNo: number;
  active: boolean;
}

export interface ImpactIndicatorDTO {
  indicatorId: string;
  domainId: string;
  domainCode: string;
  domainName: string;
  code: string;
  name: string;
  nameAm?: string;
  unit: string;
  direction: 'INCREASE' | 'DECREASE';
  method?: string;
  disaggregation: string[];
  isComposite: boolean;
  compositeFormula?: Record<string, unknown>;
  standardRef?: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: ImpactStatus;
  waveAssignments: Array<{
    indicatorWaveId: string;
    waveId: string;
    waveCode: string;
    waveName: string;
    targetValue?: number;
    required: boolean;
  }>;
}

/* ════════════════════════════════════════════════════════════════════
 * DOMAINS
 * ════════════════════════════════════════════════════════════════════ */

export async function listDomains(): Promise<ImpactDomainDTO[]> {
  const rows = await prisma.impactDomain.findMany({
    where: { active: true },
    orderBy: { orderNo: 'asc' }
  });
  return rows.map((r) => ({
    domainId: r.domainId,
    code: r.code,
    name: r.name,
    ...(r.nameAm ? { nameAm: r.nameAm } : {}),
    ...(r.description ? { description: r.description } : {}),
    orderNo: r.orderNo,
    active: r.active
  }));
}

export async function createDomain(
  input: CreateDomainInput,
  userId: string,
  ctx: Ctx
): Promise<ImpactDomainDTO> {
  try {
    const created = await prisma.impactDomain.create({
      data: {
        code: input.code,
        name: input.name,
        ...(input.nameAm ? { nameAm: input.nameAm } : {}),
        ...(input.description ? { description: input.description } : {}),
        orderNo: input.orderNo
      }
    });
    await writeAudit({
      userId, entity: 'IMPACT_DOMAIN', entityId: created.domainId, action: 'CREATE',
      newValue: { code: created.code, name: created.name },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });
    return {
      domainId: created.domainId, code: created.code, name: created.name,
      ...(created.nameAm ? { nameAm: created.nameAm } : {}),
      ...(created.description ? { description: created.description } : {}),
      orderNo: created.orderNo, active: created.active
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Domain code '${input.code}' already exists`);
    }
    throw err;
  }
}

/* ════════════════════════════════════════════════════════════════════
 * INDICATORS
 * ════════════════════════════════════════════════════════════════════ */

const indicatorInclude = {
  domain: { select: { code: true, name: true } },
  waveAssignments: { include: { wave: { select: { code: true, name: true } } } }
} satisfies Prisma.ImpactIndicatorInclude;

type IndicatorWithRelations = Prisma.ImpactIndicatorGetPayload<{ include: typeof indicatorInclude }>;

function toIndicatorDTO(ind: IndicatorWithRelations): ImpactIndicatorDTO {
  return {
    indicatorId: ind.indicatorId,
    domainId: ind.domainId,
    domainCode: ind.domain.code,
    domainName: ind.domain.name,
    code: ind.code,
    name: ind.name,
    ...(ind.nameAm ? { nameAm: ind.nameAm } : {}),
    unit: ind.unit,
    direction: ind.direction as 'INCREASE' | 'DECREASE',
    ...(ind.method ? { method: ind.method } : {}),
    disaggregation: Array.isArray(ind.disaggregation) ? (ind.disaggregation as string[]) : [],
    isComposite: ind.isComposite,
    ...(ind.compositeFormula ? { compositeFormula: ind.compositeFormula as Record<string, unknown> } : {}),
    ...(ind.standardRef ? { standardRef: ind.standardRef } : {}),
    version: ind.version,
    effectiveFrom: ind.effectiveFrom.toISOString().slice(0, 10),
    ...(ind.effectiveTo ? { effectiveTo: ind.effectiveTo.toISOString().slice(0, 10) } : {}),
    status: ind.status,
    waveAssignments: ind.waveAssignments.map((a) => ({
      indicatorWaveId: a.indicatorWaveId,
      waveId: a.waveId,
      waveCode: a.wave.code,
      waveName: a.wave.name,
      ...(a.targetValue != null ? { targetValue: Number(a.targetValue) } : {}),
      required: a.required
    }))
  };
}

export async function listIndicators(query: ListIndicatorsQuery): Promise<ImpactIndicatorDTO[]> {
  const filters: Prisma.ImpactIndicatorWhereInput[] = [];
  if (query.domain_id) filters.push({ domainId: query.domain_id });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.q) {
    filters.push({
      OR: [{ name: { contains: query.q } }, { code: { contains: query.q } }]
    });
  }

  const rows = await prisma.impactIndicator.findMany({
    where: filters.length ? { AND: filters } : {},
    include: indicatorInclude,
    orderBy: [{ code: 'asc' }]
  });
  return rows.map(toIndicatorDTO);
}

export async function getIndicator(indicatorId: string): Promise<ImpactIndicatorDTO> {
  const ind = await prisma.impactIndicator.findUnique({
    where: { indicatorId }, include: indicatorInclude
  });
  if (!ind) throw new NotFoundError('ImpactIndicator', indicatorId);
  return toIndicatorDTO(ind);
}

export async function createIndicator(
  input: CreateImpactIndicatorInput,
  userId: string,
  ctx: Ctx
): Promise<ImpactIndicatorDTO> {
  const domain = await prisma.impactDomain.findUnique({ where: { domainId: input.domainId } });
  if (!domain) throw new NotFoundError('ImpactDomain', input.domainId);

  // If composite, verify all component indicators exist
  if (input.isComposite && input.compositeFormula) {
    for (const comp of input.compositeFormula.components) {
      const exists = await prisma.impactIndicator.findUnique({ where: { indicatorId: comp.indicatorId } });
      if (!exists) throw new NotFoundError('Component indicator', comp.indicatorId);
    }
  }

  try {
    const created = await prisma.impactIndicator.create({
      data: {
        domainId: input.domainId,
        code: input.code,
        name: input.name,
        ...(input.nameAm ? { nameAm: input.nameAm } : {}),
        ...(input.description ? { description: input.description } : {}),
        unit: input.unit,
        direction: input.direction,
        ...(input.method ? { method: input.method } : {}),
        disaggregation: input.disaggregation,
        isComposite: input.isComposite,
        ...(input.compositeFormula ? { compositeFormula: input.compositeFormula as unknown as Prisma.InputJsonValue } : {}),
        ...(input.standardRef ? { standardRef: input.standardRef } : {}),
        effectiveFrom: new Date(input.effectiveFrom),
        status: ImpactStatus.ACTIVE,
        createdById: userId
      },
      include: indicatorInclude
    });

    await writeAudit({
      userId, entity: 'IMPACT_INDICATOR', entityId: created.indicatorId, action: 'CREATE',
      newValue: { code: created.code, name: created.name, domainId: input.domainId },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return toIndicatorDTO(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Indicator code '${input.code}' already exists`);
    }
    throw err;
  }
}

export async function assignToWave(
  indicatorId: string,
  input: WaveAssignmentInput,
  userId: string,
  ctx: Ctx
): Promise<ImpactIndicatorDTO> {
  const [indicator, wave] = await Promise.all([
    prisma.impactIndicator.findUnique({ where: { indicatorId } }),
    prisma.wave.findUnique({ where: { waveId: input.waveId } })
  ]);
  if (!indicator) throw new NotFoundError('ImpactIndicator', indicatorId);
  if (!wave) throw new NotFoundError('Wave', input.waveId);

  const existing = await prisma.indicatorWave.findUnique({
    where: { indicatorId_waveId: { indicatorId, waveId: input.waveId } }
  });
  if (existing) {
    throw new ConflictError('Indicator is already assigned to this wave');
  }

  await prisma.indicatorWave.create({
    data: {
      indicatorId,
      waveId: input.waveId,
      ...(input.targetValue !== undefined ? { targetValue: new Prisma.Decimal(input.targetValue) } : {}),
      ...(input.collectionWindowStart ? { collectionWindowStart: new Date(input.collectionWindowStart) } : {}),
      ...(input.collectionWindowEnd ? { collectionWindowEnd: new Date(input.collectionWindowEnd) } : {}),
      required: input.required
    }
  });

  await writeAudit({
    userId, entity: 'INDICATOR_WAVE', entityId: indicatorId, action: 'CREATE',
    newValue: { indicatorId, waveId: input.waveId, targetValue: input.targetValue },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getIndicator(indicatorId);
}

export async function updateIndicatorStatus(
  indicatorId: string,
  status: 'ACTIVE' | 'DEPRECATED',
  userId: string,
  ctx: Ctx
): Promise<ImpactIndicatorDTO> {
  const existing = await prisma.impactIndicator.findUnique({ where: { indicatorId } });
  if (!existing) throw new NotFoundError('ImpactIndicator', indicatorId);

  await prisma.impactIndicator.update({
    where: { indicatorId },
    data: { status: status as ImpactStatus }
  });

  await writeAudit({
    userId, entity: 'IMPACT_INDICATOR', entityId: indicatorId, action: 'UPDATE',
    oldValue: { status: existing.status }, newValue: { status },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getIndicator(indicatorId);
}

/* ════════════════════════════════════════════════════════════════════
 * WAVES (helper — must exist before indicator assignment)
 * ════════════════════════════════════════════════════════════════════ */

export async function createWave(
  projectId: string,
  input: { code: string; name: string; waveType: string; plannedStart?: string; plannedEnd?: string },
  scope: ScopeClaim, orgId: string, userId: string, ctx: Ctx
): Promise<{ waveId: string; code: string; name: string; waveType: string }> {
  const project = await prisma.project.findFirst({ where: { projectId, deletedAt: null } });
  if (!project) throw new NotFoundError('Project', projectId);
  if (scope.orgLevel !== 'FEDERAL' && project.ownerOrgId !== orgId) {
    throw new BadRequestError('Access denied to this project');
  }

  try {
    const wave = await prisma.wave.create({
      data: {
        projectId,
        code: input.code,
        name: input.name,
        waveType: input.waveType as any,
        ...(input.plannedStart ? { plannedStart: new Date(input.plannedStart) } : {}),
        ...(input.plannedEnd ? { plannedEnd: new Date(input.plannedEnd) } : {}),
        status: 'PLANNED'
      }
    });
    await writeAudit({
      userId, entity: 'WAVE', entityId: wave.waveId, action: 'CREATE',
      newValue: { code: wave.code, projectId },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });
    return { waveId: wave.waveId, code: wave.code, name: wave.name, waveType: wave.waveType };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Wave code '${input.code}' already exists in this project`);
    }
    throw err;
  }
}

export async function listWaves(projectId: string): Promise<Array<{ waveId: string; code: string; name: string; waveType: string; status: string; plannedStart?: string; plannedEnd?: string }>> {
  const waves = await prisma.wave.findMany({
    where: { projectId },
    orderBy: { code: 'asc' }
  });
  return waves.map((w) => ({
    waveId: w.waveId,
    code: w.code,
    name: w.name,
    waveType: w.waveType,
    status: w.status,
    ...(w.plannedStart ? { plannedStart: w.plannedStart.toISOString().slice(0, 10) } : {}),
    ...(w.plannedEnd ? { plannedEnd: w.plannedEnd.toISOString().slice(0, 10) } : {})
  }));
}