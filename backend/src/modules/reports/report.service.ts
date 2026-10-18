import { Prisma, ReportType } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { storage } from '@/config/storage.js';
import { getQueue, QUEUE_NAMES } from '@/config/queue.js';
import { buildReportKey } from '@/lib/file-naming.js';
import { writeAudit } from '@/lib/audit.js';
import { parsePagination, decodeCursor, buildPaginationMeta } from '@/utils/pagination.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors.js';
import { logger } from '@/config/logger.js';
import { renderPdf } from './renderers/pdf.renderer.js';
import { renderExcel } from './renderers/excel.renderer.js';
import { renderCsv } from './renderers/csv.renderer.js';
import { renderWbXml, type WbProjectRow } from './renderers/wb-exporter.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import type {
  ReportDefinitionDTO, ReportInstanceDTO, ReportScheduleDTO, WbExportDTO
} from './report.types.js';
import type {
  GenerateReportInput, ScheduleReportInput, ListInstancesQuery
} from './report.schemas.js';

/* ════════════════════════════════════════════════════════════════════
 * CATALOGUE
 * ════════════════════════════════════════════════════════════════════ */

const CATALOGUE: ReportDefinitionDTO[] = [
  {
    code: 'PPMR', name: 'Project Performance Monitoring Report',
    description: 'Quarterly progress against indicators and financial execution.',
    frequency: 'QUARTERLY',
    requiredParams: ['projectId', 'period'],
    formats: ['PDF', 'EXCEL']
  },
  {
    code: 'ISR', name: 'Implementation Status Report',
    description: 'World Bank–format implementation status and results.',
    frequency: 'SEMI_ANNUAL',
    requiredParams: ['period'],
    formats: ['PDF', 'EXCEL']
  },
  {
    code: 'FINANCIAL', name: 'Financial Progress Report',
    description: 'Budget execution, disbursements, and burn rate.',
    frequency: 'MONTHLY',
    requiredParams: [],
    formats: ['PDF', 'EXCEL', 'CSV']
  },
  {
    code: 'PROCUREMENT', name: 'Procurement Plan Execution',
    description: 'Planned vs actual procurement activities and delays.',
    frequency: 'QUARTERLY',
    requiredParams: [],
    formats: ['PDF', 'EXCEL', 'CSV']
  },
  {
    code: 'BENEFICIARY', name: 'Beneficiary Outreach Report',
    description: 'Beneficiaries reached, disaggregated by gender and region.',
    frequency: 'SEMI_ANNUAL',
    requiredParams: [],
    formats: ['PDF', 'EXCEL', 'CSV']
  },
  {
    code: 'GRIEVANCE', name: 'Grievance Status Report',
    description: 'Grievances by category, status, and SLA performance.',
    frequency: 'MONTHLY',
    requiredParams: [],
    formats: ['PDF', 'EXCEL', 'CSV']
  },
  {
    code: 'IMPACT', name: 'Impact Evaluation Report',
    description: 'Impact indicators across waves with DiD analysis.',
    frequency: 'ANNUAL',
    requiredParams: ['projectId'],
    formats: ['PDF', 'EXCEL']
  },
  {
    code: 'INCEPTION', name: 'Inception Report Status',
    description: 'All inception reports with submission and review status.',
    frequency: 'ON_DEMAND',
    requiredParams: [],
    formats: ['PDF', 'EXCEL', 'CSV']
  },
  {
    code: 'AD_HOC', name: 'Ad-Hoc Report',
    description: 'Custom report — parameters supplied at generation time.',
    frequency: 'ON_DEMAND',
    requiredParams: [],
    formats: ['PDF', 'EXCEL', 'CSV']
  }
];

export function listCatalogue(): ReportDefinitionDTO[] {
  return CATALOGUE;
}

/* ════════════════════════════════════════════════════════════════════
 * GENERATE (enqueue)
 * ════════════════════════════════════════════════════════════════════ */

