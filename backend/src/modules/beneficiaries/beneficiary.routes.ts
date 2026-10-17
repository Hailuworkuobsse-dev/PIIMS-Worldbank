import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  registerBeneficiarySchema, dedupCheckSchema, listBeneficiariesQuerySchema,
  verifyBeneficiarySchema, mergeBeneficiarySchema,
  createDeliverySchema, listDeliveriesQuerySchema, verifyDeliverySchema
} from './beneficiary.schemas.js';
import {
  listHandler, getHandler, dedupHandler, registerHandler, verifyHandler,
  mergeHandler, listDeliveriesHandler, createDeliveryHandler, verifyDeliveryHandler
} from './beneficiary.controller.js';

export const beneficiariesRouter: Router = Router();
beneficiariesRouter.use(requireAuth);

beneficiariesRouter.get('/', requirePermission('beneficiary:read'),
  validate({ query: listBeneficiariesQuerySchema }), listHandler);
beneficiariesRouter.get('/:id', requirePermission('beneficiary:read'), getHandler);
beneficiariesRouter.post('/dedupe-check', requirePermission('beneficiary:read'),
  validate({ body: dedupCheckSchema }), dedupHandler);
beneficiariesRouter.post('/', requirePermission('beneficiary:write'),
  validate({ body: registerBeneficiarySchema }), registerHandler);
beneficiariesRouter.post('/:id/verify', requirePermission('beneficiary:verify'),
  validate({ body: verifyBeneficiarySchema }), verifyHandler);
beneficiariesRouter.post('/:id/merge', requirePermission('beneficiary:write'),
  validate({ body: mergeBeneficiarySchema }), mergeHandler);

export const serviceDeliveriesRouter: Router = Router();
serviceDeliveriesRouter.use(requireAuth);

serviceDeliveriesRouter.get('/', requirePermission('service:read'),
  validate({ query: listDeliveriesQuerySchema }), listDeliveriesHandler);
serviceDeliveriesRouter.post('/', requirePermission('service:write'),
  validate({ body: createDeliverySchema }), createDeliveryHandler);
serviceDeliveriesRouter.post('/:id/verify', requirePermission('service:write'),
  validate({ body: verifyDeliverySchema }), verifyDeliveryHandler);