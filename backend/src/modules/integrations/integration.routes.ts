import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { syncTriggerSchema, runsQuerySchema } from './integration.schemas.js';
import { statusHandler, metadataHandler, triggerHandler, runsHandler } from './integration.controller.js';

export const integrationsRouter: Router = Router();
integrationsRouter.use(requireAuth);

integrationsRouter.get('/status', requirePermission('integration:read'), statusHandler);
integrationsRouter.get('/metadata', requirePermission('integration:read'), metadataHandler);
integrationsRouter.get('/runs', requirePermission('integration:read'),
  validate({ query: runsQuerySchema }), runsHandler);
integrationsRouter.get('/:code/runs', requirePermission('integration:read'),
  validate({ query: runsQuerySchema }), runsHandler);
integrationsRouter.post('/sync', requirePermission('integration:manage'),
  validate({ body: syncTriggerSchema }), triggerHandler);