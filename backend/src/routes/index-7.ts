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
import { budgetsRouter, disbursementsRouter, financeRouter } from '@/modules/financial/financial.routes.js';
import { procurementRouter, contractsRouter, suppliersRouter } from '@/modules/procurement/procurement.routes.js';
import { supplierRouter } from '@/modules/supplier/supplier.routes.js';
import { beneficiariesRouter, serviceDeliveriesRouter } from '@/modules/beneficiaries/beneficiary.routes.js';
import { geoRouter } from '@/modules/geo/geo.routes.js';
import { grievancesRouter } from '@/modules/grievances/grievance.routes.js';
import { impactIndicatorsRouter, wavesRouter } from '@/modules/impact-indicators/impactIndicator.routes.js';
import { surveysRouter } from '@/modules/survey/survey.routes.js';
import { fieldRouter } from '@/modules/field/field.routes.js';
import { qaRouter } from '@/modules/qa/qa.routes.js';
import { warehouseRouter, researchRouter } from '@/modules/warehouse/warehouse.routes.js';
import { analyticsRouter } from '@/modules/analytics/analytics.routes.js';
import { adminRouter } from '@/modules/admin/admin.routes.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { listAuditQuerySchema } from '@/modules/admin/admin.schemas.js';
import { listAuditHandler } from '@/modules/admin/admin.audit.controller.js';
import { sendSuccess } from '@/lib/response.js';

export const apiRouter: Router = Router();

apiRouter.get('/', (_req, res) => {
  sendSuccess(res, { name: 'PIIMS API', version: '2.0.0', description: 'Project Inception Information Management System — World Bank / MoWE Ethiopia' });
});

/* ─── Core ──────────────────────────────────────────────────────── */
apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/projects', projectInceptionRouter);
apiRouter.use('/projects', projectResultsRouter);
apiRouter.use('/projects', wavesRouter);        // /projects/:id/waves

apiRouter.get('/pipeline', requireAuth, requirePermission('project:read'), async (req, res, next) => {
  try {
    const { getPipelineCounts } = await import('@/modules/projects/project.service.js');
    sendSuccess(res, await getPipelineCounts(req.user!.scope, req.user!.orgId, req.user!.userId));
  } catch (err) { next(err); }
});

apiRouter.use('/documents', documentsRouter);
apiRouter.use('/inception-reports', inceptionRouter);
apiRouter.use('/components', componentsRouter);
apiRouter.use('/subcomponents', subcomponentsRouter);
apiRouter.use('/indicators', indicatorsRouter);
apiRouter.use('/results', resultsRouter);
apiRouter.use('/budgets', budgetsRouter);
apiRouter.use('/disbursements', disbursementsRouter);
apiRouter.use('/finance', financeRouter);
apiRouter.use('/procurement', procurementRouter);
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/suppliers', suppliersRouter);
apiRouter.use('/supplier', supplierRouter);
apiRouter.use('/beneficiaries', beneficiariesRouter);
apiRouter.use('/service-deliveries', serviceDeliveriesRouter);
apiRouter.use('/geo', geoRouter);
apiRouter.use('/grievances', grievancesRouter);

/* ─── Impact Suite ──────────────────────────────────────────────── */
apiRouter.use('/impact-indicators', impactIndicatorsRouter);
apiRouter.use('/surveys', surveysRouter);
apiRouter.use('/collect', fieldRouter);
apiRouter.use('/qa', qaRouter);
apiRouter.use('/warehouse', warehouseRouter);
apiRouter.use('/research', researchRouter);
apiRouter.use('/impact', analyticsRouter);

/* ─── Reporting + Admin ─────────────────────────────────────────── */
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/admin', adminRouter);

apiRouter.get('/audit', requireAuth, requirePermission('audit:read'),
  validate({ query: listAuditQuerySchema }), listAuditHandler);

export { healthRouter };