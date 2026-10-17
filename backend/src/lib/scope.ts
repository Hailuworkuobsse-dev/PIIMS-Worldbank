import type { Prisma } from '@prisma/client';
import type { ScopeClaim } from './jwt.js';

/**
 * Translates a user's geographic/organizational scope into a Prisma
 * `where` fragment. Every list and get-by-id service calls this before
 * building its own query, ensuring no user can ever see data outside
 * their scope.
 */

export function projectScopeWhere(
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Prisma.ProjectWhereInput {
  // FEDERAL + no ownRecordsOnly = unrestricted
  if (scope.orgLevel === 'FEDERAL' && !scope.ownRecordsOnly) {
    return {};
  }

  // ownRecordsOnly = only own org's projects or own creations
  if (scope.ownRecordsOnly) {
    return {
      OR: [{ ownerOrgId: orgId }, { createdById: userId }]
    };
  }

  const conditions: Prisma.ProjectWhereInput[] = [];

  if (scope.orgLevel === 'REGIONAL' && scope.regions?.length) {
    conditions.push({ location: { region: { in: scope.regions } } });
  }
  if (scope.orgLevel === 'ZONAL' && scope.zones?.length) {
    conditions.push({ location: { zone: { in: scope.zones } } });
  }
  if (scope.orgLevel === 'WOREDA' && scope.woredas?.length) {
    conditions.push({ location: { woreda: { in: scope.woredas } } });
  }
  if (scope.orgLevel === 'KEBELE' && scope.kebeles?.length) {
    conditions.push({ location: { kebele: { in: scope.kebeles } } });
  }

  // Always include own org's projects (fallback)
  conditions.push({ ownerOrgId: orgId });

  return { OR: conditions };
}

/**
 * Beneficiary scope — used in M8, but the shape is established here so
 * M8+ can import it directly.
 */
export function beneficiaryScopeWhere(
  scope: ScopeClaim,
  orgId: string,
  _userId: string
): Prisma.BeneficiaryWhereInput {
  if (scope.orgLevel === 'FEDERAL' && !scope.ownRecordsOnly) {
    return {};
  }
  if (scope.ownRecordsOnly) {
    return { registrationChannel: { not: 'IMPORT' } }; // placeholder — refine in M8
  }
  const conditions: Prisma.BeneficiaryWhereInput[] = [];
  if (scope.orgLevel === 'REGIONAL' && scope.regions?.length) {
    conditions.push({ region: { in: scope.regions } });
  }
  if (scope.orgLevel === 'WOREDA' && scope.woredas?.length) {
    conditions.push({ woreda: { in: scope.woredas } });
  }
  if (scope.orgLevel === 'KEBELE' && scope.kebeles?.length) {
    conditions.push({ kebele: { in: scope.kebeles } });
  }
  return conditions.length ? { OR: conditions } : {};
}

/**
 * True if the user can operate on this specific project (used for
 * get-by-id, update, delete, advance).
 */
export function canAccessProject(
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  project: {
    ownerOrgId: string;
    createdById: string | null;
    location: {
      region: string | null;
      zone: string | null;
      woreda: string | null;
      kebele: string | null;
    } | null;
  }
): boolean {
  if (scope.orgLevel === 'FEDERAL' && !scope.ownRecordsOnly) return true;
  if (scope.ownRecordsOnly) {
    return project.ownerOrgId === orgId || project.createdById === userId;
  }
  if (project.ownerOrgId === orgId) return true;
  if (scope.orgLevel === 'REGIONAL' && scope.regions?.length) {
    return !!project.location?.region && scope.regions.includes(project.location.region);
  }
  if (scope.orgLevel === 'ZONAL' && scope.zones?.length) {
    return !!project.location?.zone && scope.zones.includes(project.location.zone);
  }
  if (scope.orgLevel === 'WOREDA' && scope.woredas?.length) {
    return !!project.location?.woreda && scope.woredas.includes(project.location.woreda);
  }
  if (scope.orgLevel === 'KEBELE' && scope.kebeles?.length) {
    return !!project.location?.kebele && scope.kebeles.includes(project.location.kebele);
  }
  return false;
}