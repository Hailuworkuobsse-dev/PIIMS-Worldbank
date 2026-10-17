import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { uploadSingle } from '@/lib/upload.js';
import {
  submitInceptionSchema, reviewDecisionSchema, noObjectionSchema,
  addCommentSchema, listReportsQuerySchema
} from './inception.schemas.js';
import {
  listHandler, getHandler, templatesHandler, submitHandler,
  reviewHandler, noObjectionHandler, commentsListHandler,
  commentCreateHandler, commentResolveHandler, versionsHandler, downloadHandler
} from './inception.controller.js';

export const inceptionRouter: Router = Router();

inceptionRouter.use(requireAuth);

/* ─── Templates (must be before /:id) ─────────────────────────── */
inceptionRouter.get('/templates', requirePermission('inception:read'), templatesHandler);

/* ─── List ──────────────────────────────────────────────────────── */
inceptionRouter.get(
  '/',
  requirePermission('inception:read'),
  validate({ query: listReportsQuerySchema }),
  listHandler
);

/* ─── Submit ───────────────────────────────────────────────────── */
inceptionRouter.post(
  '/',
  requirePermission('inception:submit'),
  uploadSingle,
  validate({ body: submitInceptionSchema }),
  submitHandler
);

/* ─── Get by ID ────────────────────────────────────────────────── */
inceptionRouter.get('/:id', requirePermission('inception:read'), getHandler);

/* ─── Review ───────────────────────────────────────────────────── */
inceptionRouter.post(
  '/:id/review',
  requirePermission('inception:review'),
  validate({ body: reviewDecisionSchema }),
  reviewHandler
);

/* ─── No-objection ─────────────────────────────────────────────── */
inceptionRouter.post(
  '/:id/no-objection',
  requirePermission('inception:approve'),
  validate({ body: noObjectionSchema }),
  noObjectionHandler
);

/* ─── Comments ─────────────────────────────────────────────────── */
inceptionRouter.get('/:id/comments', requirePermission('inception:read'), commentsListHandler);
inceptionRouter.post(
  '/:id/comments',
  requirePermission('inception:review'),
  validate({ body: addCommentSchema }),
  commentCreateHandler
);
inceptionRouter.post(
  '/:id/comments/:commentId/resolve',
  requirePermission('inception:review'),
  commentResolveHandler
);

/* ─── Download ─────────────────────────────────────────────────── */
inceptionRouter.get('/:id/download', requirePermission('inception:read'), downloadHandler);

/* ─── Project versions (separate router path) ──────────────────── */
export const projectInceptionRouter: Router = Router();
projectInceptionRouter.use(requireAuth);
projectInceptionRouter.get(
  '/:projectId/inception/versions',
  requirePermission('inception:read'),
  versionsHandler
);