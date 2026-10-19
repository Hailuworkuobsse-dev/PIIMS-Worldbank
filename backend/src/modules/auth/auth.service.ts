import { prisma } from '@/lib/prisma.js';
import { hashPassword, verifyPassword } from '@/lib/password.js';
import {
  signAccessToken, signRefreshToken, signMfaChallenge,
  verifyRefreshToken, verifyMfaChallenge,
  type ScopeClaim
} from '@/lib/jwt.js';
import { generateTotpSecret, verifyTotp, generateTotpUri } from '@/lib/totp.js';
import { buildScopeClaim } from '@/lib/permissions.js';
import { writeAudit } from '@/lib/audit.js';
import { sha256 } from '@/utils/crypto.js';
import { authConfig, roleRequiresMfa } from '@/config/auth.config.js';
import {
  UnauthorizedError, BadRequestError, ForbiddenError, ConflictError
} from '@/lib/errors.js';
import { logger } from '@/config/logger.js';
import type {
  AuthUser, LoginResponse, MfaSetupResponse, RefreshResponse
} from './auth.types.js';

/* ════════════════════════════════════════════════════════════════════
 * Login
 * ════════════════════════════════════════════════════════════════════ */

export interface LoginContext {
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
}

export async function login(
  username: string,
  password: string,
  context: LoginContext
): Promise<LoginResponse> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }]
    },
    include: { org: true, role: true }
  });

  // Constant-time-ish: always do a hash check even if user not found
  if (!user) {
    await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$dummy$dummy', password);
    await writeAudit({
      entity: 'USER',
      action: 'LOGIN',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      newValue: { username, success: false, reason: 'unknown-user' }
    });
    throw new UnauthorizedError('Invalid username or password');
  }

  // ── Account status checks ─────────────────────────────────────
  if (user.status === 'LOCKED' || (user.lockedUntil && user.lockedUntil > new Date())) {
    await writeAudit({
      userId: user.userId,
      entity: 'USER',
      entityId: user.userId,
      action: 'LOGIN',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      newValue: { success: false, reason: 'locked' }
    });
    throw new ForbiddenError('Account is locked. Contact an administrator.');
  }

  if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
    throw new ForbiddenError('Account is not active');
  }

  // ── Password check ────────────────────────────────────────────
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    const failedCount = user.failedLoginCount + 1;
    const shouldLock = failedCount >= authConfig.maxFailedLogins;

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        failedLoginCount: failedCount,
        ...(shouldLock
          ? { lockedUntil: new Date(Date.now() + authConfig.lockoutDurationSeconds * 1000) }
          : {})
      }
    });

    await writeAudit({
      userId: user.userId,
      entity: 'USER',
      entityId: user.userId,
      action: 'LOGIN',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      newValue: { success: false, reason: 'bad-password', failedCount, locked: shouldLock }
    });

    throw new UnauthorizedError('Invalid username or password');
  }

  // ── MFA check ─────────────────────────────────────────────────
  const requiresMfa =
    user.mfaEnabled || roleRequiresMfa(user.role.code);

  if (requiresMfa) {
    if (!user.mfaEnabled) {
      // This short-lived onboarding session can only reach password/MFA setup endpoints.
      return completeLogin(user, false, context, true);
    }

    // Issue short-lived MFA challenge token
    const { token: mfaToken } = signMfaChallenge(user.userId);

    await writeAudit({
      userId: user.userId,
      entity: 'USER',
      entityId: user.userId,
      action: 'LOGIN',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      newValue: { success: false, reason: 'mfa-required' }
    });

    return {
      user: toAuthUser(user),
      access_token: '',
      refresh_token: '',
      expires_in: 0,
      refresh_expires_in: 0,
      mfa_required: true,
      mfa_token: mfaToken
    };
  }

  // ── Success (no MFA) ──────────────────────────────────────────
  return completeLogin(user, false, context);
}

/* ════════════════════════════════════════════════════════════════════
 * MFA verify (second step)
 * ════════════════════════════════════════════════════════════════════ */

export async function verifyMfaAndLogin(
  mfaToken: string,
  mfaCode: string,
  context: LoginContext
): Promise<LoginResponse> {
  const challenge = verifyMfaChallenge(mfaToken);

  const user = await prisma.user.findUnique({
    where: { userId: challenge.sub },
    include: { org: true, role: true }
  });

  if (!user || !user.mfaSecret) {
    throw new UnauthorizedError('MFA is not configured for this account');
  }

  if (user.status !== 'ACTIVE') {
    throw new ForbiddenError('Account is not active');
  }

  if (!verifyTotp(user.mfaSecret, mfaCode)) {
    await writeAudit({
      userId: user.userId,
      entity: 'USER',
      entityId: user.userId,
      action: 'LOGIN',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      newValue: { success: false, reason: 'bad-mfa-code' }
    });
    throw new UnauthorizedError('Invalid MFA code');
  }

  return completeLogin(user, true, context);
}

