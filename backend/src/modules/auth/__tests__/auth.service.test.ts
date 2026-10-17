import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { hashPassword } from '@/lib/password.js';
import * as authService from '../auth.service.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(async (ops) => Promise.all(ops))
  }
}));

vi.mock('@/lib/audit.js', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined)
}));

const ctx = { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: null };

describe('auth.service.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Audit log lookup — no previous hash
    (prisma.auditLog.findFirst as any).mockResolvedValue(null);
  });

  it('returns tokens on valid credentials', async () => {
    const password = 'Demo1234';
    const passwordHash = await hashPassword(password);

    (prisma.user.findFirst as any).mockResolvedValue({
      userId: 'u1',
      username: 'user1',
      email: 'user1@test',
      fullName: 'Test User',
      fullNameAm: null,
      orgId: 'o1',
      roleId: 'r1',
      mfaEnabled: false,
      status: 'ACTIVE',
      lastLoginAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
      locale: 'en',
      passwordHash,
      role: {
        code: 'MW-PIU',
        name: 'PIU Officer',
        scope: 'NATIONAL',
        permissions: ['project:read', 'project:write']
      },
      org: { orgId: 'o1', name: 'MoWE', level: 'FEDERAL' }
    });

    (prisma.user.update as any).mockResolvedValue({});
    (prisma.refreshToken.create as any).mockResolvedValue({});

    const result = await authService.login('user1', password, ctx);

    expect(result.mfa_required).toBeUndefined();
    expect(result.access_token).toBeTruthy();
    expect(result.refresh_token).toBeTruthy();
    expect(result.user.username).toBe('user1');
    expect(result.user.permissions).toContain('project:read');
  });

  it('throws on unknown user', async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    await expect(authService.login('nobody', 'whatever', ctx)).rejects.toThrow(
      /invalid username or password/i
    );
  });

  it('throws on wrong password', async () => {
    const passwordHash = await hashPassword('Demo1234');

    (prisma.user.findFirst as any).mockResolvedValue({
      userId: 'u1', username: 'u', email: 'u@t', fullName: 'U', fullNameAm: null,
      orgId: 'o1', roleId: 'r1', mfaEnabled: false, status: 'ACTIVE',
      lastLoginAt: null, failedLoginCount: 0, lockedUntil: null, locale: 'en',
      passwordHash,
      role: { code: 'MW-PIU', name: 'PIU', scope: 'NATIONAL', permissions: [] },
      org: { orgId: 'o1', name: 'MoWE', level: 'FEDERAL' }
    });
    (prisma.user.update as any).mockResolvedValue({});

    await expect(authService.login('u', 'wrong', ctx)).rejects.toThrow(
      /invalid username or password/i
    );
  });

  it('returns mfa_required when MFA enabled', async () => {
    const password = 'Demo1234';
    const passwordHash = await hashPassword(password);

    (prisma.user.findFirst as any).mockResolvedValue({
      userId: 'u1', username: 'u', email: 'u@t', fullName: 'U', fullNameAm: null,
      orgId: 'o1', roleId: 'r1', mfaEnabled: true, status: 'ACTIVE',
      lastLoginAt: null, failedLoginCount: 0, lockedUntil: null, locale: 'en',
      passwordHash,
      role: { code: 'MW-SA', name: 'Admin', scope: 'GLOBAL', permissions: ['*'] },
      org: { orgId: 'o1', name: 'MoWE', level: 'FEDERAL' }
    });

    const result = await authService.login('u', password, ctx);
    expect(result.mfa_required).toBe(true);
    expect(result.mfa_token).toBeTruthy();
    expect(result.access_token).toBe('');
  });
});

describe('auth.service.refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a revoked token', async () => {
    const { signRefreshToken } = await import('@/lib/jwt.js');
    const { token } = signRefreshToken('u1');

    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      tokenId: 't1', userId: 'u1', revokedAt: new Date(), expiresAt: new Date(Date.now() + 3600_000)
    });

    await expect(authService.refresh(token, ctx)).rejects.toThrow(/revoked/i);
  });
});