export async function enqueueReport(
  input: GenerateReportInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<ReportInstanceDTO> {
  // Validate report code
  const def = CATALOGUE.find((c) => c.code === input.reportCode);
  if (!def) throw new BadRequestError(`Unknown report code: ${input.reportCode}`);
  if (!def.formats.includes(input.format)) {
    throw new BadRequestError(`Format ${input.format} not supported for this report`);
  }

  // Scope check for project-bound reports
  if (input.projectId) {
    const project = await prisma.project.findFirst({
      where: { projectId: input.projectId, deletedAt: null }
    });
    if (!project) throw new NotFoundError('Project', input.projectId);
  }

  // Create the Report row (status QUEUED)
  const report = await prisma.report.create({
    data: {
      ...(input.projectId ? { projectId: input.projectId } : {}),
      reportType: input.reportCode,
      ...(input.period ? { period: input.period } : {}),
      format: input.format,
      status: 'QUEUED',
      parameters: {
        projectId: input.projectId || null,
        period: input.period || null,
        fiscalYear: input.fiscalYear ?? null,
        scope: { orgLevel: scope.orgLevel, regions: scope.regions, woredas: scope.woredas },
        orgId
      },
      generatedById: userId
    },
    include: {
      project: { select: { projectId: true, projectCode: true } },
      generatedBy: { select: { fullName: true } }
    }
  });

  // Enqueue the job
  const queue = getQueue(QUEUE_NAMES.REPORTS);
  await queue.add(
    input.reportCode,
    { reportId: report.reportId },
    { jobId: `report:${report.reportId}` }
  );

  await writeAudit({
    userId,
    entity: 'REPORT',
    entityId: report.reportId,
    action: 'CREATE',
    newValue: {
      reportType: report.reportType,
      format: report.format,
      status: 'QUEUED'
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toReportInstanceDTO(report);
}

/* ════════════════════════════════════════════════════════════════════
 * LIST INSTANCES
 * ════════════════════════════════════════════════════════════════════ */

export async function listInstances(
  query: ListInstancesQuery,
  scope: ScopeClaim,
  orgId: string
): Promise<{
  data: ReportInstanceDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  const filters: Prisma.ReportWhereInput[] = [];

  if (query.report_code) filters.push({ reportType: query.report_code as ReportType });
  if (query.status) filters.push({ status: query.status });
  if (query.project_id) filters.push({ projectId: query.project_id });

  // Scope enforcement
  if (scope.orgLevel !== 'FEDERAL' || scope.ownRecordsOnly) {
    filters.push({
      OR: [
        { project: { is: { ownerOrgId: orgId } } },
        { projectId: null } // allow org-level reports (non-project-bound)
      ]
    });
  }

  const where: Prisma.ReportWhereInput = filters.length ? { AND: filters } : {};

  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.ReportWhereInput | undefined = cursorId
    ? { reportId: { not: cursorId } }
    : undefined;

  const [rows, totalCount] = await Promise.all([
    prisma.report.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      include: {
        project: { select: { projectId: true, projectCode: true } },
        generatedBy: { select: { fullName: true } }
      },
      orderBy: { generatedAt: 'desc' },
      take: pagination.limit + 1
    }),
    prisma.report.count({ where })
  ]);

  const { rows: trimmed, meta } = buildPaginationMeta(
    rows.map((r) => ({ id: r.reportId })),
    pagination.limit,
    totalCount
  );
  const trimmedIds = new Set(trimmed.map((t) => t.id));
  const finalRows = rows.filter((r) => trimmedIds.has(r.reportId));

  return {
    data: finalRows.map(toReportInstanceDTO),
    pagination: {
      ...(meta.nextCursor ? { nextCursor: meta.nextCursor } : {}),
      limit: meta.limit,
      totalCount: meta.totalCount,
      hasMore: meta.hasMore
    }
  };
}

/* ════════════════════════════════════════════════════════════════════
 * GET INSTANCE
 * ════════════════════════════════════════════════════════════════════ */

export async function getInstance(reportId: string): Promise<ReportInstanceDTO> {
  const report = await prisma.report.findUnique({
    where: { reportId },
    include: {
      project: { select: { projectId: true, projectCode: true } },
      generatedBy: { select: { fullName: true } }
    }
  });
  if (!report) throw new NotFoundError('Report', reportId);
  return toReportInstanceDTO(report);
}

/* ════════════════════════════════════════════════════════════════════
 * DOWNLOAD — signed URL
 * ════════════════════════════════════════════════════════════════════ */

export async function getDownloadUrl(reportId: string): Promise<{ url: string; expiresAt: string }> {
  const report = await prisma.report.findUnique({ where: { reportId } });
  if (!report) throw new NotFoundError('Report', reportId);
  if (report.status !== 'READY' || !report.filePath) {
    throw new BadRequestError(`Report is not ready (status: ${report.status})`);
  }
  const url = await storage.signedUrl(report.filePath, 900);
  return { url, expiresAt: new Date(Date.now() + 900 * 1000).toISOString() };
}

/* ════════════════════════════════════════════════════════════════════
 * WB EXPORT (synchronous — small enough)
 * ════════════════════════════════════════════════════════════════════ */

export async function exportWb(
  period: string,
  projectIds: string[] | undefined,
  scope: ScopeClaim,
  orgId: string
): Promise<WbExportDTO> {
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(projectIds?.length ? { projectId: { in: projectIds } } : {})
  };

  if (scope.orgLevel !== 'FEDERAL') {
    where.ownerOrgId = orgId;
  }

  const projects = await prisma.project.findMany({
    where,
    include: { indicators: true, budgets: true, disbursements: true }
  });

  const rows: WbProjectRow[] = await Promise.all(
    projects.map(async (p) => {
      const planned = p.budgets.reduce((s, b) => s + Number(b.appropriation), 0);
      const actual = p.disbursements.reduce((s, d) => s + Number(d.amountEtb), 0);

      const grievances = await prisma.grievance.groupBy({
        by: ['status'],
        where: { projectId: p.projectId },
        _count: { status: true }
      });

      const open = grievances
        .filter((g) => ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(g.status))
        .reduce((s, g) => s + g._count.status, 0);
      const resolved = grievances
        .filter((g) => ['RESOLVED', 'CLOSED'].includes(g.status))
        .reduce((s, g) => s + g._count.status, 0);

      return {
        projectCode: p.projectCode,
        wbCreditNo: p.wbCreditNo ?? '',
        reportingPeriod: period,
        status: p.status,
        plannedDisbursement: String(planned),
        actualDisbursement: String(actual),
        currency: p.currency,
        indicators: p.indicators.map((ind) => ({
          code: ind.code,
          baseline: String(ind.baseline ?? 0),
          target: String(ind.target ?? 0),
          actual: String(ind.actual ?? 0),
          status: ind.status
        })),
        grievancesOpen: open,
        grievancesResolved: resolved
      };
    })
  );

  const buffer = renderWbXml(rows);
  const key = buildReportKey(`wb-${period}-${Date.now()}`, 'XML');
  await storage.upload(key, buffer, { contentType: 'application/xml' });

  const url = await storage.signedUrl(key, 900);
  return {
    url,
    expiresAt: new Date(Date.now() + 900 * 1000).toISOString(),
    period,
    projectCount: rows.length
  };
}

/* ════════════════════════════════════════════════════════════════════
 * SCHEDULES
 * ════════════════════════════════════════════════════════════════════ */

export async function listSchedules(): Promise<ReportScheduleDTO[]> {
  const schedules = await prisma.reportSchedule.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return schedules.map((s) => ({
    scheduleId: s.scheduleId,
    reportCode: s.reportType,
    cron: s.cron,
    recipients: Array.isArray(s.recipients) ? (s.recipients as string[]) : [],
    format: s.format,
    active: s.active,
    ...(s.lastRunAt ? { lastRunAt: s.lastRunAt.toISOString() } : {}),
    ...(s.nextRunAt ? { nextRunAt: s.nextRunAt.toISOString() } : {})
  }));
}

export async function createSchedule(
  input: ScheduleReportInput
): Promise<ReportScheduleDTO> {
  const def = CATALOGUE.find((c) => c.code === input.reportCode);
  if (!def) throw new BadRequestError(`Unknown report code: ${input.reportCode}`);

  const schedule = await prisma.reportSchedule.create({
    data: {
      reportType: input.reportCode,
      cron: input.cron,
      recipients: input.recipients,
      format: input.format,
      active: true
    }
  });

  return {
    scheduleId: schedule.scheduleId,
    reportCode: schedule.reportType,
    cron: schedule.cron,
    recipients: schedule.recipients as string[],
    format: schedule.format,
    active: schedule.active
  };
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const existing = await prisma.reportSchedule.findUnique({ where: { scheduleId } });
  if (!existing) throw new NotFoundError('Schedule', scheduleId);
  await prisma.reportSchedule.delete({ where: { scheduleId } });
}

/* ════════════════════════════════════════════════════════════════════
 * WORKER LOGIC — called by report.worker.ts
 * ════════════════════════════════════════════════════════════════════ */

export async function processReportJob(reportId: string): Promise<void> {
  const report = await prisma.report.findUnique({ where: { reportId } });
  if (!report) {
    logger.warn({ reportId }, 'report not found for processing');
    return;
  }

  await prisma.report.update({
    where: { reportId },
    data: { status: 'GENERATING' }
  });

  try {
    const parameters = (report.parameters as Record<string, unknown> | null) ?? {};
    const rows = await fetchReportData(report.reportType, parameters);

    let buffer: Buffer;
    if (report.format === 'CSV') {
      buffer = renderCsv(rows);
    } else if (report.format === 'EXCEL') {
      buffer = await renderExcel(rows, report.reportType);
    } else {
      buffer = await renderPdf({
        title: `${report.reportType} Report`,
        subtitle: String(parameters.period ?? ''),
        generatedBy: 'PIIMS',
        columns: Object.keys(rows[0] ?? {}).map((k) => ({ key: k, label: k })),
        rows
      });
    }

    const key = buildReportKey(reportId, report.format);
    await storage.upload(key, buffer, {
      contentType:
        report.format === 'PDF'
          ? 'application/pdf'
          : report.format === 'EXCEL'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv'
    });

    await prisma.report.update({
      where: { reportId },
      data: {
        status: 'READY',
        filePath: key,
        fileSize: BigInt(buffer.length)
      }
    });

    logger.info({ reportId, size: buffer.length }, 'report generated');
  } catch (err) {
    logger.error({ reportId, err: (err as Error).message }, 'report generation failed');
    await prisma.report.update({
      where: { reportId },
      data: {
        status: 'FAILED',
        error: (err as Error).message.slice(0, 1000)
      }
    });
    throw err;
  }
}

/* ════════════════════════════════════════════════════════════════════
 * DATA FETCHERS — one per report type
 * ════════════════════════════════════════════════════════════════════ */

async function fetchReportData(
  reportType: ReportType,
  parameters: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  switch (reportType) {
    case 'FINANCIAL': {
      const projectId = (parameters.projectId as string | undefined) ?? null;
      const budgets = await prisma.budget.findMany({
        where: projectId ? { projectId } : {},
        include: { project: { select: { projectCode: true } } }
      });
      return budgets.map((b) => ({
        ProjectCode: b.project.projectCode,
        FiscalYear: b.fiscalYear,
        Currency: b.currency,
        Appropriation: Number(b.appropriation),
        Released: Number(b.released),
        Expended: Number(b.expended),
        Balance: Number(b.balance)
      }));
    }

    case 'BENEFICIARY': {
      const groups = await prisma.beneficiary.groupBy({
        by: ['region', 'gender'],
        _count: { beneficiaryId: true }
      });
      return groups.map((g) => ({
        Region: g.region ?? 'Unknown',
        Gender: g.gender,
        Count: g._count.beneficiaryId
      }));
    }

    case 'PROCUREMENT': {
      const projectId = (parameters.projectId as string | undefined) ?? null;
      const rows = await prisma.procurement.findMany({
        where: projectId ? { projectId } : {},
        include: { project: { select: { projectCode: true } } }
      });
      return rows.map((p) => ({
        ProjectCode: p.project.projectCode,
        PlanRef: p.planRef,
        Description: p.description,
        Method: p.method,
        EstimatedAmount: p.estimatedAmount ? Number(p.estimatedAmount) : 0,
        Status: p.status,
        PlanDate: p.planDate?.toISOString().slice(0, 10) ?? '',
        AwardDate: p.awardDate?.toISOString().slice(0, 10) ?? ''
      }));
    }

    case 'GRIEVANCE': {
      const projectId = (parameters.projectId as string | undefined) ?? null;
      const rows = await prisma.grievance.findMany({
        where: projectId ? { projectId } : {}
      });
      return rows.map((g) => ({
        Ticket: g.ticketNo,
        Category: g.category,
        Severity: g.severity,
        Status: g.status,
        SubmittedAt: g.submittedAt.toISOString().slice(0, 10),
        SLADue: g.slaDue.toISOString().slice(0, 10),
        ResolvedAt: g.resolvedAt?.toISOString().slice(0, 10) ?? ''
      }));
    }

    case 'INCEPTION': {
      const rows = await prisma.inceptionReport.findMany({
        include: { project: { select: { projectCode: true, name: true } } }
      });
      return rows.map((r) => ({
        ProjectCode: r.project.projectCode,
        ProjectName: r.project.name,
        Version: r.version,
        Status: r.status,
        SubmittedDate: r.submissionDate?.toISOString().slice(0, 10) ?? '',
        DueDate: r.dueDate.toISOString().slice(0, 10),
        NoObjection: r.noObjection ? 'Yes' : 'No'
      }));
    }

    case 'IMPACT': {
      const projectId = (parameters.projectId as string | undefined) ?? null;
      const rows = await prisma.impactIndicator.findMany({
        where: projectId ? {} : {}
      });
      return rows.map((i) => ({
        Code: i.code,
        Name: i.name,
        Unit: i.unit,
        Direction: i.direction,
        Status: i.status
      }));
    }

    case 'PPMR':
    case 'ISR': {
      const projectId = (parameters.projectId as string | undefined) ?? null;
      const projects = await prisma.project.findMany({
        where: projectId ? { projectId } : {},
        include: { indicators: true, budgets: true }
      });
      const out: Record<string, unknown>[] = [];
      for (const p of projects) {
        const totalBudget = p.budgets.reduce((s, b) => s + Number(b.appropriation), 0);
        const totalExpended = p.budgets.reduce((s, b) => s + Number(b.expended), 0);
        out.push({
          ProjectCode: p.projectCode,
          Name: p.name,
          Status: p.status,
          Sector: p.sector,
          TotalBudget: totalBudget,
          Expended: totalExpended,
          ExecutionRate: totalBudget > 0 ? ((totalExpended / totalBudget) * 100).toFixed(2) + '%' : '—'
        });
      }
      return out;
    }

    case 'AD_HOC':
      return [{ Message: 'Ad-hoc reports require custom parameter mapping' }];

    default:
      return [{ Message: `Report type ${reportType} not implemented` }];
  }
}

/* ════════════════════════════════════════════════════════════════════
 * MAPPERS
 * ════════════════════════════════════════════════════════════════════ */

type ReportWithRelations = Prisma.ReportGetPayload<{
  include: {
    project: { select: { projectId: true; projectCode: true } };
    generatedBy: { select: { fullName: true } };
  };
}>;

function toReportInstanceDTO(r: ReportWithRelations): ReportInstanceDTO {
  return {
    instanceId: r.reportId,
    reportCode: r.reportType,
    ...(r.projectId ? { projectId: r.projectId } : {}),
    ...(r.project ? { projectCode: r.project.projectCode } : {}),
    ...(r.period ? { period: r.period } : {}),
    format: r.format,
    status: r.status as ReportInstanceDTO['status'],
    ...(r.filePath ? { filePath: r.filePath } : {}),
    ...(r.fileSize ? { fileSize: Number(r.fileSize) } : {}),
    ...(r.generatedAt ? { generatedAt: r.generatedAt.toISOString() } : {}),
    generatedById: r.generatedById,
    generatedByName: r.generatedBy.fullName,
    ...(r.error ? { error: r.error } : {})
  };
}