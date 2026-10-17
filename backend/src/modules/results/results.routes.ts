import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  createComponentSchema, updateComponentSchema,
  createSubcomponentSchema, updateSubcomponentSchema,
  createIndicatorSchema, updateIndicatorSchema,
  listIndicatorsQuerySchema, recordValueSchema, aggregateQuerySchema
} from './results.schemas.js';
import {
  listComponentsHandler, createComponentHandler, updateComponentHandler,
  listSubcomponentsHandler, createSubcomponentHandler, updateSubcomponentHandler,
  listIndicatorsHandler, getIndicatorHandler, createIndicatorHandler, updateIndicatorHandler,
  listValuesHandler, recordValueHandler, aggregateHandler, logframeHandler
} from './results.controller.js';

/* ─── Nested under /projects ─────────────────────────────────────── */
export const projectResultsRouter: Router = Router();
projectResultsRouter.use(requireAuth);

projectResultsRouter.get(
  '/:projectId/components',
  requirePermission('result:read'),
  listComponentsHandler
);
projectResultsRouter.post(
  '/:projectId/components',
  requirePermission('result:write'),
  validate({ body: createComponentSchema }),
  createComponentHandler
);
projectResultsRouter.get(
  '/:projectId/logframe/export',
  requirePermission('report:generate'),
  logframeHandler
);

/* ─── Mounted at /components ─────────────────────────────────────── */
export const componentsRouter: Router = Router();
componentsRouter.use(requireAuth);

componentsRouter.get(
  '/:componentId/subcomponents',
  requirePermission('result:read'),
  listSubcomponentsHandler
);
componentsRouter.post(
  '/:componentId/subcomponents',
  requirePermission('result:write'),
  validate({ body: createSubcomponentSchema }),
  createSubcomponentHandler
);
componentsRouter.patch(
  '/:id',
  requirePermission('result:write'),
  validate({ body: updateComponentSchema }),
  updateComponentHandler
);

/* ─── Mounted at /subcomponents ──────────────────────────────────── */
export const subcomponentsRouter: Router = Router();
subcomponentsRouter.use(requireAuth);

subcomponentsRouter.patch(
  '/:id',
  requirePermission('result:write'),
  validate({ body: updateSubcomponentSchema }),
  updateSubcomponentHandler
);

/* ─── Mounted at /indicators ─────────────────────────────────────── */
export const indicatorsRouter: Router = Router();
indicatorsRouter.use(requireAuth);

indicatorsRouter.get(
  '/',
  requirePermission('result:read'),
  validate({ query: listIndicatorsQuerySchema }),
  listIndicatorsHandler
);
indicatorsRouter.get('/:id', requirePermission('result:read'), getIndicatorHandler);
indicatorsRouter.post(
  '/',
  requirePermission('result:write'),
  validate({ body: createIndicatorSchema }),
  createIndicatorHandler
);
indicatorsRouter.patch(
  '/:id',
  requirePermission('result:write'),
  validate({ body: updateIndicatorSchema }),
  updateIndicatorHandler
);
indicatorsRouter.get(
  '/:id/values',
  requirePermission('result:read'),
  listValuesHandler
);
indicatorsRouter.post(
  '/:id/values',
  requirePermission('result:write'),
  validate({ body: recordValueSchema }),
  recordValueHandler
);

/* ─── Mounted at /results ────────────────────────────────────────── */
export const resultsRouter: Router = Router();
resultsRouter.use(requireAuth);

resultsRouter.get(
  '/aggregate',
  requirePermission('result:aggregate'),
  validate({ query: aggregateQuerySchema }),
  aggregateHandler
);