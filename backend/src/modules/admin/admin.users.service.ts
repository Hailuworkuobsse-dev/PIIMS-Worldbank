import { Prisma, UserStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma.js';
import { hashPassword } from '@/lib/password.js';
import { writeAudit } from '@/lib/audit.js';
import { sha256 } from '@/utils/crypto.js';
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError, ValidationError
} from '@/lib/errors.js';
import { parsePagination, buildPaginationMeta, parseSort, decodeCursor } from '@/utils/pagination.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import type { AdminUserDTO, UserCreateResultDTO } from './admin.types.js';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from './admin.schemas.js';

const userInclude = {
  org: { select: { orgId: true, name: true, code: true } },
  role: { select: { code: true, name: true } }
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

function toAdminUserDTO(u: UserWithRelations): AdminUserDTO {
  return {
    userId: u.userId,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    ...(u.fullNameAm ? { fullNameAm: u.fullNameAm } : {}),
    ...(u.phone ? { phone: u.phone } : {}),
    orgId: u.orgId,
    orgName: u.org.name,
    role: u.role.code,
    roleName: u.role.name,
    status: u.status,
    mfaEnabled: u.mfaEnabled,
    ...(u.lastLoginAt ? { lastLoginAt: u.lastLoginAt.toISOString() } : {}),
    createdAt: u.createdAt.toISOString()
  };
}

/* ════════════════════════════════════════════════════════════════════
 * LIST
 * ════════════════════════════════════════════════════════════════════ */

export async function listUsers(
  query: ListUsersQuery
): Promise<{
  data: AdminUserDTO[];
  pagination: {
    nextCursor?: string;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  const filters: Prisma.UserWhereInput[] = [];
  if (query.q) {
    filters.push({
      OR: [
        { username: { contains: query.q } },
        { email: { contains: query.q } },
        { fullName: { contains: query.q } }
      ]
    });
  }
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean) as UserStatus[];
    if (statuses.length) filters.push({ status: { in: statuses } });
  }
  if (query.org_id) filters.push({ orgId: query.org_id });
  if (query.role) {
    filters.push({ role: { code: query.role } });
  }

  const where: Prisma.UserWhereInput = filters.length ? { AND: filters } : {};

  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.UserWhereInput | undefined = cursorId
    ? { userId: { not: cursorId } }
    : undefined;

  const orderBy = parseSort('createdAt', ['createdAt', 'username', 'fullName', 'lastLoginAt']);

  const [rows, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      include: userInclude,
      orderBy,
      take: pagination.limit + 1
    }),
    prisma.user.count({ where })
  ]);

  const { rows: trimmed, meta } = buildPaginationMeta(
    rows.map((r) => ({ id: r.userId, ...r })),
    pagination.limit,
    totalCount
  );

  const trimmedIds = new Set(trimmed.map((t) => t.id));
  const finalRows = rows.filter((r) => trimmedIds.has(r.userId));

  return {
    data: finalRows.map(toAdminUserDTO),
    pagination: {
      ...(meta.nextCursor ? { nextCursor: meta.nextCursor } : {}),
      limit: meta.limit,
      totalCount: meta.totalCount,
      hasMore: meta.hasMore
    }
  };
}

/* ════════════════════════════════════════════════════════════════════
 * GET
 * ════════════════════════════════════════════════════════════════════ */

export async function getUserById(userId: string): Promise<AdminUserDTO> {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: userInclude
  });
  if (!user) throw new NotFoundError('User', userId);
  return toAdminUserDTO(user);
}

/* ════════════════════════════════════════════════════════════════════
 * CREATE
 * ════════════════════════════════════════════════════════════════════ */

