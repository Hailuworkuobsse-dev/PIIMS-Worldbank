import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { storage } from '@/config/storage.js';
import { buildReportKey } from '@/lib/file-naming.js';
import { writeAudit } from '@/lib/audit.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors.js';
import { anonymize, toCsv, DEFAULT_ANON_CONFIG, type RawRecord, type AnonymizationConfig } from './anonymize.js';
import type { AnonymizeInput, BuildWaveDatasetInput, DataRequestInput } from './warehouse.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

/* ════════════════════════════════════════════════════════════════════
 * BUILD WAVE DATASET (panel linking)
 * ════════════════════════════════════════════════════════════════════ */

export async function buildWaveDataset(
  input: BuildWaveDatasetInput,
  userId: string,
  ctx: Ctx
): Promise<{ datasetId: string; recordCount: number; status: string }> {
  const wave = await prisma.wave.findUnique({ where: { waveId: input.waveId } });
  if (!wave) throw new NotFoundError('Wave', input.waveId);

  const latestVersion = await prisma.waveDataset.findFirst({
    where: { waveId: input.waveId },
    orderBy: { version: 'desc' }
  });
  const version = (latestVersion?.version ?? 0) + 1;

  // Build dataset from QA-cleared submissions
  const submissions = await prisma.submission.findMany({
    where: { waveId: input.waveId, status: 'QA_CLEARED' },
    include: {
      answers: { include: { question: { select: { code: true, indicatorId: true } } } },
      panel: true
    }
  });

  const records: RawRecord[] = submissions.map((s) => {
    const record: RawRecord = {
      submissionId: s.submissionId,
      panelId: s.panelId ?? `UNLINKED-${s.submissionId}`
    };
    for (const a of s.answers) {
      const key = a.question.code;
      record[key] = a.valueText ?? (a.valueNumeric != null ? Number(a.valueNumeric) : null);
    }
    return record;
  });

  const dataset = await prisma.waveDataset.create({
    data: {
      waveId: input.waveId,
      version,
      recordCount: records.length,
      status: 'READY',
      buildCompletedAt: new Date(),
      storagePath: buildReportKey(`wave-${input.waveId}-v${version}`, 'CSV')
    }
  });

  // Store raw dataset in S3
  const csv = toCsv(records);
  await storage.upload(dataset.storagePath!, Buffer.from(csv, 'utf-8'), {
    contentType: 'text/csv'
  });

  await writeAudit({
    userId, entity: 'WAVE_DATASET', entityId: dataset.datasetId, action: 'CREATE',
    newValue: { waveId: input.waveId, version, recordCount: records.length },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return { datasetId: dataset.datasetId, recordCount: records.length, status: 'READY' };
}

/* ════════════════════════════════════════════════════════════════════
 * LIST DATASETS + PANEL LINKS
 * ════════════════════════════════════════════════════════════════════ */

export async function listWaveDatasets() {
  const rows = await prisma.waveDataset.findMany({
    include: { wave: { select: { code: true, name: true } } },
    orderBy: { buildStartedAt: 'desc' }
  });
  return rows.map((d) => ({
    datasetId: d.datasetId,
    waveId: d.waveId,
    waveCode: d.wave.code,
    waveName: d.wave.name,
    version: d.version,
    recordCount: d.recordCount,
    buildStartedAt: d.buildStartedAt.toISOString(),
    buildCompletedAt: d.buildCompletedAt?.toISOString() ?? null,
    status: d.status
  }));
}

export async function listPanelLinks(waveId?: string) {
  const where: Prisma.PanelMemberWhereInput = waveId ? { enrolledWaveId: waveId } : {};
  const rows = await prisma.panelMember.findMany({
    where,
    include: { treatmentGroup: { select: { name: true } }, submissions: { select: { waveId: true } } },
    orderBy: { enrolledAt: 'asc' },
    take: 500
  });

  return rows.map((p) => ({
    panelId: p.panelId,
    treatmentGroupId: p.treatmentGroupId,
    treatmentGroupName: p.treatmentGroup.name,
    wavesPresent: Array.from(new Set(p.submissions.map((s) => s.waveId))),
    status: p.status,
    attritionReason: p.attritionReason
  }));
}

/* ════════════════════════════════════════════════════════════════════
 * ANONYMIZE
 * ════════════════════════════════════════════════════════════════════ */

export async function anonymizeWave(
  input: AnonymizeInput,
  userId: string,
  ctx: Ctx
): Promise<{ datasetId: string; recordCount: number }> {
  const wave = await prisma.wave.findUnique({ where: { waveId: input.waveId } });
  if (!wave) throw new NotFoundError('Wave', input.waveId);

  // Load latest wave dataset
  const waveDataset = await prisma.waveDataset.findFirst({
    where: { waveId: input.waveId },
    orderBy: { version: 'desc' }
  });
  if (!waveDataset || !waveDataset.storagePath) {
    throw new BadRequestError('No wave dataset built yet — build one first');
  }

  // Load raw data from S3
  const rawBuffer = await storage.download(waveDataset.storagePath);
  const lines = rawBuffer.toString('utf-8').trim().split(/\r?\n/);
  if (lines.length < 2) throw new BadRequestError('Wave dataset is empty');

  const headers = lines[0]!.split(',');
  const records: RawRecord[] = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: RawRecord = {};
    headers.forEach((h, i) => { record[h] = values[i] ?? null; });
    return record as RawRecord;
  });

  const config: AnonymizationConfig = {
    ...DEFAULT_ANON_CONFIG,
    ...input.config
  };

  const anonymized = anonymize(records, config);
  const csv = toCsv(anonymized);

  // Save anonymized dataset
  const version = (await prisma.researchDataset.count({
    where: { waveId: input.waveId, anonymizationLevel: config.level }
  })) + 1;

  const dataset = await prisma.researchDataset.create({
    data: {
      waveId: input.waveId,
      projectId: wave.projectId,
      anonymizationLevel: config.level,
      version,
      formats: ['CSV'],
      recordCount: anonymized.length,
      status: 'DRAFT',
      codebookRef: buildReportKey(`codebook-${input.waveId}-v${version}`, 'XML')
    }
  });

  // Store in S3
  const key = buildReportKey(`anonymized-${input.waveId}-${config.level}-v${version}`, 'CSV');
  await storage.upload(key, Buffer.from(csv, 'utf-8'), { contentType: 'text/csv' });

  // Codebook
  const codebook = JSON.stringify({
    datasetId: dataset.datasetId,
    level: config.level,
    recordCount: anonymized.length,
    columns: Object.keys(anonymized[0] ?? {}).map((k) => ({ name: k, type: 'string' }))
  }, null, 2);
  await storage.upload(dataset.codebookRef!, Buffer.from(codebook, 'utf-8'), { contentType: 'application/json' });

  await writeAudit({
    userId, entity: 'RESEARCH_DATASET', entityId: dataset.datasetId, action: 'CREATE',
    newValue: { waveId: input.waveId, level: config.level, recordCount: anonymized.length },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return { datasetId: dataset.datasetId, recordCount: anonymized.length };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') inQuotes = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

/* ════════════════════════════════════════════════════════════════════
 * RESEARCH CATALOGUE + DUA
 * ════════════════════════════════════════════════════════════════════ */

export async function listResearchDatasets() {
  const rows = await prisma.researchDataset.findMany({
    where: { status: 'PUBLISHED' },
    include: { wave: { select: { code: true, name: true } } },
    orderBy: { releasedAt: 'desc' }
  });
  return rows.map((d) => ({
    datasetId: d.datasetId,
    waveId: d.waveId,
    waveCode: d.wave.code,
    waveName: d.wave.name,
    anonymizationLevel: d.anonymizationLevel,
    version: d.version,
    formats: Array.isArray(d.formats) ? (d.formats as string[]) : ['CSV'],
    recordCount: d.recordCount,
    releasedAt: d.releasedAt?.toISOString() ?? null,
    codebookRef: d.codebookRef,
    status: d.status
  }));
}

export async function releaseDataset(datasetId: string, userId: string, ctx: Ctx) {
  const dataset = await prisma.researchDataset.findUnique({ where: { datasetId } });
  if (!dataset) throw new NotFoundError('ResearchDataset', datasetId);
  if (dataset.status === 'PUBLISHED') throw new ConflictError('Dataset is already published');

  const updated = await prisma.researchDataset.update({
    where: { datasetId },
    data: { status: 'PUBLISHED', releasedAt: new Date() }
  });

  await writeAudit({
    userId, entity: 'RESEARCH_DATASET', entityId: datasetId, action: 'APPROVE',
    newValue: { status: 'PUBLISHED', releasedAt: updated.releasedAt?.toISOString() },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return { datasetId, status: 'PUBLISHED' };
}

export async function createDataRequest(
  datasetId: string,
  input: DataRequestInput,
  userId: string,
  ctx: Ctx
) {
  const dataset = await prisma.researchDataset.findUnique({ where: { datasetId } });
  if (!dataset) throw new NotFoundError('ResearchDataset', datasetId);
  if (dataset.status !== 'PUBLISHED') throw new BadRequestError('Dataset is not yet published');

  const request = await prisma.dataRequest.create({
    data: {
      datasetId,
      researcherName: input.researcherName,
      researcherEmail: input.researcherEmail,
      institution: input.institution,
      purpose: input.purpose,
      status: 'SUBMITTED',
      requesterId: userId
    }
  });

  await writeAudit({
    userId, entity: 'DATA_REQUEST', entityId: request.requestId, action: 'CREATE',
    newValue: { datasetId, researcher: input.researcherEmail },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return request;
}

export async function listDataRequests() {
  const rows = await prisma.dataRequest.findMany({
    include: { dataset: { select: { datasetId: true, waveId: true, anonymizationLevel: true } } },
    orderBy: { submittedAt: 'desc' }
  });
  return rows.map((r) => ({
    requestId: r.requestId,
    datasetId: r.datasetId,
    datasetLevel: r.dataset.anonymizationLevel,
    researcherName: r.researcherName,
    researcherEmail: r.researcherEmail,
    institution: r.institution,
    purpose: r.purpose,
    status: r.status,
    submittedAt: r.submittedAt.toISOString(),
    approvedAt: r.approvedAt?.toISOString() ?? null,
    accessExpiresAt: r.accessExpiresAt?.toISOString() ?? null
  }));
}

export async function approveRequest(requestId: string, userId: string, ctx: Ctx) {
  const request = await prisma.dataRequest.findUnique({ where: { requestId } });
  if (!request) throw new NotFoundError('DataRequest', requestId);
  if (request.status === 'APPROVED') throw new ConflictError('Request already approved');

  const updated = await prisma.dataRequest.update({
    where: { requestId },
    data: {
      status: 'APPROVED',
      approvedById: userId,
      approvedAt: new Date(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000)
    }
  });

  await writeAudit({
    userId, entity: 'DATA_REQUEST', entityId: requestId, action: 'APPROVE',
    newValue: { status: 'APPROVED' },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return { requestId, status: 'APPROVED', accessExpiresAt: updated.accessExpiresAt?.toISOString() };
}

export async function downloadResearchDataset(
  datasetId: string,
  userId: string
): Promise<{ url: string; expiresAt: string }> {
  const dataset = await prisma.researchDataset.findUnique({ where: { datasetId } });
  if (!dataset) throw new NotFoundError('ResearchDataset', datasetId);

  // Require approved request
  const approvedRequest = await prisma.dataRequest.findFirst({
    where: {
      datasetId,
      requesterId: userId,
      status: 'APPROVED',
      accessExpiresAt: { gt: new Date() }
    }
  });
  if (!approvedRequest) {
    throw new ForbiddenError('You need an approved data request to download this dataset');
  }

  // Reconstruct S3 key from dataset
  const key = buildReportKey(`anonymized-${dataset.waveId}-${dataset.anonymizationLevel}-v${dataset.version}`, 'CSV');
  const url = await storage.signedUrl(key, 900);
  return { url, expiresAt: new Date(Date.now() + 900 * 1000).toISOString() };
}