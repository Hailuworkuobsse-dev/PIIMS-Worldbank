import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import { z } from 'zod';
import { anonymizeSchema, buildWaveDatasetSchema, dataRequestSchema } from './warehouse.schemas.js';
import * as service from './warehouse.service.js';

function getCtx(req: any) {
  return { ipAddress: req.ip ?? null, userAgent: req.header('user-agent') ?? null, correlationId: req.res?.locals?.correlationId ?? null };
}
function getUser(req: any) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export const warehouseRouter: Router = Router();
warehouseRouter.use(requireAuth);

warehouseRouter.get('/wave-datasets', requirePermission('warehouse:read'), async (_req, res, next) => {
  try { sendSuccess(res, await service.listWaveDatasets()); } catch (err) { next(err); }
});

warehouseRouter.post('/wave-datasets/build', requirePermission('warehouse:manage'),
  validate({ body: buildWaveDatasetSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.buildWaveDataset(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

warehouseRouter.get('/panel-links', requirePermission('warehouse:read'), async (req, res, next) => {
  try {
    const waveId = typeof req.query.wave_id === 'string' ? req.query.wave_id : undefined;
    sendSuccess(res, await service.listPanelLinks(waveId));
  } catch (err) { next(err); }
});

warehouseRouter.post('/anonymize', requirePermission('warehouse:anonymize'),
  validate({ body: anonymizeSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.anonymizeWave(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

/* ─── Research endpoints ─────────────────────────────────────── */
export const researchRouter: Router = Router();
researchRouter.use(requireAuth);

const datasetIdParam = z.object({ id: z.string().uuid() });

researchRouter.get('/datasets', requirePermission('warehouse:read'), async (_req, res, next) => {
  try { sendSuccess(res, await service.listResearchDatasets()); } catch (err) { next(err); }
});

researchRouter.post('/datasets/:id/release', requirePermission('warehouse:release'),
  validate({ params: datasetIdParam }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.releaseDataset(req.params.id, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

researchRouter.post('/datasets/:id/request', requirePermission('research:request'),
  validate({ params: datasetIdParam, body: dataRequestSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createDataRequest(req.params.id, req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

researchRouter.post('/datasets/:id/download', requirePermission('research:download'),
  validate({ params: datasetIdParam }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.downloadResearchDataset(req.params.id, user.userId));
  } catch (err) { next(err); }
});

researchRouter.get('/requests', requirePermission('warehouse:read'), async (_req, res, next) => {
  try { sendSuccess(res, await service.listDataRequests()); } catch (err) { next(err); }
});

researchRouter.post('/requests/:id/approve', requirePermission('warehouse:release'), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.approveRequest(req.params.id, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});