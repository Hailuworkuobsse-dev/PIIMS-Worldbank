import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { canAccessProject } from '@/lib/scope.js';
import { getQueue, QUEUE_NAMES } from '@/config/queue.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import { buildExecution, toEtb } from './financial.utils.js';
import type {
  BudgetDTO, DisbursementDTO, FinancialExecutionDTO,
  FmisSyncRunDTO, CostPerOutputRowDTO, FinancialExceptionDTO
} from './financial.types.js';
import type {
  CreateBudgetInput, ListBudgetsQuery,
  CreateDisbursementInput, ListDisbursementsQuery,
  ExecutionQuery, FmisSyncInput, CostPerOutputQuery, ExceptionsQuery
} from './financial.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

async function assertProjectAccess(
  projectId: string, scope: ScopeClaim, orgId: string, userId: string
): Promise<{ projectCode: string }> {
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
  return { projectCode: project.projectCode };
}

/* ════════════════════════════════════════════════════════════════════
 * BUDGETS
 * ════════════════════════════════════════════════════════════════════ */

export async function listBudgets(
  query: ListBudgetsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<BudgetDTO[]> {
  await assertProjectAccess(query.project_id, scope, orgId, userId);

  const filters: Prisma.BudgetWhereInput[] = [{ projectId: query.project_id }];
  if (query.fiscal_year) filters.push({ fiscalYear: query.fiscal_year });
  if (query.component_id) filters.push({ componentId: query.component_id });

  const rows = await prisma.budget.findMany({
    where: { AND: filters },
    orderBy: [{ fiscalYear: 'desc' }, { componentId: 'asc' }]
  });
  return rows.map(toBudgetDTO);
}

export async function createBudget(
  input: CreateBudgetInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<BudgetDTO> {
  await assertProjectAccess(input.projectId, scope, orgId, userId);

  if (input.componentId) {
    const comp = await prisma.component.findUnique({ where: { componentId: input.componentId } });
    if (!comp) throw new NotFoundError('Component', input.componentId);
  }

  const appropriation = new Prisma.Decimal(input.appropriation);

  try {
    const created = await prisma.budget.create({
      data: {
        projectId: input.projectId,
        ...(input.componentId ? { componentId: input.componentId } : {}),
        fiscalYear: input.fiscalYear,
        currency: input.currency,
        appropriation,
        released: new Prisma.Decimal(0),
        expended: new Prisma.Decimal(0),
        committed: new Prisma.Decimal(0),
        balance: appropriation
      }
    });

    await writeAudit({
      userId, entity: 'BUDGET', entityId: created.budgetId, action: 'CREATE',
      newValue: {
        projectId: input.projectId, fiscalYear: input.fiscalYear,
        appropriation: input.appropriation, currency: input.currency
      },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return toBudgetDTO(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(
        `A budget for FY${input.fiscalYear}${input.componentId ? ' on this component' : ''} already exists`
      );
    }
    throw err;
  }
}

/* ════════════════════════════════════════════════════════════════════
 * DISBURSEMENTS
 * ════════════════════════════════════════════════════════════════════ */

const disbursementInclude = {
  project: { select: { projectCode: true } },
  sourceOrg: { select: { name: true } }
} satisfies Prisma.DisbursementInclude;

type DisbursementWithRelations = Prisma.DisbursementGetPayload<{ include: typeof disbursementInclude }>;

export async function listDisbursements(
  query: ListDisbursementsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<{
  data: DisbursementDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const filters: Prisma.DisbursementWhereInput[] = [];

  if (query.project_id) {
    await assertProjectAccess(query.project_id, scope, orgId, userId);
    filters.push({ projectId: query.project_id });
  }
  if (query.source_org_id) filters.push({ sourceOrgId: query.source_org_id });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.from) filters.push({ valueDate: { gte: new Date(query.from) } });
  if (query.to) filters.push({ valueDate: { lte: new Date(query.to) } });
  if (query.q) filters.push({ referenceNo: { contains: query.q } });

  if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      project: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] }
    });
  }

  const where: Prisma.DisbursementWhereInput = filters.length ? { AND: filters } : {};
  const limit = Math.min(200, Number(query.limit) || 25);

  const [rows, totalCount] = await Promise.all([
    prisma.disbursement.findMany({
      where,
      include: disbursementInclude,
      orderBy: { valueDate: 'desc' },
      take: limit
    }),
    prisma.disbursement.count({ where })
  ]);

  return {
    data: rows.map(toDisbursementDTO),
    pagination: { limit, totalCount, hasMore: totalCount > rows.length }
  };
}

