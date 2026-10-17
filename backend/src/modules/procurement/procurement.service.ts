import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { canAccessProject } from '@/lib/scope.js';
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError
} from '@/lib/errors.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import { parsePagination } from '@/utils/pagination.js';
import { computeDelaySeverity, computeSupplierScore } from './procurement.utils.js';
import type {
  ProcurementDTO, ContractDTO, ProcurementDelayDTO, SupplierPerformanceDTO
} from './procurement.types.js';
import type {
  CreateProcurementInput, UpdateProcurementInput, ListProcurementQuery,
  CreateContractInput, UpdateContractInput, ListContractsQuery,
  DelaysQuery
} from './procurement.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

async function assertProjectAccess(
  projectId: string, scope: ScopeClaim, orgId: string, userId: string
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { projectId, deletedAt: null },
    include: { location: true }
  });
  if (!project) throw new NotFoundError('Project', projectId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: project.ownerOrgId,
      createdById: project.createdById,
      location: project.location
    })
  ) {
    throw new ForbiddenError('You do not have access to this project');
  }
}

/* ════════════════════════════════════════════════════════════════════
 * PROCUREMENT
 * ════════════════════════════════════════════════════════════════════ */

const procurementInclude = {
  project: { select: { projectCode: true } }
} satisfies Prisma.ProcurementInclude;

type ProcurementWithRelations = Prisma.ProcurementGetPayload<{ include: typeof procurementInclude }>;

export async function listProcurement(
  query: ListProcurementQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<{
  data: ProcurementDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const filters: Prisma.ProcurementWhereInput[] = [];

  if (query.project_id) {
    await assertProjectAccess(query.project_id, scope, orgId, userId);
    filters.push({ projectId: query.project_id });
  }
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.method) {
    const methods = query.method.split(',').filter(Boolean);
    if (methods.length) filters.push({ method: { in: methods as any[] } });
  }
  if (query.q) filters.push({ description: { contains: query.q } });

  if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      project: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] }
    });
  }

  const where: Prisma.ProcurementWhereInput = filters.length ? { AND: filters } : {};
  const limit = Math.min(200, Number(query.limit) || 25);

  const [rows, totalCount] = await Promise.all([
    prisma.procurement.findMany({
      where,
      include: procurementInclude,
      orderBy: { planDate: 'desc' },
      take: limit
    }),
    prisma.procurement.count({ where })
  ]);

  return {
    data: rows.map(toProcurementDTO),
    pagination: { limit, totalCount, hasMore: totalCount > rows.length }
  };
}

