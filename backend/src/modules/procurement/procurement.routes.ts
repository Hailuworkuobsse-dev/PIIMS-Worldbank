import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import {
  createProcurementSchema, updateProcurementSchema, listProcurementQuerySchema,
  createContractSchema, updateContractSchema, listContractsQuerySchema,
  delaysQuerySchema
} from './procurement.schemas.js';
import {
  listProcurementHandler, createProcurementHandler, updateProcurementHandler,
  listContractsHandler, createContractHandler, updateContractHandler,
  delaysHandler, supplierPerformanceHandler
} from './procurement.controller.js';

/* ─── Mounted at /procurement ────────────────────────────────────── */
export const procurementRouter: Router = Router();
procurementRouter.use(requireAuth);

procurementRouter.get(
  '/',
  requirePermission('procurement:read'),
  validate({ query: listProcurementQuerySchema }),
  listProcurementHandler
);
procurementRouter.post(
  '/',
  requirePermission('procurement:write'),
  validate({ body: createProcurementSchema }),
  createProcurementHandler
);
procurementRouter.patch(
  '/:id',
  requirePermission('procurement:write'),
  validate({ body: updateProcurementSchema }),
  updateProcurementHandler
);
procurementRouter.get(
  '/delays',
  requirePermission('procurement:read'),
  validate({ query: delaysQuerySchema }),
  delaysHandler
);

/* ─── Mounted at /contracts ──────────────────────────────────────── */
export const contractsRouter: Router = Router();
contractsRouter.use(requireAuth);

contractsRouter.get(
  '/',
  requirePermission('contract:read'),
  validate({ query: listContractsQuerySchema }),
  listContractsHandler
);
contractsRouter.post(
  '/',
  requirePermission('contract:write'),
  validate({ body: createContractSchema }),
  createContractHandler
);
contractsRouter.patch(
  '/:id',
  requirePermission('contract:write'),
  validate({ body: updateContractSchema }),
  updateContractHandler
);

/* ─── Mounted at /suppliers ──────────────────────────────────────── */
export const suppliersRouter: Router = Router();
suppliersRouter.use(requireAuth);

suppliersRouter.get(
  '/:supplierId/performance',
  requirePermission('procurement:read'),
  supplierPerformanceHandler
);