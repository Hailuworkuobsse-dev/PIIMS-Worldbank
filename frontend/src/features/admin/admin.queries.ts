import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "./admin.api";
import type {
  AdminUserFilters,
  AuditFilters,
  IntegrationCode,
} from "./admin.types";

export const adminKeys = {
  all: ["admin"] as const,
  users: (f: AdminUserFilters) => [...adminKeys.all, "users", f] as const,
  user: (id: string) => [...adminKeys.all, "user", id] as const,
  integrations: () => [...adminKeys.all, "integrations"] as const,
  runs: (code: IntegrationCode) => [...adminKeys.all, "runs", code] as const,
  audit: (f: AuditFilters) => [...adminKeys.all, "audit", f] as const,
  health: () => [...adminKeys.all, "health"] as const,
};

export function useAdminUsers(f: AdminUserFilters) {
  return useQuery({
    queryKey: adminKeys.users(f),
    queryFn: () => adminApi.listUsers(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: adminKeys.user(userId ?? ""),
    queryFn: () => adminApi.getUser(userId!),
    enabled: !!userId,
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: adminKeys.integrations(),
    queryFn: () => adminApi.integrations(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useIntegrationRuns(code: IntegrationCode | undefined) {
  return useQuery({
    queryKey: adminKeys.runs(code ?? "FMIS"),
    queryFn: () => adminApi.integrationRuns(code!),
    enabled: !!code,
    refetchInterval: 15_000,
  });
}

export function useAuditLog(f: AuditFilters) {
  return useQuery({
    queryKey: adminKeys.audit(f),
    queryFn: () => adminApi.auditLog(f),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: () => adminApi.systemHealth(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}