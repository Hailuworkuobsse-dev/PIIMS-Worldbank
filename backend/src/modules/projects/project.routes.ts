import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  createProjectSchema, updateProjectSchema,
  stageAdvanceSchema, listProjectsQuerySchema
} from './project.schemas.js';
import {
  listHandler, getHandler, createHandler, updateHandler,
  deleteHandler, advanceHandler, pipelineHandler
} from './project.controller.js';

export const projectsRouter: Router = Router();

/* ─── Global middleware for this module ────────────────────────── */
projectsRouter.use(requireAuth);

/* ─── Pipeline ─────────────────────────────────────────────────── */
projectsRouter.get('/pipeline', requirePermission('project:read'), pipelineHandler);

/* ─── List ─────────────────────────────────────────────────────── */
projectsRouter.get(
  '/',
  requirePermission('project:read'),
  validate({ query: listProjectsQuerySchema }),
  listHandler
);

/* ─── Create ───────────────────────────────────────────────────── */
projectsRouter.post(
  '/',
  requirePermission('project:write'),
  validate({ body: createProjectSchema }),
  createHandler
);

/* ─── Get by ID or code ────────────────────────────────────────── */
projectsRouter.get(
  '/:idOrCode',
  requirePermission('project:read'),
  getHandler
);

/* ─── Update ───────────────────────────────────────────────────── */
projectsRouter.put(
  '/:id',
  requirePermission('project:write'),
  validate({ body: updateProjectSchema }),
  updateHandler
);

/* ─── Delete (soft) ────────────────────────────────────────────── */
projectsRouter.delete(
  '/:id',
  requirePermission('project:delete'),
  deleteHandler
);

/* ─── Advance stage ────────────────────────────────────────────── */
projectsRouter.post(
  '/:id/advance',
  requirePermission('project:approve'),
  validate({ body: stageAdvanceSchema }),
  advanceHandler
);