export async function createUser(
  input: CreateUserInput,
  actor: { userId: string; scope: ScopeClaim },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<UserCreateResultDTO> {
  // ── Role must exist
  const role = await prisma.role.findFirst({
    where: { code: input.role, status: 'ACTIVE' }
  });
  if (!role) throw new ValidationError(`Role '${input.role}' does not exist or is inactive`);

  // ── Org must exist
  const org = await prisma.organization.findFirst({
    where: { orgId: input.orgId, status: 'ACTIVE' }
  });
  if (!org) throw new ValidationError('Organization does not exist or is inactive');

  // ── Scope check — non-federal can only create users in their org
  if (actor.scope.orgLevel !== 'FEDERAL' && input.orgId !== (await getActorOrgId(actor.userId))) {
    throw new ForbiddenError('You can only create users in your own organization');
  }

  // ── Prevent privilege escalation — only federal admins can create admins
  if (input.role === 'MW-SA' || input.role === 'SYS-SEC' || input.role === 'SYS-DBA') {
    if (actor.scope.orgLevel !== 'FEDERAL') {
      throw new ForbiddenError('Only federal administrators can create this role');
    }
  }

  // ── Uniqueness
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: input.username }, { email: input.email }]
    },
    select: { username: true, email: true }
  });
  if (existing) {
    if (existing.username === input.username) {
      throw new ConflictError('Username already exists');
    }
    throw new ConflictError('Email already exists');
  }

  // ── Generate a temporary password if invite
  const tempPassword = input.sendInvite ? generateTempPassword() : generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      fullName: input.fullName,
      ...(input.fullNameAm ? { fullNameAm: input.fullNameAm } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      orgId: input.orgId,
      roleId: role.roleId,
      passwordHash,
      mfaEnabled: input.mfaEnabled,
      status: 'ACTIVE'
    },
    include: userInclude
  });

  await writeAudit({
    userId: actor.userId,
    entity: 'USER',
    entityId: user.userId,
    action: 'CREATE',
    newValue: {
      username: user.username,
      email: user.email,
      role: user.role.code,
      orgId: user.orgId
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return {
    ...toAdminUserDTO(user),
    temporaryPassword: tempPassword
  };
}

async function getActorOrgId(userId: string): Promise<string> {
  const actor = await prisma.user.findUnique({
    where: { userId },
    select: { orgId: true }
  });
  return actor?.orgId ?? '';
}

function generateTempPassword(): string {
  // 16-char random password, uppercase + lowercase + digit + symbol
  const raw = randomBytes(16).toString('base64url').slice(0, 12);
  const suffix = '!Aa1';
  return `${raw}${suffix}`;
}

/* ════════════════════════════════════════════════════════════════════
 * UPDATE
 * ════════════════════════════════════════════════════════════════════ */

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  actor: { userId: string; scope: ScopeClaim },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<AdminUserDTO> {
  const existing = await prisma.user.findUnique({
    where: { userId },
    include: userInclude
  });
  if (!existing) throw new NotFoundError('User', userId);

  // Prevent self-demotion from admin roles via this endpoint
  if (userId === actor.userId && input.role && input.role !== existing.role.code) {
    throw new BadRequestError('You cannot change your own role');
  }

  // Role validation
  if (input.role) {
    const role = await prisma.role.findFirst({
      where: { code: input.role, status: 'ACTIVE' }
    });
    if (!role) throw new ValidationError(`Role '${input.role}' does not exist`);
  }

  // Org validation
  if (input.orgId) {
    const org = await prisma.organization.findFirst({
      where: { orgId: input.orgId, status: 'ACTIVE' }
    });
    if (!org) throw new ValidationError('Organization does not exist or is inactive');
  }

  // Build update data
  const data: Prisma.UserUpdateInput = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.fullNameAm !== undefined) data.fullNameAm = input.fullNameAm || null;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.orgId !== undefined) data.org = { connect: { orgId: input.orgId } };
  if (input.role !== undefined) data.role = { connect: { code: input.role } };
  if (input.status !== undefined) data.status = input.status;
  if (input.mfaEnabled !== undefined) data.mfaEnabled = input.mfaEnabled;

  const updated = await prisma.user.update({
    where: { userId },
    data,
    include: userInclude
  });

  // If status changed to non-ACTIVE, revoke all refresh tokens
  if (input.status && input.status !== 'ACTIVE') {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  await writeAudit({
    userId: actor.userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    oldValue: {
      fullName: existing.fullName,
      email: existing.email,
      role: existing.role.code,
      status: existing.status
    },
    newValue: {
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role.code,
      status: updated.status
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toAdminUserDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * RESET PASSWORD
 * ════════════════════════════════════════════════════════════════════ */

export async function resetPassword(
  userId: string,
  actor: { userId: string; scope: ScopeClaim },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<{ temporaryPassword: string }> {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw new NotFoundError('User', userId);

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
        status: user.status === 'LOCKED' ? 'ACTIVE' : user.status
      }
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  await writeAudit({
    userId: actor.userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    newValue: { field: 'passwordHash', reason: 'admin-reset' },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return { temporaryPassword: tempPassword };
}

/* ════════════════════════════════════════════════════════════════════
 * DEACTIVATE / REACTIVATE
 * ════════════════════════════════════════════════════════════════════ */

export async function deactivateUser(
  userId: string,
  reason: string | undefined,
  actor: { userId: string; scope: ScopeClaim },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<AdminUserDTO> {
  if (userId === actor.userId) {
    throw new BadRequestError('You cannot deactivate your own account');
  }
  const user = await prisma.user.findUnique({ where: { userId }, include: userInclude });
  if (!user) throw new NotFoundError('User', userId);

  const updated = await prisma.user.update({
    where: { userId },
    data: { status: 'INACTIVE' },
    include: userInclude
  });

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  await writeAudit({
    userId: actor.userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    oldValue: { status: user.status },
    newValue: { status: 'INACTIVE', reason: reason ?? null },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toAdminUserDTO(updated);
}

export async function reactivateUser(
  userId: string,
  actor: { userId: string; scope: ScopeClaim },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<AdminUserDTO> {
  const user = await prisma.user.findUnique({ where: { userId }, include: userInclude });
  if (!user) throw new NotFoundError('User', userId);

  const updated = await prisma.user.update({
    where: { userId },
    data: {
      status: 'ACTIVE',
      failedLoginCount: 0,
      lockedUntil: null
    },
    include: userInclude
  });

  await writeAudit({
    userId: actor.userId,
    entity: 'USER',
    entityId: userId,
    action: 'UPDATE',
    oldValue: { status: user.status },
    newValue: { status: 'ACTIVE' },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toAdminUserDTO(updated);
}