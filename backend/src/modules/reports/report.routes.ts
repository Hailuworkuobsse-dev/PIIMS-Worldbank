import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  generateReportSchema, scheduleReportSchema, listInstancesQuerySchema
} from './report.schemas.js';
import {
  catalogueHandler, generateHandler, listInstancesHandler, getInstanceHandler,
  downloadHandler, wbExportHandler, listSchedulesHandler,
  createScheduleHandler, deleteScheduleHandler
} from './report.controller.js';

export const reportsRouter: Router = Router();

reportsRouter.use(requireAuth);

/* ─── Catalogue ───────────────────────────────────────────────── */
reportsRouter.get('/catalogue', requirePermission('report:read'), catalogueHandler);

/* ─── Generate ────────────────────────────────────────────────── */
reportsRouter.post(
  '/generate',
  requirePermission('report:generate'),
  validate({ body: generateReportSchema }),
  generateHandler
);

/* ─── Instances ───────────────────────────────────────────────── */
reportsRouter.get(
  '/instances',
  requirePermission('report:read'),
  validate({ query: listInstancesQuerySchema }),
  listInstancesHandler
);
reportsRouter.get('/instances/:id', requirePermission('report:read'), getInstanceHandler);
reportsRouter.get('/instances/:id/download', requirePermission('report:read'), downloadHandler);

/* ─── WB export ───────────────────────────────────────────────── */
reportsRouter.get('/export/wb', requirePermission('report:wb-export'), wbExportHandler);

/* ─── Schedules ───────────────────────────────────────────────── */
reportsRouter.get('/schedules', requirePermission('report:schedule'), listSchedulesHandler);
reportsRouter.post(
  '/schedules',
  requirePermission('report:schedule'),
  validate({ body: scheduleReportSchema }),
  createScheduleHandler
);
reportsRouter.delete('/schedules/:id', requirePermission('report:schedule'), deleteScheduleHandler);