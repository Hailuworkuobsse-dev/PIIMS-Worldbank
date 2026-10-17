import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { rolePermissions } from "@/features/auth/auth.types";
import * as api from "@/features/auth/auth.api";

vi.mock("@/features/auth/auth.api", () => ({
  authApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    completeMFA: vi.fn(),
  },
}));

const mockedApi = api.authApi as unknown as {
  login: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

const fakeUser = {
  userId: "u1",
  username: "test",
  fullName: "Test User",
  email: "t@x.et",
  orgId: "o1",
  orgName: "MoWE",
  role: "MW-PIU" as const,
  roleName: "MoWE PIU Officer",
  permissions: rolePermissions("MW-PIU"),
  scope: { orgId: "o1", orgLevel: "FEDERAL" as const, regions: ["Oromia"] },
  mfaEnabled: false,
  locale: "en" as const,
  lastLoginAt: "2026-10-16T00:00:00Z",
};

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      refreshExpiresAt: null,
      refreshing: null,
    });
    vi.clearAllMocks();
  });

  it("login sets session for non-MFA user", async () => {
    mockedApi.login.mockResolvedValueOnce({
      user: fakeUser,
      access_token: "a",
      refresh_token: "r",
      expires_in: 900,
      refresh_expires_in: 28800,
    });
    const res = await useAuthStore
      .getState()
      .login({ username: "x", password: "y" });
    expect(res.mfaRequired).toBe(false);
    expect(useAuthStore.getState().user?.userId).toBe("u1");
    expect(useAuthStore.getState().accessToken).toBe("a");
  });

  it("login returns mfaRequired when backend demands it", async () => {
    mockedApi.login.mockResolvedValueOnce({
      user: fakeUser,
      access_token: "",
      refresh_token: "",
      expires_in: 0,
      refresh_expires_in: 0,
      mfa_required: true,
      mfa_token: "mtok",
    });
    const res = await useAuthStore
      .getState()
      .login({ username: "x", password: "y" });
    expect(res.mfaRequired).toBe(true);
    expect(res.mfaToken).toBe("mtok");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("has() correctly reflects permissions", () => {
    useAuthStore.setState({ user: fakeUser });
    expect(useAuthStore.getState().has("project:read" as any)).toBe(true);
    expect(useAuthStore.getState().has("admin:users" as any)).toBe(false);
  });

  it("logout clears session and calls server", () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 1000,
      refreshExpiresAt: Date.now() + 10000,
    });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("single-flight refresh collapses concurrent calls", async () => {
    useAuthStore.setState({ refreshToken: "r", user: fakeUser });
    mockedApi.refresh.mockResolvedValue({
      access_token: "new",
      expires_in: 900,
    });
    const [a, b] = await Promise.all([
      useAuthStore.getState().refresh(),
      useAuthStore.getState().refresh(),
    ]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(mockedApi.refresh).toHaveBeenCalledTimes(1);
  });
});