/* ════════════════════════════════════════════════════════════════════
 * Refresh
 * ════════════════════════════════════════════════════════════════════ */

export async function refresh(refreshToken: string, context: LoginContext): Promise<RefreshResponse> {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = sha256(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt) throw new UnauthorizedError('Refresh token has been revoked');
  if (stored.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired');
  if (stored.userId !== payload.sub) throw new UnauthorizedError('Token subject mismatch');

  const user = await prisma.user.findUnique({
    where: { userId: payload.sub }, include: { org: true, role: true }
  });
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('User not found or inactive');

  const permissions = parsePermissions(user.role.permissions);
  const scope = buildScopeClaim(user.role.scope, user.org.level) as ScopeClaim;
  const access = signAccessToken(user.userId, user.username, user.orgId, user.role.code, permissions, scope, stored.mfaVerified);
  const newRefresh = signRefreshToken(user.userId);
  await prisma.$transaction([
    prisma.refreshToken.updateMany({ where: { tokenId: stored.tokenId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({
      data: {
        userId: user.userId,
        tokenHash: sha256(newRefresh.token),
        mfaVerified: stored.mfaVerified,
        expiresAt: new Date(Date.now() + newRefresh.expiresIn * 1000),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    })
  ]);
  return {
    access_token: access.token,
    refresh_token: newRefresh.token,
    expires_in: access.expiresIn,
    refresh_expires_in: newRefresh.expiresIn
  };
}

/* ════════════════════════════════════════════════════════════════════
 * Logout
 * ════════════════════════════════════════════════════════════════════ */

export async function logout(userId: string, refreshToken: string | undefined, context: LoginContext): Promise<void> {
  if (refreshToken) {
    const tokenHash = sha256(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  } else {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  await writeAudit({
    userId,
    entity: 'USER',
    entityId: userId,
    action: 'LOGOUT',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });
}

/* ════════════════════════════════════════════════════════════════════
 * Me
 * ════════════════════════════════════════════════════════════════════ */

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: { org: true, role: true }
  });
  if (!user) throw new UnauthorizedError('User not found');
  return toAuthUser(user);
}

/* ════════════════════════════════════════════════════════════════════
 * Password change
 * ════════════════════════════════════════════════════════════════════ */

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  context: LoginContext
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw new UnauthorizedError('User not found');

  const ok = await verifyPassword(user.passwordHash, oldPassword);
  if (!ok) throw new BadRequestError('Current password is incorrect');

  if (oldPassword === newPassword) {
    throw new BadRequestError('New password must be different from current password');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { userId },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null
      }
    }),
    // Revoke all refresh tokens — force re-login on all devices
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  await writeAudit({
    userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    oldValue: { field: 'passwordHash' },
    newValue: { field: 'passwordHash' },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });
}

export async function ssoLogin(email: string, mfaVerified: boolean, context: LoginContext): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email }, include: { org: true, role: true }
  });
  // SSO never provisions users. The identity must map to an active, pre-provisioned PIIMS account.
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('This identity is not linked to an active PIIMS account.');
  if ((user.mfaEnabled || roleRequiresMfa(user.role.code)) && !mfaVerified) {
    throw new ForbiddenError('Your organization identity provider did not confirm multi-factor authentication.');
  }
  const result = await completeLogin(user, mfaVerified, context);
  // Government SSO is responsible for password policy and MFA; PIIMS still requires policy acknowledgement.
  result.user = { ...result.user, mustChangePassword: false, mfaSetupRequired: false };
  return result;
}

export async function acceptPolicy(userId: string, policyVersion: string, context: LoginContext): Promise<void> {
  if (policyVersion !== '2026-10-v1') throw new BadRequestError('Unsupported policy version');
  await prisma.user.update({
    where: { userId },
    data: { acceptedPolicyVersion: policyVersion, acceptedPolicyAt: new Date() }
  });
  await writeAudit({
    userId, entity: 'USER', entityId: userId, action: 'UPDATE',
    newValue: { acceptedPolicyVersion: policyVersion, acceptedPolicyAt: new Date().toISOString() },
    ipAddress: context.ipAddress, userAgent: context.userAgent, correlationId: context.correlationId
  });
}

/* ════════════════════════════════════════════════════════════════════
 * MFA setup / enable / disable
 * ════════════════════════════════════════════════════════════════════ */