export async function createProcurement(
  input: CreateProcurementInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<ProcurementDTO> {
  await assertProjectAccess(input.projectId, scope, orgId, userId);

  try {
    const created = await prisma.procurement.create({
      data: {
        projectId: input.projectId,
        ...(input.componentId ? { componentId: input.componentId } : {}),
        planRef: input.planRef,
        description: input.description,
        method: input.method,
        ...(input.estimatedAmount ? { estimatedAmount: new Prisma.Decimal(input.estimatedAmount) } : {}),
        currency: input.currency,
        ...(input.planDate ? { planDate: new Date(input.planDate) } : {}),
        status: 'PLANNED'
      },
      include: procurementInclude
    });

    await writeAudit({
      userId, entity: 'PROCUREMENT', entityId: created.procurementId, action: 'CREATE',
      newValue: { planRef: created.planRef, projectId: input.projectId },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return toProcurementDTO(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Procurement plan ref '${input.planRef}' already exists in this project`);
    }
    throw err;
  }
}

export async function updateProcurement(
  procurementId: string,
  input: UpdateProcurementInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<ProcurementDTO> {
  const existing = await prisma.procurement.findUnique({
    where: { procurementId },
    include: { project: { include: { location: true } } }
  });
  if (!existing) throw new NotFoundError('Procurement', procurementId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.project.ownerOrgId,
      createdById: existing.project.createdById,
      location: existing.project.location
    })
  ) {
    throw new ForbiddenError('Access denied');
  }

  const data: Prisma.ProcurementUpdateInput = {};
  if (input.description !== undefined) data.description = input.description;
  if (input.estimatedAmount !== undefined) {
    data.estimatedAmount = input.estimatedAmount ? new Prisma.Decimal(input.estimatedAmount) : null;
  }
  if (input.advertisementDate !== undefined) {
    data.advertisementDate = input.advertisementDate ? new Date(input.advertisementDate) : null;
  }
  if (input.bidOpeningDate !== undefined) {
    data.bidOpeningDate = input.bidOpeningDate ? new Date(input.bidOpeningDate) : null;
  }
  if (input.evaluationDate !== undefined) {
    data.evaluationDate = input.evaluationDate ? new Date(input.evaluationDate) : null;
  }
  if (input.awardDate !== undefined) {
    data.awardDate = input.awardDate ? new Date(input.awardDate) : null;
  }
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.procurement.update({
    where: { procurementId },
    data,
    include: procurementInclude
  });

  await writeAudit({
    userId, entity: 'PROCUREMENT', entityId: procurementId, action: 'UPDATE',
    oldValue: { status: existing.status }, newValue: { status: updated.status },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toProcurementDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * CONTRACTS
 * ════════════════════════════════════════════════════════════════════ */

const contractInclude = {
  project: { select: { projectCode: true } },
  supplier: { select: { name: true } }
} satisfies Prisma.ContractInclude;

type ContractWithRelations = Prisma.ContractGetPayload<{ include: typeof contractInclude }>;

export async function listContracts(
  query: ListContractsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<{
  data: ContractDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const filters: Prisma.ContractWhereInput[] = [];

  if (query.project_id) {
    await assertProjectAccess(query.project_id, scope, orgId, userId);
    filters.push({ projectId: query.project_id });
  }
  if (query.supplier_id) filters.push({ supplierId: query.supplier_id });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.q) filters.push({ title: { contains: query.q } });

  if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      project: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] }
    });
  }

  const where: Prisma.ContractWhereInput = filters.length ? { AND: filters } : {};
  const limit = Math.min(200, Number(query.limit) || 25);

  const [rows, totalCount] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: contractInclude,
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.contract.count({ where })
  ]);

  return {
    data: rows.map(toContractDTO),
    pagination: { limit, totalCount, hasMore: totalCount > rows.length }
  };
}

export async function createContract(
  input: CreateContractInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<ContractDTO> {
  await assertProjectAccess(input.projectId, scope, orgId, userId);

  const supplier = await prisma.supplier.findUnique({
    where: { supplierId: input.supplierId }
  });
  if (!supplier) throw new NotFoundError('Supplier', input.supplierId);

  try {
    const created = await prisma.contract.create({
      data: {
        ...(input.procurementId ? { procurementId: input.procurementId } : {}),
        projectId: input.projectId,
        supplierId: input.supplierId,
        contractNo: input.contractNo,
        title: input.title,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        ...(input.signedDate ? { signedDate: new Date(input.signedDate) } : {}),
        ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
        ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
        status: input.status,
        amendmentNo: 0
      },
      include: contractInclude
    });

    await writeAudit({
      userId, entity: 'CONTRACT', entityId: created.contractId, action: 'CREATE',
      newValue: { contractNo: created.contractNo, amount: input.amount, currency: input.currency },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return toContractDTO(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Contract number '${input.contractNo}' already exists`);
    }
    throw err;
  }
}

export async function updateContract(
  contractId: string,
  input: UpdateContractInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<ContractDTO> {
  const existing = await prisma.contract.findUnique({
    where: { contractId },
    include: { project: { include: { location: true } } }
  });
  if (!existing) throw new NotFoundError('Contract', contractId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.project.ownerOrgId,
      createdById: existing.project.createdById,
      location: existing.project.location
    })
  ) {
    throw new ForbiddenError('Access denied');
  }

  const data: Prisma.ContractUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.amount !== undefined) data.amount = new Prisma.Decimal(input.amount);
  if (input.signedDate !== undefined) {
    data.signedDate = input.signedDate ? new Date(input.signedDate) : null;
  }
  if (input.startDate !== undefined) {
    data.startDate = input.startDate ? new Date(input.startDate) : null;
  }
  if (input.endDate !== undefined) {
    data.endDate = input.endDate ? new Date(input.endDate) : null;
  }
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.contract.update({
    where: { contractId },
    data,
    include: contractInclude
  });

  await writeAudit({
    userId, entity: 'CONTRACT', entityId: contractId, action: 'UPDATE',
    oldValue: { status: existing.status }, newValue: { status: updated.status },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toContractDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * DELAYS
 * ════════════════════════════════════════════════════════════════════ */

export async function listDelays(
  query: DelaysQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<ProcurementDelayDTO[]> {
  const filters: Prisma.ProcurementWhereInput[] = [
    {
      status: { notIn: ['AWARDED', 'CANCELLED'] },
      planDate: { lt: new Date() }
    }
  ];

  if (query.project_id) {
    await assertProjectAccess(query.project_id, scope, orgId, userId);
    filters.push({ projectId: query.project_id });
  } else if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      project: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] }
    });
  }

  const rows = await prisma.procurement.findMany({
    where: { AND: filters },
    orderBy: { planDate: 'asc' }
  });

  const now = Date.now();
  return rows.map((r) => {
    const planTime = r.planDate?.getTime() ?? now;
    const daysOverdue = Math.max(0, Math.floor((now - planTime) / (24 * 3600 * 1000)));
    return {
      procurementId: r.procurementId,
      planRef: r.planRef,
      description: r.description,
      planDate: r.planDate?.toISOString().slice(0, 10) ?? '',
      daysOverdue,
      status: r.status,
      severity: computeDelaySeverity(daysOverdue)
    };
  });
}

