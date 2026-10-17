import { Router } from 'express';
import { healthRouter } from './health.js';
import { sendSuccess } from '@/lib/response.js';

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

// Health endpoints available at root (no /v1 prefix)
export { healthRouter };

/**
 * ─── MODULE ROUTERS ───
 * Uncomment each line as modules are delivered in Steps 3–9:
 */
// import { authRouter } from '@/modules/auth/auth.routes.js';
// apiRouter.use('/auth', authRouter);
// import { projectsRouter } from '@/modules/projects/project.routes.js';
// apiRouter.use('/projects', projectsRouter);
// ... (23 modules total — added in Steps 4–9)