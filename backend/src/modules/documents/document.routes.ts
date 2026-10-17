import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { uploadSingle } from '@/lib/upload.js';
import { uploadDocumentSchema, listDocumentsQuerySchema } from './document.schemas.js';
import {
  listHandler, getHandler, uploadHandler, versionsHandler, restoreHandler, downloadHandler
} from './document.controller.js';

export const documentsRouter: Router = Router();

documentsRouter.use(requireAuth);

documentsRouter.get(
  '/',
  requirePermission('doc:read'),
  validate({ query: listDocumentsQuerySchema }),
  listHandler
);

documentsRouter.get('/:id', requirePermission('doc:read'), getHandler);
documentsRouter.get('/:id/versions', requirePermission('doc:read'), versionsHandler);
documentsRouter.get('/:id/download', requirePermission('doc:read'), downloadHandler);

documentsRouter.post(
  '/',
  requirePermission('doc:write'),
  uploadSingle,
  validate({ body: uploadDocumentSchema }),
  uploadHandler
);

documentsRouter.post(
  '/:id/restore',
  requirePermission('doc:write'),
  restoreHandler
);