import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { RequireAuth, RequirePermission } from "../guards";
import { useAuthStore } from "@/stores/auth.store";
import { rolePermissions } from "../auth.types";

const fakeUser = {
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

describe("guards", () => {
  beforeEach(() => useAuthStore.setState({ user: null }));

  it("RequireAuth redirects unauthenticated to /login", () => {
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("RequireAuth allows authenticated user", () => {
    useAuthStore.setState({ user: fakeUser });
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });

  it("RequirePermission shows 403 for missing permission", () => {
    useAuthStore.setState({ user: fakeUser });
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<RequirePermission perm={"admin:users" as any} />}>
            <Route path="/admin" element={<div>Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/Access denied/i);
  });

  it("RequirePermission allows user with permission", () => {
    useAuthStore.setState({ user: fakeUser });
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route element={<RequirePermission perm={"project:read" as any} />}>
            <Route path="/projects" element={<div>Projects</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });
});