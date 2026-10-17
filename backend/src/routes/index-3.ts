import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from '@/modules/auth/auth.routes.js';
import { projectsRouter } from '@/modules/projects/project.routes.js';
import { adminRouter } from '@/modules/admin/admin.routes.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { listAuditQuerySchema } from '@/modules/admin/admin.schemas.js';
import { listAuditHandler } from '@/modules/admin/admin.audit.controller.js';
import { sendSuccess } from '@/lib/response.js';

export const apiRouter: Router = Router();

/** Root info */
apiRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'PIIMS API',
    version: '2.0.0',
    description:
      'Project Inception Information Management System — World Bank / MoWE Ethiopia',
    documentation: 'https://api.piims.gov.et/docs'
  });
});

/* ─── Auth (M1) ─────────────────────────────────────────────────── */
apiRouter.use('/auth', authRouter);

/* ─── Projects (M2) — router handles both /projects and /pipeline ── */
apiRouter.use('/projects', projectsRouter);

/**
 * Pipeline is a top-level route in the spec:
 *   GET /v1/pipeline  →  counts by status
 */
apiRouter.get(
  '/pipeline',
  requireAuth,
  requirePermission('project:read'),
  async (req, res, next) => {
    try {
      // Reuse the project service directly
      const { getPipelineCounts } = await import('@/modules/projects/project.service.js');
      const counts = await getPipelineCounts(req.user!.scope, req.user!.orgId, req.user!.userId);
      sendSuccess(res, counts);
    } catch (err) { next(err); }
  }
);

/* ─── Admin (M16) ───────────────────────────────────────────────── */
apiRouter.use('/admin', adminRouter);

/* ─── Audit log (M1/M16) — top-level endpoint per API spec ──────── */
apiRouter.get(
  '/audit',
  requireAuth,
  requirePermission('audit:read'),
  validate({ query: listAuditQuerySchema }),
  listAuditHandler
);

/* ─── Feature modules (Steps 5–9) ──────────────────────────────── */
// apiRouter.use('/inception-reports', inceptionRouter);
// apiRouter.use('/indicators', indicatorsRouter);
// ...

export { healthRouter };