export async function setupMfa(userId: string): Promise<MfaSetupResponse> {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw new UnauthorizedError('User not found');

  if (user.mfaEnabled) {
    throw new ConflictError('MFA is already enabled. Disable it first.');
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { userId },
    data: { mfaSecret: secret }
  });

  const qrUri = generateTotpUri(secret, user.email, authConfig.mfa.issuer);

  return { secret, qrUri };
}

export async function enableMfa(userId: string, code: string, context: LoginContext): Promise<void> {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user || !user.mfaSecret) {
    throw new BadRequestError('MFA setup not initiated');
  }

  if (user.mfaEnabled) {
    throw new ConflictError('MFA is already enabled');
  }

  if (!verifyTotp(user.mfaSecret, code)) {
    throw new BadRequestError('Invalid MFA code');
  }

  await prisma.$transaction([
    prisma.user.update({ where: { userId }, data: { mfaEnabled: true } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
  ]);

  await writeAudit({
    userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    newValue: { mfaEnabled: true },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });
}

export async function disableMfa(userId: string, password: string, context: LoginContext): Promise<void> {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw new UnauthorizedError('User not found');

  if (roleRequiresMfa(user.role.code)) {
    throw new ForbiddenError('MFA is required for your role and cannot be disabled');
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new BadRequestError('Password is incorrect');

  await prisma.user.update({
    where: { userId },
    data: { mfaEnabled: false, mfaSecret: null }
  });

  await writeAudit({
    userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    newValue: { mfaEnabled: false },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });
}

/* ════════════════════════════════════════════════════════════════════
 * Internal helpers
 * ════════════════════════════════════════════════════════════════════ */

type FullUser = {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAm: string | null;
  orgId: string;
  roleId: string;
  mfaEnabled: boolean;
  status: string;
  lastLoginAt: Date | null;
  passwordChangedAt?: Date | null;
  acceptedPolicyVersion?: string | null;
  acceptedPolicyAt?: Date | null;
  locale: string;
  role: { code: string; name: string; scope: string; permissions: unknown };
  org: { orgId: string; name: string; level: string };
};

async function completeLogin(
  user: FullUser,
  mfa: boolean,
  context: LoginContext,
  mfaSetupRequired = false
): Promise<LoginResponse> {
  const permissions = parsePermissions(user.role.permissions);
  const scope = buildScopeClaim(user.role.scope, user.org.level) as ScopeClaim;

  const access = signAccessToken(
    user.userId, user.username, user.orgId, user.role.code,
    permissions, scope, mfa
  );
  const refresh = signRefreshToken(user.userId);

  await prisma.$transaction([
    prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null }
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.userId,
        tokenHash: sha256(refresh.token),
        mfaVerified: mfa,
        expiresAt: new Date(Date.now() + refresh.expiresIn * 1000),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    })
  ]);

  await writeAudit({
    userId: user.userId,
    entity: 'USER',
    entityId: user.userId,
    action: 'LOGIN',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
    newValue: { success: true, mfa }
  });

  return {
    user: toAuthUser(user),
    access_token: access.token,
    refresh_token: refresh.token,
    expires_in: access.expiresIn,
    refresh_expires_in: refresh.expiresIn,
    ...(mfaSetupRequired ? { mfa_setup_required: true } : {})
  };
}

function toAuthUser(user: FullUser): AuthUser {
  return {
    userId: user.userId,
    username: user.username,
    fullName: user.fullName,
    ...(user.fullNameAm ? { fullNameAm: user.fullNameAm } : {}),
    email: user.email,
    orgId: user.orgId,
    orgName: user.org.name,
    role: user.role.code as AuthUser['role'],
    roleName: user.role.name,
    permissions: parsePermissions(user.role.permissions),
    scope: buildScopeClaim(user.role.scope, user.org.level),
    mfaEnabled: user.mfaEnabled,
    mfaSetupRequired: roleRequiresMfa(user.role.code) && !user.mfaEnabled,
    mustChangePassword: !user.passwordChangedAt,
    acceptedPolicyVersion: user.acceptedPolicyVersion ?? null,
    locale: (user.locale === 'am' ? 'am' : 'en'),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? new Date().toISOString()
  };
}

function parsePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === 'string');
  return [];
}

/**
 * Cleanup expired refresh tokens. Called periodically from main.ts.
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { lt: new Date(Date.now() - 30 * 24 * 3600 * 1000) } }
      ]
    }
  });
  if (result.count > 0) {
    logger.info({ count: result.count }, 'expired refresh tokens cleaned up');
  }
  return result.count;
}