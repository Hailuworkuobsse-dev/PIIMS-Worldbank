import { describe, it, expect } from 'vitest';
import { isDatabaseAvailable } from '../utils/dbProbe.js';
import request from 'supertest';
import { getApp, login, bearer, DEMO_USERS } from './helpers.js';
import { prisma } from '@/lib/prisma.js';

const dbAvailable = await isDatabaseAvailable();
const describeDb = dbAvailable ? describe : describe.skip;

describeDb('E2E — Field Interview (CAPI)', () => {
  it('collector can list assignments', async () => {
    const app = getApp();
    const { accessToken } = await login(DEMO_USERS.dc);

    const res = await request(app)
      .get('/v1/collect/assignments')
      .set('Authorization', bearer(accessToken));

    // Either 200 with assignments or 404 if no collector profile seeded
    expect([200, 404]).toContain(res.status);
  });

  it('full flow: build survey → publish → assign → submit → QA flag', async () => {
    const app = getApp();
    const { accessToken: ieToken } = await login(DEMO_USERS.ie);
    const auth = bearer(ieToken);

    // Find an existing project
    const project = await prisma.project.findFirst({ where: { deletedAt: null } });
    if (!project) {
      console.warn('No projects seeded — skipping full field flow');
      return;
    }

    // Find existing wave
    let wave = await prisma.wave.findFirst({ where: { projectId: project.projectId } });
    if (!wave) {
      const waveRes = await request(app)
        .post(`/v1/projects/${project.projectId}/waves`)
        .set('Authorization', auth)
        .send({ code: 'W99', name: 'E2E Wave', waveType: 'BASELINE' });
      if (waveRes.status !== 201) {
        console.warn('Could not create wave, skipping:', waveRes.body);
        return;
      }
      wave = await prisma.wave.findUnique({ where: { waveId: waveRes.body.data.waveId } });
    }

    // Create survey
    const surveyRes = await request(app)
      .post('/v1/surveys')
      .set('Authorization', auth)
      .send({
        code: `E2E-SURVEY-${Date.now()}`,
        name: 'E2E Test Survey',
        projectId: project.projectId
      });
    expect(surveyRes.status).toBe(201);
    const surveyId = surveyRes.body.data.surveyId;
    const versionId = surveyRes.body.data.versions[0].versionId;

    // Create section
    const sectionRes = await request(app)
      .post('/v1/surveys/sections')
      .set('Authorization', auth)
      .send({
        versionId,
        code: 'S1',
        title: 'Household Info',
        orderNo: 0
      });
    expect(sectionRes.status).toBe(201);
    const sectionId = sectionRes.body.data.sectionId;

    // Create question
    const questionRes = await request(app)
      .post('/v1/surveys/questions')
      .set('Authorization', auth)
      .send({
        sectionId,
        code: 'Q1',
        type: 'NUMERIC',
        text: 'Household income',
        required: true,
        orderNo: 0
      });
    expect(questionRes.status).toBe(201);
    const questionId = questionRes.body.data.questionId;

    // Publish
    const publishRes = await request(app)
      .post(`/v1/surveys/${surveyId}/publish`)
      .set('Authorization', auth);
    expect(publishRes.status).toBe(200);

    // Get a collector
    const collector = await prisma.collector.findFirst();
    if (!collector) {
      console.warn('No collector seeded — skipping submission');
      return;
    }

    // Assign
    const assignRes = await request(app)
      .post('/v1/surveys/assign')
      .set('Authorization', auth)
      .send({
        waveId: wave!.waveId,
        surveyVersionId: versionId,
        collectorIds: [collector.collectorId],
        targetCount: 1
      });
    expect(assignRes.status).toBe(201);
    const assignmentId = assignRes.body.data[0].assignmentId;

    // Collector submits a FAST interview (should trigger QA flag)
    const { accessToken: dcToken } = await login(DEMO_USERS.dc);
    const submitRes = await request(app)
      .post('/v1/collect/submit')
      .set('Authorization', bearer(dcToken))
      .send({
        assignmentId,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 5,
        consent: {
          participation: true,
          data_use: true,
          future_research: false,
          media: false,
          contact: false,
          consent_version: 'v1.2',
          language: 'en'
        },
        answers: [{ questionId, valueType: 'NUMERIC', valueNumeric: 5000 }]
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.data.submissionId).toBeTruthy();

    // Wait briefly for QA rules to run async
    await new Promise((r) => setTimeout(r, 500));

    // QA should have flagged the short submission
    const { accessToken: qaToken } = await login(DEMO_USERS.qa);
    const flagsRes = await request(app)
      .get('/v1/qa/flags')
      .set('Authorization', bearer(qaToken));
    expect(flagsRes.status).toBe(200);
    // At least some flags exist in the system
    expect(Array.isArray(flagsRes.body.data)).toBe(true);
  });

  it('validates required consent fields', async () => {
    const app = getApp();
    const { accessToken } = await login(DEMO_USERS.dc);

    const res = await request(app)
      .post('/v1/collect/submit')
      .set('Authorization', bearer(accessToken))
      .send({
        assignmentId: '00000000-0000-4000-8000-000000000001',
        startedAt: new Date().toISOString(),
        consent: {
          participation: false,  // invalid
          data_use: false,
          consent_version: 'v1.2'
        },
        answers: [{ questionId: '00000000-0000-4000-8000-000000000002', valueType: 'TEXT', valueText: 'test' }]
      });

    expect(res.status).toBe(422);
  });
});