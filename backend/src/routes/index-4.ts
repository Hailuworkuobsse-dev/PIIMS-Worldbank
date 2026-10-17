import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from '@/modules/auth/auth.routes.js';
import { projectsRouter } from '@/modules/projects/project.routes.js';
import { documentsRouter } from '@/modules/documents/document.routes.js';
import { inceptionRouter, projectInceptionRouter } from '@/modules/inception/inception.routes.js';
import { reportsRouter } from '@/modules/reports/report.routes.js';
import { adminRouter } from '@/modules/admin/admin.routes.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { listAuditQuerySchema } from '@/modules/admin/admin.schemas.js';
import { listAuditHandler } from '@/modules/admin/admin.audit.controller.js';
import { sendSuccess } from '@/lib/response.js';

export const apiRouter: Router = Router();

apiRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'PIIMS API',
    version: '2.0.0',
    description: 'Project Inception Information Management System — World Bank / MoWE Ethiopia'
  });
});

/* ─── Auth (M1) ─────────────────────────────────────────────────── */
apiRouter.use('/auth', authRouter);

/* ─── Projects (M2) ─────────────────────────────────────────────── */
apiRouter.use('/projects', projectsRouter);

/* ─── Pipeline ──────────────────────────────────────────────────── */
apiRouter.get('/pipeline', requireAuth, requirePermission('project:read'), async (req, res, next) => {
  try {
    const { getPipelineCounts } = await import('@/modules/projects/project.service.js');
    sendSuccess(res, await getPipelineCounts(req.user!.scope, req.user!.orgId, req.user!.userId));
  } catch (err) { next(err); }
});

/* ─── Documents (M10) ───────────────────────────────────────────── */
apiRouter.use('/documents', documentsRouter);

/* ─── Inception (M3) ────────────────────────────────────────────── */
apiRouter.use('/inception-reports', inceptionRouter);
apiRouter.use('/', projectInceptionRouter);   // /projects/:projectId/inception/versions

/* ─── Reports (M11) ─────────────────────────────────────────────── */
apiRouter.use('/reports', reportsRouter);

/* ─── Admin (M16) ───────────────────────────────────────────────── */
apiRouter.use('/admin', adminRouter);

/* ─── Audit (M1/M16) ────────────────────────────────────────────── */
apiRouter.get(
  '/audit',
  requireAuth,
  requirePermission('audit:read'),
  validate({ query: listAuditQuerySchema }),
  listAuditHandler
);

export { healthRouter };