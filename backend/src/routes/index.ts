import { Router, type NextFunction, type Request, type Response } from 'express';
import { healthRouter } from './health.js';
import { sendSuccess } from '@/lib/response.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';

/* Module routers */
import { authRouter } from '@/modules/auth/auth.routes.js';
import { projectsRouter } from '@/modules/projects/project.routes.js';
import {
  inceptionRouter,
  projectInceptionRouter,
} from '@/modules/inception/inception.routes.js';
import {
  componentsRouter,
  subcomponentsRouter,
  indicatorsRouter,
  resultsRouter,
  projectResultsRouter,
} from '@/modules/results/results.routes.js';
import {
  budgetsRouter,
  disbursementsRouter,
  financeRouter,
} from '@/modules/financial/financial.routes.js';
import {
  procurementRouter,
  contractsRouter,
  suppliersRouter,
} from '@/modules/procurement/procurement.routes.js';
import { supplierRouter } from '@/modules/supplier/supplier.routes.js';
import {
  beneficiariesRouter,
  serviceDeliveriesRouter,
} from '@/modules/beneficiaries/beneficiary.routes.js';
import { geoRouter } from '@/modules/geo/geo.routes.js';
import { documentsRouter } from '@/modules/documents/document.routes.js';
import { reportsRouter } from '@/modules/reports/report.routes.js';
import { grievancesRouter } from '@/modules/grievances/grievance.routes.js';
import { notificationsRouter } from '@/modules/notifications/notification.routes.js';
import { integrationsRouter } from '@/modules/integrations/integration.routes.js';
import { webhooksRouter } from '@/modules/integrations/webhooks.routes.js';
import { adminRouter } from '@/modules/admin/admin.routes.js';
import { listAuditHandler } from '@/modules/admin/admin.audit.controller.js';
import { listAuditQuerySchema } from '@/modules/admin/admin.schemas.js';
import {
  impactIndicatorsRouter,
  wavesRouter,
} from '@/modules/impact-indicators/impactIndicator.routes.js';
import { analyticsRouter } from '@/modules/analytics/analytics.routes.js';
import { surveysRouter } from '@/modules/survey/survey.routes.js';
import { fieldRouter } from '@/modules/field/field.routes.js';
import { qaRouter } from '@/modules/qa/qa.routes.js';
import {
  warehouseRouter,
  researchRouter,
} from '@/modules/warehouse/warehouse.routes.js';

export const apiRouter: Router = Router();

/** Root API info endpoint */
apiRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'PIIMS API',
    version: '2.0.0',
    description:
      'Project Inception Information Management System — World Bank / MoWE Ethiopia',
    documentation: 'https://api.piims.gov.et/docs',
    modules: [
      'M1 Identity & Access', 'M2 Project Registry', 'M3 Inception Reports',
      'M4 Results Framework', 'M5 Financial & Budget', 'M6 Procurement & Contracts',
      'M7 Supplier Portal', 'M8 Beneficiary & Service Delivery', 'M9 GIS',
      'M10 Documents', 'M11 Reporting', 'M12 Dashboard', 'M13 Grievance',
      'M14 Notifications', 'M15 Integrations', 'M16 Admin',
      'M17 Mobile/Offline', 'M18 Impact Indicators', 'M19 Survey Builder',
      'M20 Field Collection', 'M21 QA', 'M22 Warehouse & Research', 'M23 Impact Analytics'
    ]
  });
});

/* ─── M1 Identity & Access ─────────────────────────────────────── */
apiRouter.use('/auth', authRouter);

/* ─── M2 Project Registry ──────────────────────────────────────── */
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/projects', projectInceptionRouter); // /projects/:id/inception/versions
apiRouter.use('/projects', projectResultsRouter);   // /projects/:id/components, /logframe
// Frontend calls GET /pipeline (projectsRouter exposes it at /pipeline internally)
apiRouter.get('/pipeline', remount(projectsRouter, '/pipeline'));

/* ─── M3 Inception ─────────────────────────────────────────────── */
apiRouter.use('/inception-reports', inceptionRouter);
apiRouter.use('/inception', inceptionRouter); // /inception/templates etc.

/* ─── M4 Results Framework ─────────────────────────────────────── */
apiRouter.use('/components', componentsRouter);
apiRouter.use('/subcomponents', subcomponentsRouter);
apiRouter.use('/indicators', indicatorsRouter);
apiRouter.use('/results', resultsRouter);

/* ─── M5 Financial & Budget ────────────────────────────────────── */
apiRouter.use('/budgets', budgetsRouter);
apiRouter.use('/disbursements', disbursementsRouter);
apiRouter.use('/finance', financeRouter);

/* ─── M6 Procurement & Contracts ───────────────────────────────── */
apiRouter.use('/procurement', procurementRouter);
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/suppliers', suppliersRouter);

/* ─── M7 Supplier Portal ───────────────────────────────────────── */
apiRouter.use('/supplier', supplierRouter);

/* ─── M8 Beneficiaries & Service Delivery ──────────────────────── */
apiRouter.use('/beneficiaries', beneficiariesRouter);
apiRouter.use('/service-deliveries', serviceDeliveriesRouter);

/* ─── M9 GIS ───────────────────────────────────────────────────── */
apiRouter.use('/geo', geoRouter);

/* ─── M10 Documents ────────────────────────────────────────────── */
apiRouter.use('/documents', documentsRouter);

/* ─── M11 Reporting ────────────────────────────────────────────── */
apiRouter.use('/reports', reportsRouter);

/* ─── M13 Grievance ────────────────────────────────────────────── */
apiRouter.use('/grievances', grievancesRouter);

/* ─── M14 Notifications ────────────────────────────────────────── */
apiRouter.use('/notifications', notificationsRouter);

/* ─── M15 Integrations ─────────────────────────────────────────── */
apiRouter.use('/admin/integrations', integrationsRouter);
apiRouter.use('/webhooks', webhooksRouter);

/* ─── M16 Admin & Audit ────────────────────────────────────────── */
apiRouter.use('/admin', adminRouter);
apiRouter.get(
  '/audit',
  requireAuth,
  requirePermission('audit:read'),
  validate({ query: listAuditQuerySchema }),
  listAuditHandler
);

/* ─── M18 Impact Indicators ────────────────────────────────────── */
apiRouter.use('/impact-indicators', impactIndicatorsRouter);
apiRouter.use('/projects', wavesRouter); // /projects/:projectId/waves

/* ─── M23 Impact Analytics ─────────────────────────────────────── */
apiRouter.use('/impact', analyticsRouter);

/* ─── M19 Survey Builder ───────────────────────────────────────── */
apiRouter.use('/surveys', surveysRouter);

/* ─── M20 Field Collection ─────────────────────────────────────── */
apiRouter.use('/collect', fieldRouter);

/* ─── M21 QA ───────────────────────────────────────────────────── */
apiRouter.use('/qa', qaRouter);

/* ─── M22 Warehouse & Research ─────────────────────────────────── */
apiRouter.use('/warehouse', warehouseRouter);
apiRouter.use('/research', researchRouter);
// Frontend posts anonymize runs to /research/datasets/anonymize
apiRouter.post(
  '/research/datasets/anonymize',
  remount(warehouseRouter, '/anonymize')
);

/* Health endpoints available at root (no /v1 prefix) */
export { healthRouter };

/**
 * Serve a single internal router path under a different top-level alias
 * (rewrites req.url then delegates), avoiding over-exposing the router.
 */
function remount(router: Router, internalPath: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.url = internalPath + (req.url === '/' ? '' : req.url);
    router(req, res, next);
  };
}
