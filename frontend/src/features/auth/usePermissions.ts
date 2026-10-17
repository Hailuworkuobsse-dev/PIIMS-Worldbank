import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "./auth.types";
import type { AuthScope } from "./auth.types";

export interface PermissionsApi {
  can: (p: Permission) => boolean;
  canAny: (...ps: Permission[]) => boolean;
  canAll: (...ps: Permission[]) => boolean;
  scope: AuthScope | null;
  isRole: (...roles: string[]) => boolean;
}

export function usePermissions(): PermissionsApi {
  const user = useAuthStore((s) => s.user);
  const permsSet = useMemo(() => new Set(user?.permissions ?? []), [user]);

  const can = useCallback((p: Permission) => permsSet.has(p), [permsSet]);
  const canAny = useCallback(
    (...ps: Permission[]) => ps.some((p) => permsSet.has(p)),
    [permsSet],
  );
  const canAll = useCallback(
    (...ps: Permission[]) => ps.every((p) => permsSet.has(p)),
    [permsSet],
  );
  const isRole = useCallback(
    (...roles: string[]) => !!user && roles.includes(user.role),
    [user],
  );

  return { can, canAny, canAll, scope: user?.scope ?? null, isRole };
}