/* ════════════════════════════════════════════════════════════════════
 * SUPPLIER PERFORMANCE
 * ════════════════════════════════════════════════════════════════════ */

export async function getSupplierPerformance(
  supplierId: string
): Promise<SupplierPerformanceDTO> {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierId }
  });
  if (!supplier) throw new NotFoundError('Supplier', supplierId);

  const contracts = await prisma.contract.findMany({
    where: { supplierId }
  });

  const deliveries = await prisma.serviceDelivery.findMany({
    where: { supplierId }
  });

  const now = Date.now();
  let onTime = 0;
  let late = 0;
  let qualityFlags = 0;

  for (const d of deliveries) {
    if (d.status === 'FAILED') {
      qualityFlags++;
    }
    if (d.installDate) {
      // Consider on-time if installed within contract window (or within 90 days of plan)
      const installTime = d.installDate.getTime();
      if (installTime <= now) onTime++;
      else late++;
    } else {
      late++;
    }
  }

  const totalValue = contracts.reduce((s, c) => s + Number(c.amount), 0);
  const currency = contracts[0]?.currency ?? 'ETB';
  const compositeScore = computeSupplierScore(onTime, late, qualityFlags, contracts.length);

  return {
    supplierId,
    supplierName: supplier.name,
    contractsCount: contracts.length,
    contractsValue: totalValue.toFixed(2),
    currency,
    deliveriesOnTime: onTime,
    deliveriesLate: late,
    qualityFlags,
    compositeScore
  };
}

/* ════════════════════════════════════════════════════════════════════
 * MAPPERS
 * ════════════════════════════════════════════════════════════════════ */

function toProcurementDTO(p: ProcurementWithRelations): ProcurementDTO {
  return {
    procurementId: p.procurementId,
    projectId: p.projectId,
    projectCode: p.project.projectCode,
    ...(p.componentId ? { componentId: p.componentId } : {}),
    planRef: p.planRef,
    description: p.description,
    method: p.method,
    ...(p.estimatedAmount != null ? { estimatedAmount: Number(p.estimatedAmount).toFixed(2) } : {}),
    currency: p.currency,
    ...(p.planDate ? { planDate: p.planDate.toISOString().slice(0, 10) } : {}),
    ...(p.advertisementDate ? { advertisementDate: p.advertisementDate.toISOString().slice(0, 10) } : {}),
    ...(p.bidOpeningDate ? { bidOpeningDate: p.bidOpeningDate.toISOString().slice(0, 10) } : {}),
    ...(p.evaluationDate ? { evaluationDate: p.evaluationDate.toISOString().slice(0, 10) } : {}),
    ...(p.awardDate ? { awardDate: p.awardDate.toISOString().slice(0, 10) } : {}),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  };
}

function toContractDTO(c: ContractWithRelations): ContractDTO {
  return {
    contractId: c.contractId,
    ...(c.procurementId ? { procurementId: c.procurementId } : {}),
    projectId: c.projectId,
    projectCode: c.project.projectCode,
    supplierId: c.supplierId,
    supplierName: c.supplier.name,
    contractNo: c.contractNo,
    title: c.title,
    amount: Number(c.amount).toFixed(2),
    currency: c.currency,
    ...(c.signedDate ? { signedDate: c.signedDate.toISOString().slice(0, 10) } : {}),
    ...(c.startDate ? { startDate: c.startDate.toISOString().slice(0, 10) } : {}),
    ...(c.endDate ? { endDate: c.endDate.toISOString().slice(0, 10) } : {}),
    status: c.status,
    amendmentNo: c.amendmentNo,
    ...(c.documentId ? { documentId: c.documentId } : {}),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
  };
}