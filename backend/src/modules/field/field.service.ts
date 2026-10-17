import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { ConflictError, NotFoundError, BadRequestError } from '@/lib/errors.js';
import { runQaRules } from '@/modules/qa/qa.service.js';
import type { SubmitInterviewInput } from './field.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

export async function listMyAssignments(userId: string) {
  const collector = await prisma.collector.findUnique({ where: { userId } });
  if (!collector) throw new NotFoundError('Collector profile', userId);

  const assignments = await prisma.assignment.findMany({
    where: { collectorId: collector.collectorId },
    include: {
      wave: { select: { waveId: true, code: true, name: true, waveType: true, status: true } },
      surveyVersion: { include: { survey: { select: { surveyId: true, code: true, name: true } } } },
      supervisor: { include: { user: { select: { fullName: true } } } }
    },
    orderBy: { assignedAt: 'desc' }
  });

  return assignments.map((a) => ({
    assignmentId: a.assignmentId,
    wave: { waveId: a.wave.waveId, code: a.wave.code, name: a.wave.name, waveType: a.wave.waveType, status: a.wave.status },
    survey: { surveyId: a.surveyVersion.survey.surveyId, code: a.surveyVersion.survey.code, name: a.surveyVersion.survey.name, versionNo: a.surveyVersion.versionNo },
    surveyVersionId: a.surveyVersionId,
    region: a.region,
    woreda: a.woreda,
    targetCount: a.targetCount,
    completedCount: a.completedCount,
    status: a.status,
    assignedAt: a.assignedAt.toISOString(),
    dueDate: a.dueDate?.toISOString().slice(0, 10) ?? null,
    supervisorName: a.supervisor?.user.fullName ?? null
  }));
}

