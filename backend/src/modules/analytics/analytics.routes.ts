import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { sendSuccess } from '@/lib/response.js';
import { z } from 'zod';
import * as service from './analytics.service.js';

const dashboardQuerySchema = z.object({ project_id: z.string().uuid('project_id required') });

const didSchema = z.object({
  projectId: z.string().uuid(),
  indicatorId: z.string().uuid(),
  treatmentGroupId: z.string().uuid(),
  controlGroupId: z.string().uuid(),
  baselineWaveCode: z.string().min(1),
  endlineWaveCode: z.string().min(1)
});

const waveComparisonQuerySchema = z.object({
  project_id: z.string().uuid(),
  indicator_id: z.string().uuid()
});

export const analyticsRouter: Router = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get('/dashboard', requirePermission('impact:analytics:read'),
  validate({ query: dashboardQuerySchema }), async (req, res, next) => {
  try {
    const query = (res.locals.query ?? req.query) as { project_id: string };
    sendSuccess(res, await service.getImpactDashboard(query.project_id));
  } catch (err) { next(err); }
});

analyticsRouter.post('/analysis/did', requirePermission('impact:analytics:run'),
  validate({ body: didSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof didSchema>;
    sendSuccess(res, await service.computeProjectDiD(
      body.projectId, body.indicatorId,
      body.treatmentGroupId, body.controlGroupId,
      body.baselineWaveCode, body.endlineWaveCode
    ));
  } catch (err) { next(err); }
});

analyticsRouter.get('/analysis/wave-comparison', requirePermission('impact:analytics:read'),
  validate({ query: waveComparisonQuerySchema }), async (req, res, next) => {
  try {
    const query = (res.locals.query ?? req.query) as { project_id: string; indicator_id: string };
    sendSuccess(res, await service.getWaveComparison(query.project_id, query.indicator_id));
  } catch (err) { next(err); }
});