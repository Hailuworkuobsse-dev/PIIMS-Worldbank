import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import {
  createQaRuleSchema, reviewFlagSchema, backCheckSchema,
  listFlagsQuerySchema, statsQuerySchema
} from './qa.schemas.js';
import * as service from './qa.service.js';

function getCtx(req: any) {
  return { ipAddress: req.ip ?? null, userAgent: req.header('user-agent') ?? null, correlationId: req.res?.locals?.correlationId ?? null };
}
function getUser(req: any) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export const qaRouter: Router = Router();
qaRouter.use(requireAuth);

qaRouter.get('/flags', requirePermission('qa:read'), validate({ query: listFlagsQuerySchema }), async (req, res, next) => {
  try { sendSuccess(res, await service.listFlags((res.locals.query ?? req.query) as any)); }
  catch (err) { next(err); }
});

qaRouter.post('/flags/:id/review', requirePermission('qa:review'), validate({ body: reviewFlagSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.reviewFlag(req.params.id, req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

qaRouter.post('/back-checks', requirePermission('qa:backcheck'), validate({ body: backCheckSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createBackCheck(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

qaRouter.get('/scorecards', requirePermission('qa:read'), async (req, res, next) => {
  try {
    const waveId = typeof req.query.wave_id === 'string' ? req.query.wave_id : undefined;
    sendSuccess(res, await service.listScorecards(waveId));
  } catch (err) { next(err); }
});

qaRouter.post('/scorecards/compute', requirePermission('qa:rules'), async (req, res, next) => {
  try {
    const { waveId } = req.body as { waveId: string };
    if (!waveId) throw new UnauthorizedError();
    sendSuccess(res, { computed: await service.computeScorecards(waveId) });
  } catch (err) { next(err); }
});

qaRouter.get('/stats', requirePermission('qa:read'), validate({ query: statsQuerySchema }), async (req, res, next) => {
  try {
    const query = (res.locals.query ?? req.query) as { wave_id?: string };
    sendSuccess(res, await service.getStats(query.wave_id));
  } catch (err) { next(err); }
});

qaRouter.get('/rules', requirePermission('qa:read'), async (_req, res, next) => {
  try { sendSuccess(res, await service.listRules()); } catch (err) { next(err); }
});

qaRouter.post('/rules', requirePermission('qa:rules'), validate({ body: createQaRuleSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createRule(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

qaRouter.patch('/rules/:id', requirePermission('qa:rules'), async (req, res, next) => {
  try {
    const user = getUser(req);
    const { active } = req.body as { active: boolean };
    sendSuccess(res, await service.toggleRule(req.params.id, active, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});