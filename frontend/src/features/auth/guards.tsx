import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "./usePermissions";
import type { Permission, RoleCode } from "./auth.types";

/* -------------------------------------------------------------------------
 * <RequireAuth> — gate for authenticated routes
 * ------------------------------------------------------------------------- */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <Outlet />;
}

/* -------------------------------------------------------------------------
 * <RequirePermission> — gate by single or multiple permissions
 * ------------------------------------------------------------------------- */
export interface RequirePermissionProps {
  perm?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RequirePermission({
  perm,
  anyOf,
  allOf,
  fallback,
  redirectTo,
}: RequirePermissionProps) {
  const { can, canAny, canAll } = usePermissions();

  const ok =
    (!perm || can(perm)) &&
    (!anyOf || canAny(...anyOf)) &&
    (!allOf || canAll(...allOf));

  if (!ok) {
    if (fallback) return <>{fallback}</>;
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <ForbiddenPage />;
  }
  return <Outlet />;
}

/* -------------------------------------------------------------------------
 * <RequireRole> — gate by role membership (rare; prefer permissions)
 * ------------------------------------------------------------------------- */
export function RequireRole({
  roles,
  fallback,
}: {
  roles: RoleCode[];
  fallback?: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <ForbiddenPage />;
  }
  return <Outlet />;
}

/* -------------------------------------------------------------------------
 * Forbidden page — accessible 403
 * ------------------------------------------------------------------------- */
function ForbiddenPage() {
  return (
    <main
      id="main"
      role="alert"
      className="min-h-[60vh] flex items-center justify-center p-8"
    >
      <div className="text-center max-w-md">
        <div className="text-6xl font-extrabold text-primary-900">403</div>
        <h1 className="text-h2 mt-3">Access denied · መዳረሻ ተከልክሏል</h1>
        <p className="text-body-sm text-neutral-600 mt-2">
          Your role does not grant access to this area. Contact your
          administrator if you believe this is an error.
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-5 px-4 py-2 rounded-md bg-primary-700 text-white font-semibold"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}