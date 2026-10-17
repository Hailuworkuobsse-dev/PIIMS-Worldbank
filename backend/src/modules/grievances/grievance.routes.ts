import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  createGrievanceSchema, listGrievancesQuerySchema,
  assignSchema, resolveSchema, escalateSchema, statsQuerySchema
} from './grievance.schemas.js';
import {
  listHandler, getHandler, createHandler, assignHandler,
  resolveHandler, escalateHandler, actionsHandler, statsHandler
} from './grievance.controller.js';

export const grievancesRouter: Router = Router();
grievancesRouter.use(requireAuth);

grievancesRouter.get('/stats', requirePermission('grievance:read'),
  validate({ query: statsQuerySchema }), statsHandler);
grievancesRouter.get('/', requirePermission('grievance:read'),
  validate({ query: listGrievancesQuerySchema }), listHandler);
grievancesRouter.get('/:id', requirePermission('grievance:read'), getHandler);
grievancesRouter.get('/:id/actions', requirePermission('grievance:read'), actionsHandler);
grievancesRouter.post('/', requirePermission('grievance:write'),
  validate({ body: createGrievanceSchema }), createHandler);
grievancesRouter.post('/:id/assign', requirePermission('grievance:write'),
  validate({ body: assignSchema }), assignHandler);
grievancesRouter.post('/:id/resolve', requirePermission('grievance:resolve'),
  validate({ body: resolveSchema }), resolveHandler);
grievancesRouter.post('/:id/escalate', requirePermission('grievance:escalate'),
  validate({ body: escalateSchema }), escalateHandler);