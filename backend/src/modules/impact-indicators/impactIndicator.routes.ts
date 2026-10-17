import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { UnauthorizedError, NotFoundError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import { createDomainSchema, createImpactIndicatorSchema, waveAssignmentSchema, listIndicatorsQuerySchema } from './impactIndicator.schemas.js';
import * as service from './impactIndicator.service.js';

function getCtx(req: any) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.header('user-agent') ?? null,
    correlationId: req.res?.locals?.correlationId ?? null
  };
}
function getUser(req: any) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export const impactIndicatorsRouter: Router = Router();
impactIndicatorsRouter.use(requireAuth);

/* ─── Domains ─────────────────────────────────────────────────── */
impactIndicatorsRouter.get('/domains', requirePermission('impact:indicator:read'), async (req, res, next) => {
  try { sendSuccess(res, await service.listDomains()); } catch (err) { next(err); }
});

impactIndicatorsRouter.post('/domains', requirePermission('impact:design'),
  validate({ body: createDomainSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createDomain(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

/* ─── Indicators ──────────────────────────────────────────────── */
impactIndicatorsRouter.get('/', requirePermission('impact:indicator:read'),
  validate({ query: listIndicatorsQuerySchema }), async (req, res, next) => {
  try {
    const query = (res.locals.query ?? req.query) as any;
    sendSuccess(res, await service.listIndicators(query));
  } catch (err) { next(err); }
});

impactIndicatorsRouter.get('/:id', requirePermission('impact:indicator:read'), async (req, res, next) => {
  try { sendSuccess(res, await service.getIndicator(req.params.id)); } catch (err) { next(err); }
});

impactIndicatorsRouter.post('/', requirePermission('impact:design'),
  validate({ body: createImpactIndicatorSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createIndicator(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

impactIndicatorsRouter.post('/:id/waves', requirePermission('impact:design'),
  validate({ body: waveAssignmentSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.assignToWave(req.params.id, req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

impactIndicatorsRouter.patch('/:id/status', requirePermission('impact:design'), async (req, res, next) => {
  try {
    const user = getUser(req);
    const { status } = req.body as { status: 'ACTIVE' | 'DEPRECATED' };
    sendSuccess(res, await service.updateIndicatorStatus(req.params.id, status, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

/* ─── Waves (nested under projects via separate router) ───────── */
export const wavesRouter: Router = Router();
wavesRouter.use(requireAuth);

wavesRouter.get('/:projectId/waves', requirePermission('impact:indicator:read'), async (req, res, next) => {
  try { sendSuccess(res, await service.listWaves(req.params.projectId)); } catch (err) { next(err); }
});

wavesRouter.post('/:projectId/waves', requirePermission('impact:design'), async (req, res, next) => {
  try {
    const user = getUser(req);
    const body = req.body as { code: string; name: string; waveType: string; plannedStart?: string; plannedEnd?: string };
    if (!body.code || !body.name || !body.waveType) throw new NotFoundError('Wave fields required');
    sendCreated(res, await service.createWave(req.params.projectId, body, user.scope, user.orgId, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});