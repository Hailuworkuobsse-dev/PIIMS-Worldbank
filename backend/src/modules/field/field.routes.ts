import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import { submitInterviewSchema } from './field.schemas.js';
import * as service from './field.service.js';

function getCtx(req: any) {
  return { ipAddress: req.ip ?? null, userAgent: req.header('user-agent') ?? null, correlationId: req.res?.locals?.correlationId ?? null };
}
function getUser(req: any) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export const fieldRouter: Router = Router();
fieldRouter.use(requireAuth);

fieldRouter.get('/assignments', requirePermission('collect:execute'), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.listMyAssignments(user.userId));
  } catch (err) { next(err); }
});

fieldRouter.get('/assignments/:id/survey', requirePermission('collect:execute'), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.getAssignmentSurvey(req.params.id, user.userId));
  } catch (err) { next(err); }
});

fieldRouter.post('/submit', requirePermission('collect:execute'), validate({ body: submitInterviewSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.submitInterview(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});