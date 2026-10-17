import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from '@/modules/auth/auth.routes.js';
import { projectsRouter } from '@/modules/projects/project.routes.js';
import { documentsRouter } from '@/modules/documents/document.routes.js';
import { inceptionRouter, projectInceptionRouter } from '@/modules/inception/inception.routes.js';
import { reportsRouter } from '@/modules/reports/report.routes.js';
import {
  projectResultsRouter, componentsRouter, subcomponentsRouter,
  indicatorsRouter, resultsRouter
} from '@/modules/results/results.routes.js';
import {
  budgetsRouter, disbursementsRouter, financeRouter
} from '@/modules/financial/financial.routes.js';
import {
  procurementRouter, contractsRouter, suppliersRouter
} from '@/modules/procurement/procurement.routes.js';
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
apiRouter.use('/projects', projectInceptionRouter);   // /projects/:id/inception/versions
apiRouter.use('/projects', projectResultsRouter);     // /projects/:id/components, /logframe

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

/* ─── Results (M4) ──────────────────────────────────────────────── */
apiRouter.use('/components', componentsRouter);
apiRouter.use('/subcomponents', subcomponentsRouter);
apiRouter.use('/indicators', indicatorsRouter);
apiRouter.use('/results', resultsRouter);

/* ─── Financial (M5) ────────────────────────────────────────────── */
apiRouter.use('/budgets', budgetsRouter);
apiRouter.use('/disbursements', disbursementsRouter);
apiRouter.use('/finance', financeRouter);

/* ─── Procurement (M6) ──────────────────────────────────────────── */
apiRouter.use('/procurement', procurementRouter);
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/suppliers', suppliersRouter);

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