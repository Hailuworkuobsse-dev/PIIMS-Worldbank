import { Prisma, QuestionType } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { ConflictError, NotFoundError, BadRequestError } from '@/lib/errors.js';
import { evaluateCondition } from './skipLogic.js';
import type {
  CreateSurveyInput, CreateSectionInput, CreateQuestionInput, SkipLogicInput, AssignSurveyInput
} from './survey.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

export async function createSurvey(input: CreateSurveyInput, userId: string, ctx: Ctx) {
  try {
    const survey = await prisma.survey.create({
      data: {
        code: input.code,
        name: input.name,
        ...(input.nameAm ? { nameAm: input.nameAm } : {}),
        ...(input.purpose ? { purpose: input.purpose } : {}),
        ...(input.projectId ? { projectId: input.projectId } : {}),
        status: 'DRAFT',
        createdById: userId
      }
    });

    // Auto-create first version
    const version = await prisma.surveyVersion.create({
      data: {
        surveyId: survey.surveyId,
        versionNo: 1,
        languages: ['en'],
        locked: false
      }
    });

    await prisma.survey.update({
      where: { surveyId: survey.surveyId },
      data: { currentVersionId: version.versionId }
    });

    await writeAudit({
      userId, entity: 'SURVEY', entityId: survey.surveyId, action: 'CREATE',
      newValue: { code: survey.code, name: survey.name },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return getSurvey(survey.surveyId);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Survey code '${input.code}' already exists`);
    }
    throw err;
  }
}

export async function getSurvey(surveyId: string) {
  const survey = await prisma.survey.findUnique({
    where: { surveyId },
    include: {
      versions: {
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: { orderBy: { orderNo: 'asc' } },
                  skipLogic: true
                },
                orderBy: { orderNo: 'asc' }
              }
            },
            orderBy: { orderNo: 'asc' }
          }
        },
        orderBy: { versionNo: 'desc' }
      }
    }
  });
  if (!survey) throw new NotFoundError('Survey', surveyId);

  return {
    surveyId: survey.surveyId,
    code: survey.code,
    name: survey.name,
    ...(survey.nameAm ? { nameAm: survey.nameAm } : {}),
    ...(survey.purpose ? { purpose: survey.purpose } : {}),
    ...(survey.projectId ? { projectId: survey.projectId } : {}),
    status: survey.status,
    currentVersionId: survey.currentVersionId,
    versions: survey.versions.map((v) => ({
      versionId: v.versionId,
      versionNo: v.versionNo,
      publishedAt: v.publishedAt?.toISOString() ?? null,
      locked: v.locked,
      languages: Array.isArray(v.languages) ? (v.languages as string[]) : ['en'],
      sections: v.sections.map((s) => ({
        sectionId: s.sectionId,
        code: s.code,
        title: s.title,
        titleAm: s.titleAm,
        description: s.description,
        orderNo: s.orderNo,
        repeatable: s.repeatable,
        questions: s.questions.map((q) => ({
          questionId: q.questionId,
          code: q.code,
          type: q.type,
          text: q.text,
          textAm: q.textAm,
          hint: q.hint,
          required: q.required,
          orderNo: q.orderNo,
          indicatorId: q.indicatorId,
          disaggregationKey: q.disaggregationKey,
          calculation: q.calculation,
          options: q.options.map((o) => ({ code: o.code, label: o.label, labelAm: o.labelAm, value: o.value, orderNo: o.orderNo })),
          skipLogic: q.skipLogic.map((l) => ({ logicId: l.logicId, condition: l.condition, action: l.action, targetQuestionId: l.targetQuestionId }))
        }))
      }))
    }))
  };
}

export async function listSurveys(query: { q?: string; status?: string }) {
  const filters: Prisma.SurveyWhereInput[] = [];
  if (query.q) filters.push({ OR: [{ name: { contains: query.q } }, { code: { contains: query.q } }] });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }

  const surveys = await prisma.survey.findMany({
    where: filters.length ? { AND: filters } : {},
    orderBy: { createdAt: 'desc' },
    include: { versions: { select: { versionId: true, versionNo: true, locked: true }, orderBy: { versionNo: 'desc' }, take: 1 } }
  });

  return surveys.map((s) => ({
    surveyId: s.surveyId,
    code: s.code,
    name: s.name,
    status: s.status,
    currentVersionId: s.currentVersionId,
    latestVersionNo: s.versions[0]?.versionNo ?? 1,
    locked: s.versions[0]?.locked ?? false
  }));
}

export async function createSection(input: CreateSectionInput, userId: string, ctx: Ctx) {
  const version = await prisma.surveyVersion.findUnique({ where: { versionId: input.versionId } });
  if (!version) throw new NotFoundError('SurveyVersion', input.versionId);
  if (version.locked) throw new BadRequestError('Survey version is locked');

  try {
    const section = await prisma.section.create({
      data: {
        versionId: input.versionId,
        code: input.code,
        title: input.title,
        ...(input.titleAm ? { titleAm: input.titleAm } : {}),
        ...(input.description ? { description: input.description } : {}),
        orderNo: input.orderNo,
        repeatable: input.repeatable,
        ...(input.repeatMin !== undefined ? { repeatMin: input.repeatMin } : {}),
        ...(input.repeatMax !== undefined ? { repeatMax: input.repeatMax } : {})
      }
    });

    await writeAudit({
      userId, entity: 'SECTION', entityId: section.sectionId, action: 'CREATE',
      newValue: { code: section.code, title: section.title },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return section;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Section code '${input.code}' already exists in this version`);
    }
    throw err;
  }
}

