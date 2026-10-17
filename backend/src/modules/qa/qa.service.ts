import { Prisma, QaFlagStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { ConflictError, NotFoundError, BadRequestError } from '@/lib/errors.js';
import { evaluateRules, type QASubmission } from './qa.rules.js';
import type {
  CreateQaRuleInput, ReviewFlagInput, BackCheckInput, ListFlagsQuery
} from './qa.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

/* ════════════════════════════════════════════════════════════════════
 * RULES ENGINE (invoked from M20)
 * ════════════════════════════════════════════════════════════════════ */

export async function runQaRules(submissionId: string): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { submissionId },
    include: {
      answers: { include: { question: true } },
      assignment: { include: { wave: { include: { project: { include: { location: true } } } } } }
    }
  });
  if (!submission) return;

  const rules = await prisma.qaRule.findMany({ where: { active: true } });
  if (rules.length === 0) return;

  // Compute context from this wave's submissions
  const waveSubmissions = await prisma.submission.findMany({
    where: { waveId: submission.waveId, durationSeconds: { not: null } },
    select: { durationSeconds: true }
  });
  const durations = waveSubmissions.map((s) => s.durationSeconds!).filter((d) => d > 0).sort((a, b) => a - b);
  const median = durations.length > 0 ? durations[Math.floor(durations.length / 2)]! : 0;

  const qaSub: QASubmission = {
    submissionId,
    collectorId: submission.collectorId,
    durationSeconds: submission.durationSeconds ?? 0,
    answers: submission.answers.map((a) => ({
      questionId: a.questionId,
      value: a.valueText ?? (a.valueNumeric != null ? Number(a.valueNumeric) : null)
    })),
    ...(submission.gpsStartLat != null && submission.gpsStartLon != null
      ? { gpsStart: { lat: submission.gpsStartLat, lon: submission.gpsStartLon } } : {}),
    ...(submission.gpsEndLat != null && submission.gpsEndLon != null
      ? { gpsEnd: { lat: submission.gpsEndLat, lon: submission.gpsEndLon } } : {}),
    ...(submission.assignment.wave.project.location?.latitude != null &&
        submission.assignment.wave.project.location?.longitude != null
      ? { assignedLocation: {
          lat: submission.assignment.wave.project.location.latitude,
          lon: submission.assignment.wave.project.location.longitude
        } } : {})
  };

  const violations = evaluateRules(qaSub, { medianDurationSeconds: median });

  if (violations.length > 0) {
    // Find matching rules and create flags
    for (const v of violations) {
      const rule = rules.find((r) => r.type === v.ruleType);
      if (!rule) continue;

      await prisma.qaFlag.create({
        data: {
          submissionId,
          ruleId: rule.ruleId,
          severity: rule.severity,
          details: v.details as Prisma.InputJsonValue,
          status: 'OPEN'
        }
      });
    }

    // Update submission qaStatus
    await prisma.submission.update({
      where: { submissionId },
      data: { qaStatus: 'FLAGGED', status: 'QA_REVIEW' }
    });
  } else {
    await prisma.submission.update({
      where: { submissionId },
      data: { qaStatus: 'CLEARED', status: 'QA_CLEARED' }
    });
  }
}

/* ════════════════════════════════════════════════════════════════════
 * FLAGS
 * ════════════════════════════════════════════════════════════════════ */

