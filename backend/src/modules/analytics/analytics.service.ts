import { prisma } from '@/lib/prisma.js';
import { NotFoundError, BadRequestError } from '@/lib/errors.js';
import { computeDiDFromRaw, type DiDResult } from './did.js';

export interface IndicatorSeries {
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  waves: Array<{ waveCode: string; waveName: string; mean: number; n: number }>;
}

export interface ImpactDashboard {
  projectId: string;
  projectCode: string;
  projectName: string;
  waves: Array<{ waveCode: string; waveName: string; startDate: string; endDate: string }>;
  headlineIndicators: IndicatorSeries[];
  lastUpdated: string;
}

export async function getImpactDashboard(projectId: string): Promise<ImpactDashboard> {
  const project = await prisma.project.findUnique({
    where: { projectId },
    include: { waves: { orderBy: { code: 'asc' } } }
  });
  if (!project) throw new NotFoundError('Project', projectId);

  // Get indicators assigned to any wave
  const indicators = await prisma.impactIndicator.findMany({
    where: {
      waveAssignments: { some: { wave: { projectId } } }
    },
    include: { waveAssignments: { include: { wave: true } } }
  });

  const headlineIndicators: IndicatorSeries[] = [];

  for (const ind of indicators) {
    // Find questions linked to this indicator
    const questions = await prisma.question.findMany({
      where: { indicatorId: ind.indicatorId },
      select: { questionId: true }
    });
    if (questions.length === 0) continue;

    const qIds = questions.map((q) => q.questionId);
    const waves: Array<{ waveCode: string; waveName: string; mean: number; n: number }> = [];

    for (const wave of project.waves) {
      const answers = await prisma.submissionAnswer.findMany({
        where: {
          questionId: { in: qIds },
          submission: { waveId: wave.waveId, qaStatus: 'CLEARED' }
        },
        select: { valueNumeric: true }
      });

      const nums = answers.map((a) => (a.valueNumeric != null ? Number(a.valueNumeric) : NaN)).filter((n) => !isNaN(n));
      if (nums.length === 0) continue;

      const mean = nums.reduce((s, v) => s + v, 0) / nums.length;
      waves.push({ waveCode: wave.code, waveName: wave.name, mean: Math.round(mean * 100) / 100, n: nums.length });
    }

    if (waves.length > 0) {
      headlineIndicators.push({
        indicatorId: ind.indicatorId,
        indicatorCode: ind.code,
        indicatorName: ind.name,
        unit: ind.unit,
        waves
      });
    }
  }

  return {
    projectId: project.projectId,
    projectCode: project.projectCode,
    projectName: project.name,
    waves: project.waves.map((w) => ({
      waveCode: w.code,
      waveName: w.name,
      startDate: w.plannedStart?.toISOString().slice(0, 10) ?? '',
      endDate: w.plannedEnd?.toISOString().slice(0, 10) ?? ''
    })),
    headlineIndicators,
    lastUpdated: new Date().toISOString()
  };
}

export async function computeProjectDiD(
  projectId: string,
  indicatorId: string,
  treatmentGroupId: string,
  controlGroupId: string,
  baselineWaveCode: string,
  endlineWaveCode: string
): Promise<DiDResult> {
  const indicator = await prisma.impactIndicator.findUnique({ where: { indicatorId } });
  if (!indicator) throw new NotFoundError('ImpactIndicator', indicatorId);

  const questions = await prisma.question.findMany({
    where: { indicatorId },
    select: { questionId: true }
  });
  if (questions.length === 0) throw new BadRequestError('No questions linked to this indicator');

  const qIds = questions.map((q) => q.questionId);

  const baselineWave = await prisma.wave.findFirst({ where: { projectId, code: baselineWaveCode } });
  const endlineWave = await prisma.wave.findFirst({ where: { projectId, code: endlineWaveCode } });
  if (!baselineWave || !endlineWave) throw new NotFoundError('Wave');

  const fetchValues = async (waveId: string, groupId: string) => {
    const answers = await prisma.submissionAnswer.findMany({
      where: {
        questionId: { in: qIds },
        submission: {
          waveId,
          qaStatus: 'CLEARED',
          panel: { treatmentGroupId: groupId }
        }
      },
      select: { valueNumeric: true }
    });
    return answers.map((a) => (a.valueNumeric != null ? Number(a.valueNumeric) : NaN)).filter((n) => !isNaN(n));
  };

  const [tBase, tEnd, cBase, cEnd] = await Promise.all([
    fetchValues(baselineWave.waveId, treatmentGroupId),
    fetchValues(endlineWave.waveId, treatmentGroupId),
    fetchValues(baselineWave.waveId, controlGroupId),
    fetchValues(endlineWave.waveId, controlGroupId)
  ]);

  if (tBase.length === 0 || tEnd.length === 0 || cBase.length === 0 || cEnd.length === 0) {
    throw new BadRequestError('Insufficient data for DiD analysis — one or more groups have no observations');
  }

  return computeDiDFromRaw(
    { indicatorId: indicator.indicatorId, indicatorCode: indicator.code, indicatorName: indicator.name, unit: indicator.unit },
    tBase, tEnd, cBase, cEnd
  );
}

export async function getWaveComparison(projectId: string, indicatorId: string) {
  const indicator = await prisma.impactIndicator.findUnique({ where: { indicatorId } });
  if (!indicator) throw new NotFoundError('ImpactIndicator', indicatorId);

  const questions = await prisma.question.findMany({ where: { indicatorId }, select: { questionId: true } });
  if (questions.length === 0) return { indicatorId, waves: [] };

  const qIds = questions.map((q) => q.questionId);
  const waves = await prisma.wave.findMany({ where: { projectId }, orderBy: { code: 'asc' } });

  const results: Array<{ waveCode: string; waveName: string; mean: number; n: number }> = [];

  for (const w of waves) {
    const answers = await prisma.submissionAnswer.findMany({
      where: {
        questionId: { in: qIds },
        submission: { waveId: w.waveId, qaStatus: 'CLEARED' }
      },
      select: { valueNumeric: true }
    });
    const nums = answers.map((a) => (a.valueNumeric != null ? Number(a.valueNumeric) : NaN)).filter((n) => !isNaN(n));
    if (nums.length === 0) continue;
    const mean = nums.reduce((s, v) => s + v, 0) / nums.length;
    results.push({ waveCode: w.code, waveName: w.name, mean: Math.round(mean * 100) / 100, n: nums.length });
  }

  return { indicatorId, waves: results };
}