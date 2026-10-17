import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { uploadSingle } from '@/lib/upload.js';
import { updateProfileSchema, submitDeliverySchema, uploadInvoiceSchema } from './supplier.schemas.js';
import {
  getProfileHandler, updateProfileHandler, listContractsHandler,
  listDeliveriesHandler, submitDeliveryHandler, listInvoicesHandler,
  uploadInvoiceHandler, listWarrantiesHandler, listPaymentsHandler, dashboardHandler
} from './supplier.controller.js';

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
}).single('photo');

export const supplierRouter: Router = Router();
supplierRouter.use(requireAuth);

supplierRouter.get('/me', requirePermission('supplier:self:read'), getProfileHandler);
supplierRouter.put('/me', requirePermission('supplier:self:write'), validate({ body: updateProfileSchema }), updateProfileHandler);

supplierRouter.get('/dashboard', requirePermission('supplier:self:read'), dashboardHandler);
supplierRouter.get('/contracts', requirePermission('supplier:self:read'), listContractsHandler);
supplierRouter.get('/deliveries', requirePermission('supplier:self:read'), listDeliveriesHandler);
supplierRouter.post(
  '/deliveries',
  requirePermission('supplier:self:read'),
  photoUpload,
  validate({ body: submitDeliverySchema }),
  submitDeliveryHandler
);
supplierRouter.get('/invoices', requirePermission('supplier:self:read'), listInvoicesHandler);
supplierRouter.post(
  '/invoices',
  requirePermission('supplier:self:write'),
  uploadSingle,
  validate({ body: uploadInvoiceSchema }),
  uploadInvoiceHandler
);
supplierRouter.get('/warranties', requirePermission('supplier:self:read'), listWarrantiesHandler);
supplierRouter.get('/payments', requirePermission('supplier:self:read'), listPaymentsHandler);