export async function getAssignmentSurvey(assignmentId: string, userId: string) {
  const collector = await prisma.collector.findUnique({ where: { userId } });
  if (!collector) throw new NotFoundError('Collector profile', userId);

  const assignment = await prisma.assignment.findFirst({
    where: { assignmentId, collectorId: collector.collectorId },
    include: {
      surveyVersion: {
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
        }
      }
    }
  });
  if (!assignment) throw new NotFoundError('Assignment', assignmentId);

  return {
    assignmentId: assignment.assignmentId,
    version: { versionId: assignment.surveyVersion.versionId, versionNo: assignment.surveyVersion.versionNo, locked: assignment.surveyVersion.locked },
    sections: assignment.surveyVersion.sections.map((s) => ({
      sectionId: s.sectionId,
      code: s.code,
      title: s.title,
      titleAm: s.titleAm,
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
  };
}

export async function submitInterview(
  input: SubmitInterviewInput,
  userId: string,
  ctx: Ctx
): Promise<{ submissionId: string; status: string; qaStatus: string }> {
  const collector = await prisma.collector.findUnique({ where: { userId } });
  if (!collector) throw new NotFoundError('Collector profile', userId);

  const assignment = await prisma.assignment.findFirst({
    where: { assignmentId: input.assignmentId, collectorId: collector.collectorId },
    include: { surveyVersion: { include: { survey: true } } }
  });
  if (!assignment) throw new NotFoundError('Assignment', input.assignmentId);

  // Idempotency via checksum
  if (input.checksum) {
    const existing = await prisma.submission.findFirst({
      where: { checksum: input.checksum, collectorId: collector.collectorId }
    });
    if (existing) {
      throw new ConflictError(`This submission has already been recorded (id: ${existing.submissionId})`);
    }
  }

  const projectId = assignment.surveyVersion.survey.projectId;
  if (!projectId) throw new BadRequestError('Survey is not linked to a project');

  const durationSeconds = input.durationSeconds ??
    (input.endedAt
      ? Math.round((new Date(input.endedAt).getTime() - new Date(input.startedAt).getTime()) / 1000)
      : undefined);

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      assignmentId: input.assignmentId,
      collectorId: collector.collectorId,
      ...(input.beneficiaryId ? { beneficiaryId: input.beneficiaryId } : {}),
      ...(input.panelId ? { panelId: input.panelId } : {}),
      waveId: assignment.waveId,
      surveyVersionId: assignment.surveyVersionId,
      projectId,
      startedAt: new Date(input.startedAt),
      ...(input.endedAt ? { endedAt: new Date(input.endedAt) } : {}),
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      ...(input.gpsStart ? { gpsStartLat: input.gpsStart.lat, gpsStartLon: input.gpsStart.lon } : {}),
      ...(input.gpsEnd ? { gpsEndLat: input.gpsEnd.lat, gpsEndLon: input.gpsEnd.lon } : {}),
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
      consentGiven: input.consent.participation && input.consent.data_use,
      consentVersion: input.consent.consent_version,
      consentTypes: input.consent as unknown as Prisma.InputJsonValue,
      status: 'SYNCED',
      qaStatus: 'PENDING',
      syncedAt: new Date(),
      ...(input.checksum ? { checksum: input.checksum } : {})
    }
  });

  // Create answers
  const answerData: Prisma.SubmissionAnswerCreateManyInput[] = input.answers.map((a) => ({
    submissionId: submission.submissionId,
    questionId: a.questionId,
    ...(a.valueText !== undefined ? { valueText: a.valueText } : {}),
    ...(a.valueNumeric !== undefined ? { valueNumeric: new Prisma.Decimal(a.valueNumeric) } : {}),
    ...(a.valueDate ? { valueDate: new Date(a.valueDate) } : {}),
    ...(a.valueJson ? { valueJson: a.valueJson as Prisma.InputJsonValue } : {}),
    ...(a.valueGps ? { valueGpsLat: a.valueGps.lat, valueGpsLon: a.valueGps.lon } : {}),
    answerType: a.valueType as any,
    answeredAt: new Date()
  }));

  if (answerData.length > 0) {
    await prisma.submissionAnswer.createMany({ data: answerData });
  }

  // Paradata
  if (input.paradata.length > 0) {
    await prisma.paradata.createMany({
      data: input.paradata.map((p) => ({
        submissionId: submission.submissionId,
        ...(p.questionId ? { questionId: p.questionId } : {}),
        timeSpentMs: p.timeSpentMs,
        editCount: p.editCount,
        interrupted: p.interrupted
      }))
    });
  }

  // Consents
  const consents = [
    { type: 'PARTICIPATION', given: input.consent.participation },
    { type: 'DATA_USE', given: input.consent.data_use },
    { type: 'FUTURE_RESEARCH', given: input.consent.future_research },
    { type: 'MEDIA', given: input.consent.media },
    { type: 'CONTACT', given: input.consent.contact }
  ];
  await prisma.consent.createMany({
    data: consents.map((c) => ({
      submissionId: submission.submissionId,
      ...(input.beneficiaryId ? { beneficiaryId: input.beneficiaryId } : {}),
      consentType: c.type as any,
      consentGiven: c.given,
      consentVersion: input.consent.consent_version,
      consentText: `Consent v${input.consent.consent_version}`,
      language: input.consent.language,
      givenAt: new Date()
    }))
  });

  // Update assignment progress
  await prisma.assignment.update({
    where: { assignmentId: input.assignmentId },
    data: {
      completedCount: { increment: 1 },
      status: assignment.completedCount + 1 >= assignment.targetCount ? 'COMPLETED' : 'IN_PROGRESS'
    }
  });

  await writeAudit({
    userId, entity: 'SUBMISSION', entityId: submission.submissionId, action: 'CREATE',
    newValue: { assignmentId: input.assignmentId, answers: input.answers.length, waveId: assignment.waveId },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  // Run QA rules asynchronously (don't block the response)
  runQaRules(submission.submissionId).catch((err) => {
    console.error('[qa] rule evaluation failed for', submission.submissionId, err);
  });

  return {
    submissionId: submission.submissionId,
    status: submission.status,
    qaStatus: submission.qaStatus
  };
}