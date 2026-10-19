export const USER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "LOCKED",
  "SUSPENDED",
] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface AdminUser {
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

export interface AdminUserFilters {
  q?: string | undefined;
  status?: UserStatus[] | undefined;
  orgId?: string | undefined;
  role?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

export interface CreateUserInput {
  username: string;
  email: string;
  fullName: string;
  fullNameAm?: string | undefined;
  phone?: string | undefined;
  orgId: string;
  role: string;
  mfaEnabled: boolean;
  sendInvite: boolean;
}

export interface UpdateUserInput {
  fullName?: string | undefined;
  fullNameAm?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  orgId?: string | undefined;
  role?: string | undefined;
  status?: UserStatus | undefined;
  mfaEnabled?: boolean | undefined;
}

export const INTEGRATION_CODES = [
  "FMIS",
  "DBE",
  "WB",
  "SMS",
  "USSD",
  "MOBILE_MONEY",
  "GIS",
  "IDP",
  "ODK",
  "SAFE_ROOM",
] as const;
export type IntegrationCode = (typeof INTEGRATION_CODES)[number];

export interface IntegrationStatus {
  code: IntegrationCode;
  name: string;
  description: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  lastSync?: string;
  lastError?: string;
  errorCount24h: number;
  recordsProcessed24h: number;
  avgLatencyMs?: number;
}

export interface SyncRun {
  runId: string;
  integrationCode: IntegrationCode;
  kind: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  recordsProcessed: number;
  recordsFailed: number;
  status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  errorSummary?: string;
}

export interface AuditLogEntry {
  logId: number;
  userId?: string;
  userName?: string;
  entity: string;
  entityId?: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "APPROVE"
    | "REJECT"
    | "EXPORT"
    | "DOWNLOAD";
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  recordHash: string;
}

export interface AuditFilters {
  userId?: string | undefined;
  entity?: string | undefined;
  action?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  q?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

export interface SystemHealth {
  api: {
    status: "HEALTHY" | "DEGRADED" | "DOWN";
    uptime30d: number;
    p95LatencyMs: number;
  };
  database: {
    status: "HEALTHY" | "DEGRADED" | "DOWN";
    connections: number;
    maxConnections: number;
  };
  queue: { status: "HEALTHY" | "DEGRADED" | "DOWN"; depth: number };
  storage: { usedGb: number; totalGb: number };
  activeUsers24h: number;
  apiCalls24h: number;
}