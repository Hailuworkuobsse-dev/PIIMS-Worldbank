import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError, BadRequestError } from '@/lib/errors.js';
import * as service from '../admin.users.service.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    role: { findFirst: vi.fn(), findMany: vi.fn() },
    organization: { findFirst: vi.fn(), findMany: vi.fn() },
    refreshToken: { updateMany: vi.fn() },
    auditLog: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(async (ops) => Promise.all(ops))
  }
}));

vi.mock('@/lib/audit.js', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined)
}));

const actor = { userId: 'u-admin', scope: { orgLevel: 'FEDERAL' as const } };
const ctx = { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: null };

describe('admin.users.createUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if role does not exist', async () => {
    (prisma.role.findFirst as any).mockResolvedValue(null);
    await expect(
      service.createUser(
        {
          username: 'testuser', email: 't@test.com', fullName: 'Test',
          fullNameAm: '', phone: '', orgId: '00000000-0000-4000-8000-000000000001',
          role: 'INVALID', mfaEnabled: false, sendInvite: true
        },
        actor, ctx
      )
    ).rejects.toThrow();
  });

  it('throws if org does not exist', async () => {
    (prisma.role.findFirst as any).mockResolvedValue({ roleId: 'r1', code: 'MW-PIU' });
    (prisma.organization.findFirst as any).mockResolvedValue(null);
    await expect(
      service.createUser(
        {
          username: 'testuser', email: 't@test.com', fullName: 'Test',
          fullNameAm: '', phone: '', orgId: '00000000-0000-4000-8000-000000000001',
          role: 'MW-PIU', mfaEnabled: false, sendInvite: true
        },
        actor, ctx
      )
    ).rejects.toThrow();
  });

  it('throws on duplicate username', async () => {
    (prisma.role.findFirst as any).mockResolvedValue({ roleId: 'r1', code: 'MW-PIU' });
    (prisma.organization.findFirst as any).mockResolvedValue({ orgId: 'o1', status: 'ACTIVE' });
    (prisma.user.findFirst as any).mockResolvedValue({ username: 'testuser', email: 'other@test.com' });

    await expect(
      service.createUser(
        {
          username: 'testuser', email: 't@test.com', fullName: 'Test',
          fullNameAm: '', phone: '', orgId: '00000000-0000-4000-8000-000000000001',
          role: 'MW-PIU', mfaEnabled: false, sendInvite: true
        },
        actor, ctx
      )
    ).rejects.toThrow(ConflictError);
  });

  it('rejects non-federal admin creating federal admin role', async () => {
    const regionalActor = {
      userId: 'u-reg',
      scope: { orgLevel: 'REGIONAL' as const, regions: ['Oromia'] }
    };
    (prisma.role.findFirst as any).mockResolvedValue({ roleId: 'r1', code: 'MW-SA' });
    (prisma.organization.findFirst as any).mockResolvedValue({ orgId: 'o1', status: 'ACTIVE' });
    (prisma.user.findUnique as any).mockResolvedValue({ orgId: 'o-other' });

    await expect(
      service.createUser(
        {
          username: 'testuser', email: 't@test.com', fullName: 'Test',
          fullNameAm: '', phone: '', orgId: '00000000-0000-4000-8000-000000000001',
          role: 'MW-SA', mfaEnabled: false, sendInvite: true
        },
        regionalActor, ctx
      )
    ).rejects.toThrow(ForbiddenError);
  });
});

describe('admin.users.updateUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prevents self-demotion', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      userId: 'u-admin', username: 'admin', fullName: 'Admin', email: 'a@t',
      role: { code: 'MW-SA', name: 'Admin' }, org: { orgId: 'o1', name: 'MoWE', code: 'MOWE' },
      status: 'ACTIVE', mfaEnabled: false, lastLoginAt: null, createdAt: new Date()
    });

    await expect(
      service.updateUser('u-admin', { role: 'MW-PIU' }, actor, ctx)
    ).rejects.toThrow(BadRequestError);
  });

  it('throws NotFoundError for missing user', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(
      service.updateUser('u-missing', { fullName: 'X' }, actor, ctx)
    ).rejects.toThrow(NotFoundError);
  });
});