export async function createQuestion(input: CreateQuestionInput, userId: string, ctx: Ctx) {
  const section = await prisma.section.findUnique({
    where: { sectionId: input.sectionId },
    include: { version: true }
  });
  if (!section) throw new NotFoundError('Section', input.sectionId);
  if (section.version.locked) throw new BadRequestError('Survey version is locked');

  try {
    const question = await prisma.question.create({
      data: {
        sectionId: input.sectionId,
        code: input.code,
        type: input.type as QuestionType,
        text: input.text,
        ...(input.textAm ? { textAm: input.textAm } : {}),
        ...(input.hint ? { hint: input.hint } : {}),
        required: input.required,
        orderNo: input.orderNo,
        ...(input.indicatorId ? { indicatorId: input.indicatorId } : {}),
        ...(input.disaggregationKey ? { disaggregationKey: input.disaggregationKey } : {}),
        ...(input.calculation ? { calculation: input.calculation } : {}),
        ...(input.options && input.options.length > 0
          ? { options: { createMany: { data: input.options.map((o) => ({
              code: o.code, label: o.label,
              ...(o.labelAm ? { labelAm: o.labelAm } : {}),
              value: o.value, orderNo: o.orderNo
            })) } } }
          : {})
      },
      include: { options: true }
    });

    await writeAudit({
      userId, entity: 'QUESTION', entityId: question.questionId, action: 'CREATE',
      newValue: { code: question.code, type: question.type },
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
    });

    return question;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Question code '${input.code}' already exists in this section`);
    }
    throw err;
  }
}

export async function addSkipLogic(input: SkipLogicInput, userId: string, ctx: Ctx) {
  // Validate condition by attempting to parse it
  try {
    evaluateCondition(input.condition, {});
  } catch (err) {
    throw new BadRequestError(`Invalid condition: ${(err as Error).message}`);
  }

  const question = await prisma.question.findUnique({
    where: { questionId: input.questionId },
    include: { section: { include: { version: true } } }
  });
  if (!question) throw new NotFoundError('Question', input.questionId);
  if (question.section.version.locked) throw new BadRequestError('Survey version is locked');

  const logic = await prisma.skipLogic.create({
    data: {
      questionId: input.questionId,
      condition: input.condition,
      action: input.action,
      ...(input.targetQuestionId ? { targetQuestionId: input.targetQuestionId } : {})
    }
  });

  await writeAudit({
    userId, entity: 'SKIP_LOGIC', entityId: logic.logicId, action: 'CREATE',
    newValue: { questionId: input.questionId, condition: input.condition, action: input.action },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return logic;
}

export async function publishSurvey(surveyId: string, userId: string, ctx: Ctx) {
  const survey = await prisma.survey.findUnique({
    where: { surveyId },
    include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } }
  });
  if (!survey) throw new NotFoundError('Survey', surveyId);

  const latest = survey.versions[0];
  if (!latest) throw new BadRequestError('Survey has no versions');
  if (latest.locked) throw new ConflictError('Survey version is already locked');

  const updated = await prisma.surveyVersion.update({
    where: { versionId: latest.versionId },
    data: {
      publishedAt: new Date(),
      publishedById: userId,
      locked: true,
      lockedAt: new Date()
    }
  });

  await prisma.survey.update({
    where: { surveyId },
    data: { status: 'PUBLISHED', currentVersionId: latest.versionId }
  });

  await writeAudit({
    userId, entity: 'SURVEY_VERSION', entityId: latest.versionId, action: 'APPROVE',
    newValue: { surveyId, versionNo: latest.versionNo, locked: true },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return updated;
}

export async function assignSurvey(input: AssignSurveyInput, userId: string, ctx: Ctx) {
  const [wave, version] = await Promise.all([
    prisma.wave.findUnique({ where: { waveId: input.waveId } }),
    prisma.surveyVersion.findUnique({ where: { versionId: input.surveyVersionId } })
  ]);
  if (!wave) throw new NotFoundError('Wave', input.waveId);
  if (!version) throw new NotFoundError('SurveyVersion', input.surveyVersionId);
  if (!version.locked) throw new BadRequestError('Survey version must be published/locked before assigning');

  const assignments = await Promise.all(
    input.collectorIds.map((collectorId) =>
      prisma.assignment.create({
        data: {
          waveId: input.waveId,
          surveyVersionId: input.surveyVersionId,
          collectorId,
          ...(input.supervisorId ? { supervisorId: input.supervisorId } : {}),
          ...(input.region ? { region: input.region } : {}),
          ...(input.woreda ? { woreda: input.woreda } : {}),
          targetCount: input.targetCount,
          status: 'ASSIGNED',
          ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {})
        }
      })
    )
  );

  await writeAudit({
    userId, entity: 'ASSIGNMENT', entityId: input.waveId, action: 'CREATE',
    newValue: { waveId: input.waveId, collectors: input.collectorIds.length },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return assignments;
}