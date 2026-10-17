import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  createBudgetSchema, listBudgetsQuerySchema,
  createDisbursementSchema, listDisbursementsQuerySchema,
  executionQuerySchema, fmisSyncSchema,
  costPerOutputQuerySchema, exceptionsQuerySchema
} from './financial.schemas.js';
import {
  listBudgetsHandler, createBudgetHandler,
  listDisbursementsHandler, createDisbursementHandler,
  executionHandler, triggerFmisSyncHandler, fmisRunsHandler,
  costPerOutputHandler, exceptionsHandler
} from './financial.controller.js';

/* ─── Mounted at /budgets ────────────────────────────────────────── */
export const budgetsRouter: Router = Router();
budgetsRouter.use(requireAuth);

budgetsRouter.get(
  '/',
  requirePermission('budget:read'),
  validate({ query: listBudgetsQuerySchema }),
  listBudgetsHandler
);
budgetsRouter.post(
  '/',
  requirePermission('budget:write'),
  validate({ body: createBudgetSchema }),
  createBudgetHandler
);

/* ─── Mounted at /disbursements ──────────────────────────────────── */
export const disbursementsRouter: Router = Router();
disbursementsRouter.use(requireAuth);

disbursementsRouter.get(
  '/',
  requirePermission('disbursement:read'),
  validate({ query: listDisbursementsQuerySchema }),
  listDisbursementsHandler
);
disbursementsRouter.post(
  '/',
  requirePermission('disbursement:write'),
  validate({ body: createDisbursementSchema }),
  createDisbursementHandler
);

/* ─── Mounted at /finance ────────────────────────────────────────── */
export const financeRouter: Router = Router();
financeRouter.use(requireAuth);

financeRouter.get(
  '/execution',
  requirePermission('budget:read'),
  validate({ query: executionQuerySchema }),
  executionHandler
);

financeRouter.post(
  '/sync-fmis',
  requirePermission('finance:reconcile'),
  validate({ body: fmisSyncSchema }),
  triggerFmisSyncHandler
);

financeRouter.get(
  '/fmis/runs',
  requirePermission('budget:read'),
  fmisRunsHandler
);

financeRouter.get(
  '/cost-per-output',
  requirePermission('budget:read'),
  validate({ query: costPerOutputQuerySchema }),
  costPerOutputHandler
);

financeRouter.get(
  '/exceptions',
  requirePermission('budget:read'),
  validate({ query: exceptionsQuerySchema }),
  exceptionsHandler
);