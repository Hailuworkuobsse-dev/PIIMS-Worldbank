/**
 * Permission matching with wildcards.
 *
 * Rules:
 *   - "*"          → all permissions
 *   - "project:*"  → any permission starting with "project:"
 *   - "project:read" → exact match
 */
export function matchesPermission(granted: string, required: string): boolean {
  if (granted === '*') return true;
  if (granted === required) return true;
  if (granted.endsWith(':*')) {
    const prefix = granted.slice(0, -2);
    return required.startsWith(prefix + ':');
  }
  return false;
}

export function hasPermission(granted: string[], required: string): boolean {
  return granted.some((g) => matchesPermission(g, required));
}

export function hasAnyPermission(granted: string[], required: string[]): boolean {
  return required.some((r) => hasPermission(granted, r));
}

export function hasAllPermissions(granted: string[], required: string[]): boolean {
  return required.every((r) => hasPermission(granted, r));
}

/**
 * Build a scope claim from a role's `scope` field + org info.
 * Used at login time to embed scope in the JWT.
 */
export function buildScopeClaim(roleScope: string, orgLevel: string): {
  orgLevel: 'FEDERAL' | 'REGIONAL' | 'ZONAL' | 'WOREDA' | 'KEBELE' | 'EXTERNAL';
  regions?: string[];
  zones?: string[];
  woredas?: string[];
  kebeles?: string[];
  ownRecordsOnly?: boolean;
} {
  // Map role scope strings to org levels
  switch (roleScope) {
    case 'GLOBAL':
    case 'NATIONAL':
      return {
        orgLevel: orgLevel === 'FEDERAL' ? 'FEDERAL' : 'EXTERNAL'
      };
    case 'REGIONAL':
      return { orgLevel: 'REGIONAL', regions: [] };
    case 'ZONAL':
      return { orgLevel: 'ZONAL', zones: [] };
    case 'WOREDA':
      return { orgLevel: 'WOREDA', woredas: [] };
    case 'KEBELE':
      return { orgLevel: 'KEBELE', kebeles: [] };
    case 'OWN':
      return { orgLevel: 'FEDERAL', ownRecordsOnly: true };
    default:
      return { orgLevel: 'FEDERAL' };
  }
}