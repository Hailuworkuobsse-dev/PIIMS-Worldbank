import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./admin.api";
import { adminKeys } from "./admin.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  CreateUserInput,
  UpdateUserInput,
  IntegrationCode,
} from "./admin.types";

export function useCreateUser() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: CreateUserInput) => adminApi.createUser(input),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      push("success", `User ${u.username} created`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Failed to create user"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({
      userId,
      patch,
    }: {
      userId: string;
      patch: UpdateUserInput;
    }) => adminApi.updateUser(userId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      push("success", "User updated");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Update failed"),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (userId: string) => adminApi.resetPassword(userId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      push("success", `Temporary password: ${res.temporaryPassword}`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Reset failed"),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminApi.deactivateUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      push("success", "User deactivated");
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Deactivate failed"),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (userId: string) => adminApi.reactivateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      push("success", "User reactivated");
    },
  });
}

export function useTriggerIntegrationSync() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (code: IntegrationCode) => adminApi.triggerSync(code),
    onSuccess: (_, code) => {
      qc.invalidateQueries({ queryKey: adminKeys.runs(code) });
      qc.invalidateQueries({ queryKey: adminKeys.integrations() });
      push("info", `Sync job queued for ${code}`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Sync trigger failed"),
  });
}