import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import { useAuthStore } from "@/stores/auth.store";
import { rolePermissions } from "../auth.types";

const baseUser = {
  userId: "u1",
  username: "x",
  fullName: "X",
  email: "x@x",
  orgId: "o1",
  orgName: "MoWE",
  role: "MW-PIU" as const,
  roleName: "PIU",
  permissions: rolePermissions("MW-PIU"),
  scope: { orgId: "o1", orgLevel: "FEDERAL" as const },
  mfaEnabled: false,
  locale: "en" as const,
  lastLoginAt: "",
};

describe("usePermissions", () => {
  beforeEach(() => useAuthStore.setState({ user: baseUser }));

  it("can() reflects role permissions", () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("project:write" as any)).toBe(true);
    expect(result.current.can("admin:users" as any)).toBe(false);
  });

  it("canAny() works", () => {
    const { result } = renderHook(() => usePermissions());
    expect(
      result.current.canAny("admin:users" as any, "project:write" as any),
    ).toBe(true);
    expect(
      result.current.canAny("admin:users" as any, "admin:roles" as any),
    ).toBe(false);
  });

  it("canAll() requires all", () => {
    const { result } = renderHook(() => usePermissions());
    expect(
      result.current.canAll("project:read" as any, "project:write" as any),
    ).toBe(true);
    expect(
      result.current.canAll("project:read" as any, "admin:users" as any),
    ).toBe(false);
  });

  it("isRole() works", () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isRole("MW-PIU")).toBe(true);
    expect(result.current.isRole("MW-IE")).toBe(false);
  });
});