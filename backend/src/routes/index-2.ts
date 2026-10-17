import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from '@/modules/auth/auth.routes.js';
import { sendSuccess } from '@/lib/response.js';

export const apiRouter: Router = Router();

apiRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    name: 'PIIMS API',
    version: '2.0.0',
    description:
      'Project Inception Information Management System — World Bank / MoWE Ethiopia',
    documentation: 'https://api.piims.gov.et/docs'
  });
});

/* ─── Auth (M1) ─────────────────────────────────────────────── */
apiRouter.use('/auth', authRouter);

/* ─── Feature modules (Steps 4–9) ──────────────────────────── */
// import { projectsRouter } from '@/modules/projects/project.routes.js';
// apiRouter.use('/projects', projectsRouter);
// ...

export { healthRouter };