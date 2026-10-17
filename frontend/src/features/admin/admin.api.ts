import { api } from "@/lib/api/client";
import type {
  AdminUser,
  AdminUserFilters,
  CreateUserInput,
  UpdateUserInput,
  IntegrationStatus,
  SyncRun,
  AuditLogEntry,
  AuditFilters,
  SystemHealth,
  IntegrationCode,
} from "./admin.types";

interface Envelope<T> {
  data: T;
}

function userFiltersToParams(f: AdminUserFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.orgId) p.set("org_id", f.orgId);
  if (f.role) p.set("role", f.role);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

function auditFiltersToParams(f: AuditFilters): string {
  const p = new URLSearchParams();
  if (f.userId) p.set("user_id", f.userId);
  if (f.entity) p.set("entity", f.entity);
  if (f.action) p.set("action", f.action);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.q) p.set("q", f.q);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

export const adminApi = {
  /* ---- Users ---- */
  async listUsers(f: AdminUserFilters) {
    const { data } = await api.get<Envelope<AdminUser[]> & { pagination: any }>(
      `/admin/users?${userFiltersToParams(f)}`,
    );
    return { data: data.data, pagination: (data as any).pagination };
  },

  async getUser(userId: string): Promise<AdminUser> {
    const { data } = await api.get<Envelope<AdminUser>>(
      `/admin/users/${userId}`,
    );
    return data.data;
  },

  async createUser(input: CreateUserInput): Promise<AdminUser> {
    const { data } = await api.post<Envelope<AdminUser>>("/admin/users", input);
    return data.data;
  },

  async updateUser(userId: string, input: UpdateUserInput): Promise<AdminUser> {
    const { data } = await api.patch<Envelope<AdminUser>>(
      `/admin/users/${userId}`,
      input,
    );
    return data.data;
  },

  async resetPassword(userId: string): Promise<{ temporaryPassword: string }> {
    const { data } = await api.post<Envelope<{ temporaryPassword: string }>>(
      `/admin/users/${userId}/reset-password`,
    );
    return data.data;
  },

  async deactivateUser(userId: string, reason?: string): Promise<AdminUser> {
    const { data } = await api.post<Envelope<AdminUser>>(
      `/admin/users/${userId}/deactivate`,
      { reason },
    );
    return data.data;
  },

  async reactivateUser(userId: string): Promise<AdminUser> {
    const { data } = await api.post<Envelope<AdminUser>>(
      `/admin/users/${userId}/reactivate`,
    );
    return data.data;
  },

  /* ---- Integrations ---- */
  async integrations(): Promise<IntegrationStatus[]> {
    const { data } = await api.get<Envelope<IntegrationStatus[]>>(
      "/admin/integrations",
    );
    return data.data;
  },

  async integrationRuns(code: IntegrationCode, limit = 20): Promise<SyncRun[]> {
    const { data } = await api.get<Envelope<SyncRun[]>>(
      `/admin/integrations/${code}/runs?limit=${limit}`,
    );
    return data.data;
  },

  async triggerSync(
    code: IntegrationCode,
  ): Promise<{ jobId: string; statusUrl: string }> {
    const { data } = await api.post<
      Envelope<{ jobId: string; statusUrl: string }>
    >(`/admin/integrations/${code}/sync`);
    return data.data;
  },

  /* ---- Audit ---- */
  async auditLog(f: AuditFilters) {
    const { data } = await api.get<
      Envelope<AuditLogEntry[]> & { pagination: any }
    >(`/audit?${auditFiltersToParams(f)}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  /* ---- System health ---- */
  async systemHealth(): Promise<SystemHealth> {
    const { data } = await api.get<Envelope<SystemHealth>>(
      "/admin/system-health",
    );
    return data.data;
  },
};