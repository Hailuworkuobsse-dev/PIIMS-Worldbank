import type { UserStatus } from '@prisma/client';

export interface AdminUserDTO {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAm?: string;
  phone?: string;
  orgId: string;
  orgName: string;
  role: string;
  roleName: string;
  status: UserStatus;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface RoleDTO {
  roleId: string;
  code: string;
  name: string;
  scope: string;
  description?: string;
  permissions: string[];
}

export interface OrgDTO {
  orgId: string;
  code: string;
  name: string;
  nameAm?: string;
  orgType: string;
  level: string;
  parentOrgId?: string;
}

export interface MasterDataDTO {
  masterId: string;
  category: string;
  code: string;
  name: string;
  nameAm?: string;
  parentId?: string;
  attributes?: Record<string, unknown>;
  orderNo?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDTO {
  logId: string;
  userId?: string;
  userName?: string;
  entity: string;
  entityId?: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  recordHash: string;
}

export interface SystemHealthDTO {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  env: string;
  uptime: number;
  api: { status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; p95LatencyMs: number };
  database: { status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; connections: number; maxConnections: number };
  redis: { status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number };
  queue: { status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; depth: number };
  storage: { usedGb: number; totalGb: number };
  activeUsers24h: number;
  apiCalls24h: number;
}

export interface UserCreateResultDTO extends AdminUserDTO {
  temporaryPassword?: string;
}