export async function createDisbursement(
  input: CreateDisbursementInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<DisbursementDTO> {
  await assertProjectAccess(input.projectId, scope, orgId, userId);

  const source = await prisma.organization.findUnique({ where: { orgId: input.sourceOrgId } });
  if (!source) throw new NotFoundError('Source organization', input.sourceOrgId);

  const amount = new Prisma.Decimal(input.amount);
  const amountEtb = new Prisma.Decimal(toEtb(input.amount, input.currency));

  try {
    const created = await prisma.disbursement.create({
      data: {
        projectId: input.projectId,
        sourceOrgId: input.sourceOrgId,
        category: input.category,
        amount,
        currency: input.currency,
        amountEtb,
        valueDate: new Date(input.valueDate),
        ...(input.referenceNo ? { referenceNo: input.referenceNo } : {}),
        status: input.status
      },
      include: disbursementInclude
    });

    // Update linked budget's released amount
    const budgets = await prisma.budget.findMany({
      where: { projectId: input.projectId, currency: input.currency }
    });
    for (const b of budgets) {
      const newReleased = new Prisma.Decimal(b.released).plus(amount);
      const newBalance = new Prisma.Decimal(b.appropriation).minus(new Prisma.Decimal(b.expended));
      await prisma.budget.update({
        where: { budgetId: b.budgetId },
        data: { released: newReleased, balance: newBalance }
      });
    }

    await writeAudit({
      userId, entity: 'DISBURSEMENT', entityId: created.disbursementId, action: 'CREATE',
      newValue: {
        projectId: input.projectId, amount: input.amount, currency: input.currency,
        category: input.category, referenceNo: input.referenceNo
      },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return toDisbursementDTO(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`A disbursement with reference '${input.referenceNo}' already exists`);
    }
    throw err;
  }
}

/* ════════════════════════════════════════════════════════════════════
 * EXECUTION SUMMARY
 * ════════════════════════════════════════════════════════════════════ */

export async function getExecution(
  query: ExecutionQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<FinancialExecutionDTO> {
  await assertProjectAccess(query.project_id, scope, orgId, userId);

  const filters: Prisma.BudgetWhereInput[] = [{ projectId: query.project_id }];
  if (query.fiscal_year) filters.push({ fiscalYear: query.fiscal_year });

  const [budgets, components] = await Promise.all([
    prisma.budget.findMany({ where: { AND: filters } }),
    prisma.component.findMany({
      where: { projectId: query.project_id },
      select: { componentId: true, name: true }
    })
  ]);

  return buildExecution(budgets, components);
}

/* ════════════════════════════════════════════════════════════════════
 * FMIS SYNC (stub — replace with real MoF IFMIS HTTP call in production)
 * ════════════════════════════════════════════════════════════════════ */

export async function triggerFmisSync(
  input: FmisSyncInput,
  userId: string,
  ctx: Ctx
): Promise<{ jobId: string; statusUrl: string }> {
  const job = await prisma.syncJob.create({
    data: {
      integrationCode: 'FMIS',
      direction: 'INBOUND',
      kind: input.kind,
      status: 'RUNNING',
      triggeredById: userId
    }
  });

  // In production, this would enqueue a real sync job:
  //   const queue = getQueue(QUEUE_NAMES.SYNC);
  //   await queue.add('fmis-sync', { jobId: job.jobId, kind: input.kind });
  //
  // For the MVP, simulate a successful sync in the background.
  setImmediate(async () => {
    try {
      const started = Date.now();
      // ── Simulated sync — replace with actual FMIS adapter call ──
      const recordsProcessed = Math.floor(100 + Math.random() * 900);
      await new Promise((r) => setTimeout(r, 1500));

      await prisma.syncJob.update({
        where: { jobId: job.jobId },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          durationMs: Date.now() - started,
          recordsProcessed,
          recordsFailed: 0
        }
      });
    } catch (err) {
      await prisma.syncJob.update({
        where: { jobId: job.jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorSummary: (err as Error).message.slice(0, 500)
        }
      });
    }
  });

  await writeAudit({
    userId, entity: 'SYNC_JOB', entityId: job.jobId, action: 'CREATE',
    newValue: { integration: 'FMIS', kind: input.kind },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return {
    jobId: job.jobId,
    statusUrl: `/v1/admin/integrations/FMIS/runs`
  };
}

export async function listFmisRuns(): Promise<FmisSyncRunDTO[]> {
  const rows = await prisma.syncJob.findMany({
    where: { integrationCode: 'FMIS' },
    orderBy: { startedAt: 'desc' },
    take: 50
  });

  return rows.map((r) => ({
    runId: r.jobId,
    kind: (r.kind as 'APPROPRIATION' | 'RELEASE' | 'EXPENDITURE'),
    startedAt: r.startedAt.toISOString(),
    ...(r.completedAt ? { completedAt: r.completedAt.toISOString() } : {}),
    ...(r.durationMs ? { durationMs: r.durationMs } : {}),
    recordsProcessed: r.recordsProcessed,
    recordsFailed: r.recordsFailed,
    status: r.status as 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED',
    ...(r.errorSummary ? { errorSummary: r.errorSummary } : {})
  }));
}

/* ════════════════════════════════════════════════════════════════════
 * COST PER OUTPUT
 * ════════════════════════════════════════════════════════════════════ */

export async function getCostPerOutput(
  query: CostPerOutputQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<CostPerOutputRowDTO[]> {
  await assertProjectAccess(query.project_id, scope, orgId, userId);

  const indicators = await prisma.indicator.findMany({
    where: { projectId: query.project_id },
    include: { subcomponent: { select: { componentId: true } } }
  });

  const budgets = await prisma.budget.findMany({
    where: { projectId: query.project_id }
  });

  const totalExpended = budgets.reduce((s, b) => s + toEtb(Number(b.expended), b.currency), 0);

  return indicators
    .filter((ind) => ind.actual != null && Number(ind.actual) > 0)
    .map((ind) => {
      const componentBudget = budgets.find(
        (b) => b.componentId === ind.subcomponent.componentId
      );
      const expended = componentBudget
        ? toEtb(Number(componentBudget.expended), componentBudget.currency)
        : totalExpended;
      const actual = Number(ind.actual);
      const costPerUnit = actual > 0 ? expended / actual : 0;

      return {
        indicatorId: ind.indicatorId,
        indicatorCode: ind.code,
        indicatorName: ind.name,
        unit: ind.unit,
        actualValue: actual,
        expendedEtb: expended.toFixed(2),
        costPerUnitEtb: costPerUnit.toFixed(2)
      };
    });
}

/* ════════════════════════════════════════════════════════════════════
 * EXCEPTIONS
 * ════════════════════════════════════════════════════════════════════ */

export async function getExceptions(
  query: ExceptionsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<FinancialExceptionDTO[]> {
  const projectFilter: Prisma.ProjectWhereInput = { deletedAt: null };
  if (query.project_id) {
    await assertProjectAccess(query.project_id, scope, orgId, userId);
    projectFilter.projectId = query.project_id;
  } else if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    projectFilter.OR = [{ ownerOrgId: orgId }, { createdById: userId }];
  }

  const budgets = await prisma.budget.findMany({
    where: { project: projectFilter },
    include: { project: { select: { projectId: true, projectCode: true } } }
  });

  const exceptions: FinancialExceptionDTO[] = [];
  const now = Date.now();

  for (const b of budgets) {
    const appropriation = Number(b.appropriation);
    const released = Number(b.released);
    const expended = Number(b.expended);

    // OVER_BUDGET
    if (expended > appropriation && appropriation > 0) {
      exceptions.push({
        id: `over-budget-${b.budgetId}`,
        severity: expended > appropriation * 1.1 ? 'CRITICAL' : 'HIGH',
        kind: 'OVER_BUDGET',
        projectId: b.project.projectId,
        projectCode: b.project.projectCode,
        message: `Expended ${expended.toFixed(2)} exceeds appropriation ${appropriation.toFixed(2)} (${b.currency})`,
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // DELAYED_RELEASE — more than 6 months into the FY with less than 50% released
    const fiscalYearStart = new Date(`${b.fiscalYear}-01-01`).getTime();
    const fyElapsed = (now - fiscalYearStart) / (365 * 24 * 3600 * 1000);
    if (fyElapsed > 0.5 && appropriation > 0 && released / appropriation < 0.5) {
      exceptions.push({
        id: `delayed-release-${b.budgetId}`,
        severity: 'MEDIUM',
        kind: 'DELAYED_RELEASE',
        projectId: b.project.projectId,
        projectCode: b.project.projectCode,
        message: `Only ${((released / appropriation) * 100).toFixed(0)}% released for FY${b.fiscalYear} (${b.currency})`,
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // LOW_BURN — released but very little expended
    if (released > 0 && expended / released < 0.3 && fyElapsed > 0.5) {
      exceptions.push({
        id: `low-burn-${b.budgetId}`,
        severity: 'MEDIUM',
        kind: 'LOW_BURN',
        projectId: b.project.projectId,
        projectCode: b.project.projectCode,
        message: `Only ${((expended / released) * 100).toFixed(0)}% of released funds expended (${b.currency})`,
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // HIGH_BURN — expended almost fully but time remains
    if (released > 0 && expended / released > 0.95 && fyElapsed < 0.7) {
      exceptions.push({
        id: `high-burn-${b.budgetId}`,
        severity: 'LOW',
        kind: 'HIGH_BURN',
        projectId: b.project.projectId,
        projectCode: b.project.projectCode,
        message: `${((expended / released) * 100).toFixed(0)}% of released funds expended early (${b.currency})`,
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }
  }

  // UNRECONCILED — disbursements in DISBURSED status (not RECONCILED) for > 30 days
  const disbursementWhere: Prisma.DisbursementWhereInput = {
    status: 'DISBURSED',
    valueDate: { lt: new Date(Date.now() - 30 * 24 * 3600 * 1000) }
  };
  if (query.project_id) disbursementWhere.projectId = query.project_id;

  const unreconciled = await prisma.disbursement.findMany({
    where: disbursementWhere,
    include: { project: { select: { projectId: true, projectCode: true } } }
  });

  for (const d of unreconciled) {
    exceptions.push({
      id: `unreconciled-${d.disbursementId}`,
      severity: 'HIGH',
      kind: 'UNRECONCILED',
      projectId: d.project.projectId,
      projectCode: d.project.projectCode,
      message: `Disbursement of ${d.amount} ${d.currency} unreconciled for > 30 days`,
      detectedAt: new Date().toISOString(),
      resolved: false
    });
  }

  return exceptions;
}

/* ════════════════════════════════════════════════════════════════════
 * MAPPERS
 * ════════════════════════════════════════════════════════════════════ */

function toBudgetDTO(b: {
  budgetId: string; projectId: string; componentId: string | null;
  fiscalYear: number; currency: string;
  appropriation: unknown; released: unknown; expended: unknown;
  committed: unknown; balance: unknown;
  fmisReference: string | null; lastSyncAt: Date | null;
  createdAt: Date; updatedAt: Date;
}): BudgetDTO {
  return {
    budgetId: b.budgetId,
    projectId: b.projectId,
    ...(b.componentId ? { componentId: b.componentId } : {}),
    fiscalYear: b.fiscalYear,
    currency: b.currency,
    appropriation: Number(b.appropriation).toFixed(2),
    released: Number(b.released).toFixed(2),
    expended: Number(b.expended).toFixed(2),
    committed: Number(b.committed).toFixed(2),
    balance: Number(b.balance).toFixed(2),
    ...(b.fmisReference ? { fmisReference: b.fmisReference } : {}),
    ...(b.lastSyncAt ? { lastSyncAt: b.lastSyncAt.toISOString() } : {}),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString()
  };
}

function toDisbursementDTO(d: DisbursementWithRelations): DisbursementDTO {
  return {
    disbursementId: d.disbursementId,
    projectId: d.projectId,
    projectCode: d.project.projectCode,
    sourceOrgId: d.sourceOrgId,
    sourceOrgName: d.sourceOrg.name,
    category: d.category,
    amount: Number(d.amount).toFixed(2),
    currency: d.currency,
    amountEtb: Number(d.amountEtb).toFixed(2),
    valueDate: d.valueDate.toISOString().slice(0, 10),
    ...(d.referenceNo ? { referenceNo: d.referenceNo } : {}),
    status: d.status,
    ...(d.fmisReference ? { fmisReference: d.fmisReference } : {}),
    createdAt: d.createdAt.toISOString()
  };
}