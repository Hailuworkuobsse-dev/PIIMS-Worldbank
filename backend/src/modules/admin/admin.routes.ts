import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission, requireMfa } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { prisma } from '@/lib/prisma.js';
import { sendSuccess } from '@/lib/response.js';
import {
  listUsersQuerySchema, createUserSchema, updateUserSchema,
  listMasterDataQuerySchema, createMasterDataSchema, updateMasterDataSchema
} from './admin.schemas.js';
import {
  listUsersHandler, getUserHandler, createUserHandler, updateUserHandler,
  resetPasswordHandler, deactivateUserHandler, reactivateUserHandler
} from './admin.users.controller.js';
import {
  listHandler as listMasterDataHandler,
  createHandler as createMasterDataHandler,
  updateHandler as updateMasterDataHandler,
  deleteHandler as deleteMasterDataHandler
} from './admin.masterdata.controller.js';
import { healthHandler } from './admin.health.controller.js';

export const adminRouter: Router = Router();

adminRouter.use(requireAuth);

/* ════════════════════════════════════════════════════════════════════
 * Reference data (roles, orgs) — needed for user forms
 * ════════════════════════════════════════════════════════════════════ */

adminRouter.get(
  '/roles',
  requirePermission('admin:users'),
  async (_req, res, next) => {
    try {
      const roles = await prisma.role.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { code: 'asc' },
        select: {
          roleId: true, code: true, name: true,
          scope: true, description: true, permissions: true
        }
      });
      sendSuccess(res, roles.map((r) => ({
        roleId: r.roleId,
        code: r.code,
        name: r.name,
        scope: r.scope,
        ...(r.description ? { description: r.description } : {}),
        permissions: Array.isArray(r.permissions) ? r.permissions : []
      })));
    } catch (err) { next(err); }
  }
);

adminRouter.get(
  '/orgs',
  requirePermission('admin:users'),
  async (_req, res, next) => {
    try {
      const orgs = await prisma.organization.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: {
          orgId: true, code: true, name: true, nameAm: true,
          orgType: true, level: true, parentOrgId: true
        }
      });
      sendSuccess(res, orgs.map((o) => ({
        orgId: o.orgId,
        code: o.code,
        name: o.name,
        ...(o.nameAm ? { nameAm: o.nameAm } : {}),
        orgType: o.orgType,
        level: o.level,
        ...(o.parentOrgId ? { parentOrgId: o.parentOrgId } : {})
      })));
    } catch (err) { next(err); }
  }
);

/* ════════════════════════════════════════════════════════════════════
 * System health
 * ════════════════════════════════════════════════════════════════════ */

adminRouter.get(
  '/system-health',
  requirePermission('admin:settings'),
  healthHandler
);

/* ════════════════════════════════════════════════════════════════════
 * Users (M16)
 * ════════════════════════════════════════════════════════════════════ */

adminRouter.get(
  '/users',
  requirePermission('admin:users'),
  validate({ query: listUsersQuerySchema }),
  listUsersHandler
);

adminRouter.get('/users/:id', requirePermission('admin:users'), getUserHandler);

adminRouter.post(
  '/users',
  requirePermission('admin:users'),
  requireMfa,
  validate({ body: createUserSchema }),
  createUserHandler
);

adminRouter.patch(
  '/users/:id',
  requirePermission('admin:users'),
  requireMfa,
  validate({ body: updateUserSchema }),
  updateUserHandler
);

adminRouter.post(
  '/users/:id/reset-password',
  requirePermission('admin:users'),
  requireMfa,
  resetPasswordHandler
);

adminRouter.post(
  '/users/:id/deactivate',
  requirePermission('admin:users'),
  requireMfa,
  deactivateUserHandler
);

adminRouter.post(
  '/users/:id/reactivate',
  requirePermission('admin:users'),
  requireMfa,
  reactivateUserHandler
);

/* ════════════════════════════════════════════════════════════════════
 * Master data (M16)
 * ════════════════════════════════════════════════════════════════════ */

adminRouter.get(
  '/master-data',
  requirePermission('admin:master-data'),
  validate({ query: listMasterDataQuerySchema }),
  listMasterDataHandler
);

adminRouter.post(
  '/master-data',
  requirePermission('admin:master-data'),
  validate({ body: createMasterDataSchema }),
  createMasterDataHandler
);

adminRouter.patch(
  '/master-data/:id',
  requirePermission('admin:master-data'),
  validate({ body: updateMasterDataSchema }),
  updateMasterDataHandler
);

adminRouter.delete(
  '/master-data/:id',
  requirePermission('admin:master-data'),
  deleteMasterDataHandler
);