export async function listFlags(query: ListFlagsQuery) {
  const filters: Prisma.QaFlagWhereInput[] = [];
  if (query.severity) {
    const sevs = query.severity.split(',').filter(Boolean);
    if (sevs.length) filters.push({ severity: { in: sevs as any[] } });
  }
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.collector_id) {
    filters.push({ submission: { collectorId: query.collector_id } });
  }
  if (query.wave_id) filters.push({ submission: { waveId: query.wave_id } });
  if (query.project_id) filters.push({ submission: { projectId: query.project_id } });

  const rows = await prisma.qaFlag.findMany({
    where: filters.length ? { AND: filters } : {},
    include: {
      rule: true,
      submission: {
        include: {
          collector: { include: { user: { select: { fullName: true } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(200, Number(query.limit) || 50)
  });

  return rows.map((f) => ({
    flagId: f.flagId,
    submissionId: f.submissionId,
    collectorId: f.submission.collectorId,
    collectorName: f.submission.collector.user.fullName,
    ruleId: f.ruleId,
    ruleCode: f.rule.code,
    ruleName: f.rule.name,
    severity: f.severity,
    details: f.details,
    status: f.status,
    reviewedById: f.reviewedById,
    reviewedAt: f.reviewedAt?.toISOString() ?? null,
    resolution: f.resolution,
    createdAt: f.createdAt.toISOString()
  }));
}

export async function reviewFlag(
  flagId: string,
  input: ReviewFlagInput,
  userId: string,
  ctx: Ctx
) {
  const flag = await prisma.qaFlag.findUnique({ where: { flagId } });
  if (!flag) throw new NotFoundError('QaFlag', flagId);
  if (flag.status === 'RESOLVED') throw new BadRequestError('Flag is already resolved');

  const newStatus: QaFlagStatus =
    input.decision === 'ACCEPT' ? 'RESOLVED' :
    input.decision === 'REJECT' ? 'ESCALATED' : 'IN_REVIEW';

  await prisma.qaFlag.update({
    where: { flagId },
    data: {
      status: newStatus,
      reviewedById: userId,
      reviewedAt: new Date(),
      ...(input.notes ? { resolution: input.notes } : {})
    }
  });

  await writeAudit({
    userId, entity: 'QA_FLAG', entityId: flagId, action: 'UPDATE',
    oldValue: { status: flag.status }, newValue: { status: newStatus, decision: input.decision },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return { flagId, status: newStatus };
}

export async function createBackCheck(
  input: BackCheckInput,
  userId: string,
  ctx: Ctx
) {
  const supervisor = await prisma.supervisor.findUnique({ where: { userId } });
  if (!supervisor) throw new NotFoundError('Supervisor profile', userId);

  const submission = await prisma.submission.findUnique({ where: { submissionId: input.submissionId } });
  if (!submission) throw new NotFoundError('Submission', input.submissionId);

  const bc = await prisma.backCheck.create({
    data: {
      submissionId: input.submissionId,
      supervisorId: supervisor.supervisorId,
      date: new Date(),
      result: input.result,
      ...(input.mismatchPct !== undefined ? { mismatchPct: new Prisma.Decimal(input.mismatchPct) } : {}),
      ...(input.notes ? { notes: input.notes } : {})
    }
  });

  await writeAudit({
    userId, entity: 'BACK_CHECK', entityId: bc.backcheckId, action: 'CREATE',
    newValue: { submissionId: input.submissionId, result: input.result },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return bc;
}

/* ════════════════════════════════════════════════════════════════════
 * SCORECARDS
 * ════════════════════════════════════════════════════════════════════ */

export async function listScorecards(waveId?: string) {
  const where: Prisma.CollectorScorecardWhereInput = waveId ? { waveId } : {};
  const rows = await prisma.collectorScorecard.findMany({
    where,
    include: { collector: { include: { user: { select: { fullName: true } } } } },
    orderBy: { compositeScore: 'desc' }
  });

  return rows.map((r) => ({
    collectorId: r.collectorId,
    collectorName: r.collector.user.fullName,
    waveId: r.waveId,
    submissionsCount: r.submissionsCount,
    flaggedCount: r.flaggedCount,
    backcheckPassRate: r.backcheckPassRate != null ? Number(r.backcheckPassRate) : null,
    avgDurationSeconds: r.avgDurationSeconds,
    compositeScore: r.compositeScore != null ? Number(r.compositeScore) : 0
  }));
}

export async function computeScorecards(waveId: string): Promise<number> {
  const submissions = await prisma.submission.findMany({
    where: { waveId, durationSeconds: { not: null } },
    include: { collector: true }
  });

  const byCollector = new Map<string, typeof submissions>();
  for (const s of submissions) {
    if (!byCollector.has(s.collectorId)) byCollector.set(s.collectorId, []);
    byCollector.get(s.collectorId)!.push(s);
  }

  let computed = 0;
  for (const [collectorId, subs] of byCollector) {
    const flagged = await prisma.qaFlag.count({
      where: { submission: { collectorId, waveId } }
    });
    const backChecks = await prisma.backCheck.findMany({
      where: { submission: { collectorId, waveId } }
    });
    const passRate = backChecks.length > 0
      ? (backChecks.filter((b) => b.result === 'PASS').length / backChecks.length) * 100
      : null;
    const avgDuration = Math.round(subs.reduce((s, x) => s + (x.durationSeconds ?? 0), 0) / subs.length);

    const flagRatio = subs.length > 0 ? flagged / subs.length : 0;
    const compositeScore = Math.round((1 - flagRatio) * (passRate ?? 100) * 100) / 100;

    await prisma.collectorScorecard.upsert({
      where: { collectorId_waveId: { collectorId, waveId } },
      create: {
        collectorId, waveId,
        projectId: subs[0]!.projectId,
        submissionsCount: subs.length,
        flaggedCount: flagged,
        ...(passRate !== null ? { backcheckPassRate: new Prisma.Decimal(passRate) } : {}),
        avgDurationSeconds: avgDuration,
        compositeScore: new Prisma.Decimal(compositeScore)
      },
      update: {
        submissionsCount: subs.length,
        flaggedCount: flagged,
        ...(passRate !== null ? { backcheckPassRate: new Prisma.Decimal(passRate) } : {}),
        avgDurationSeconds: avgDuration,
        compositeScore: new Prisma.Decimal(compositeScore),
        computedAt: new Date()
      }
    });
    computed++;
  }
  return computed;
}

/* ════════════════════════════════════════════════════════════════════
 * STATS
 * ════════════════════════════════════════════════════════════════════ */

export async function getStats(waveId?: string) {
  const where: Prisma.QaFlagWhereInput = waveId ? { submission: { waveId } } : {};
  const flags = await prisma.qaFlag.findMany({
    where,
    include: { rule: { select: { type: true } } }
  });

  const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<string, number>;
  const byRuleMap = new Map<string, number>();
  let open = 0, inReview = 0, resolved = 0;

  for (const f of flags) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
    byRuleMap.set(f.rule.type, (byRuleMap.get(f.rule.type) ?? 0) + 1);
    if (f.status === 'OPEN') open++;
    else if (f.status === 'IN_REVIEW') inReview++;
    else if (f.status === 'RESOLVED') resolved++;
  }

  return {
    total: flags.length,
    open, inReview, resolved,
    bySeverity,
    byRule: Array.from(byRuleMap.entries()).map(([ruleType, count]) => ({ ruleType, count }))
  };
}

export async function listRules() {
  const rules = await prisma.qaRule.findMany({ orderBy: { code: 'asc' } });
  return rules.map((r) => ({
    ruleId: r.ruleId, code: r.code, name: r.name, type: r.type,
    threshold: r.threshold, severity: r.severity, active: r.active
  }));
}

export async function createRule(input: CreateQaRuleInput, userId: string, ctx: Ctx) {
  try {
    const created = await prisma.qaRule.create({
      data: {
        code: input.code, name: input.name, type: input.type,
        threshold: input.threshold as Prisma.InputJsonValue,
        severity: input.severity, active: input.active
      }
    });
    await writeAudit({
      userId, entity: 'QA_RULE', entityId: created.ruleId, action: 'CREATE',
      newValue: { code: created.code, type: created.type },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });
    return created;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Rule code '${input.code}' already exists`);
    }
    throw err;
  }
}

export async function toggleRule(ruleId: string, active: boolean, userId: string, ctx: Ctx) {
  const existing = await prisma.qaRule.findUnique({ where: { ruleId } });
  if (!existing) throw new NotFoundError('QaRule', ruleId);

  await prisma.qaRule.update({ where: { ruleId }, data: { active } });

  await writeAudit({
    userId, entity: 'QA_RULE', entityId: ruleId, action: 'UPDATE',
    oldValue: { active: existing.active }, newValue: { active },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return { ruleId, active };
}