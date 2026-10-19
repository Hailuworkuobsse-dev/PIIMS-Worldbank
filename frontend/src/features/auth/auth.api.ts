import { api } from "@/lib/api/client";
import type {
  LoginRequest,
  LoginResponse,
  MFAChallengeRequest,
  AuthUser,
} from "./auth.types";

interface ApiEnvelope<T> {
  data: T;
}

export const authApi = {
  async login(req: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>(
      "/auth/login",
      req,
    );
    return data.data;
  },

  async completeMFA(req: MFAChallengeRequest): Promise<LoginResponse> {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>(
      "/auth/mfa/verify",
      req,
    );
    return data.data;
  },

  async refresh(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number }> {
    const { data } = await api.post<
      ApiEnvelope<{ access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number }>
    >(
      "/auth/refresh",
      { refresh_token: refreshToken },
      { headers: { Authorization: "" } }, // refresh uses body token, not header
    );
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refresh_token: refreshToken });
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<ApiEnvelope<AuthUser>>("/auth/me");
    return data.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post("/auth/change-password", { old_password: oldPassword, new_password: newPassword });
  },

  async setupMfa(): Promise<{ secret: string; qrUri: string }> {
    const { data } = await api.post<ApiEnvelope<{ secret: string; qrUri: string }>>("/auth/mfa/setup");
    return data.data;
  },

  async enableMfa(code: string): Promise<void> {
    await api.post("/auth/mfa/enable", { mfa_code: code });
  },

  async acceptPolicy(policyVersion: string): Promise<void> {
    await api.post("/auth/consent", { policy_version: policyVersion });
  },

  async ssoStatus(): Promise<{ enabled: boolean; provider: string | null }> {
    const { data } = await api.get<ApiEnvelope<{ enabled: boolean; provider: string | null }>>("/auth/sso/status");
    return data.data;
  },

};