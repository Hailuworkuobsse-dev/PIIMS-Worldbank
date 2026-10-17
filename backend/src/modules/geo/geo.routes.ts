import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { markersQuerySchema, geoVerifySchema } from './geo.schemas.js';
import { beneficiaryMarkersHandler, interventionsHandler, verifyHandler } from './geo.controller.js';

export const geoRouter: Router = Router();
geoRouter.use(requireAuth);

geoRouter.get('/beneficiaries', requirePermission('geo:read'),
  validate({ query: markersQuerySchema }), beneficiaryMarkersHandler);
geoRouter.get('/interventions', requirePermission('geo:read'),
  validate({ query: markersQuerySchema }), interventionsHandler);
geoRouter.post('/verify', requirePermission('geo:read'),
  validate({ body: geoVerifySchema }), verifyHandler);