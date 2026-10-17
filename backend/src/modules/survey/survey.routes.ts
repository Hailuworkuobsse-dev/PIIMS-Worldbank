import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated } from '@/lib/response.js';
import { z } from 'zod';
import {
  createSurveySchema, createSectionSchema, createQuestionSchema,
  skipLogicSchema, assignSurveySchema
} from './survey.schemas.js';
import * as service from './survey.service.js';

function getCtx(req: any) {
  return { ipAddress: req.ip ?? null, userAgent: req.header('user-agent') ?? null, correlationId: req.res?.locals?.correlationId ?? null };
}
function getUser(req: any) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

const listSurveysQuerySchema = z.object({ q: z.string().optional(), status: z.string().optional() });

export const surveysRouter: Router = Router();
surveysRouter.use(requireAuth);

surveysRouter.get('/', requirePermission('survey:read'), validate({ query: listSurveysQuerySchema }), async (req, res, next) => {
  try { sendSuccess(res, await service.listSurveys((res.locals.query ?? req.query) as any)); }
  catch (err) { next(err); }
});

surveysRouter.get('/:id', requirePermission('survey:read'), async (req, res, next) => {
  try { sendSuccess(res, await service.getSurvey(req.params.id)); } catch (err) { next(err); }
});

surveysRouter.post('/', requirePermission('survey:write'), validate({ body: createSurveySchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createSurvey(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

surveysRouter.post('/sections', requirePermission('survey:write'), validate({ body: createSectionSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createSection(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

surveysRouter.post('/questions', requirePermission('survey:write'), validate({ body: createQuestionSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.createQuestion(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

surveysRouter.post('/skip-logic', requirePermission('survey:write'), validate({ body: skipLogicSchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.addSkipLogic(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

surveysRouter.post('/:id/publish', requirePermission('survey:publish'), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.publishSurvey(req.params.id, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});

surveysRouter.post('/assign', requirePermission('survey:assign'), validate({ body: assignSurveySchema }), async (req, res, next) => {
  try {
    const user = getUser(req);
    sendCreated(res, await service.assignSurvey(req.body, user.userId, getCtx(req)));
  } catch (err) { next(err); }
});