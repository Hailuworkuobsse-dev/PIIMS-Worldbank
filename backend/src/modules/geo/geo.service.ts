import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { canAccessProject } from '@/lib/scope.js';
import { ForbiddenError, NotFoundError } from '@/lib/errors.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import { haversineKm, parseBbox } from './geo.utils.js';
import type {
  BeneficiaryMarkerDTO, InterventionMarkerDTO, GeoVerifyResponseDTO
} from './geo.types.js';
import type { MarkersQuery, GeoVerifyInput } from './geo.schemas.js';

/* ════════════════════════════════════════════════════════════════════
 * BENEFICIARY MARKERS
 * ════════════════════════════════════════════════════════════════════ */

export async function getBeneficiaryMarkers(
  query: MarkersQuery,
  scope: ScopeClaim
): Promise<BeneficiaryMarkerDTO[]> {
  const filters: Prisma.BeneficiaryWhereInput[] = [];

  if (query.region) filters.push({ region: query.region });
  if (query.woreda) filters.push({ woreda: query.woreda });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }

  // Scope filter
  if (scope.orgLevel === 'REGIONAL' && scope.regions?.length) {
    filters.push({ region: { in: scope.regions } });
  }
  if (scope.orgLevel === 'WOREDA' && scope.woredas?.length) {
    filters.push({ woreda: { in: scope.woredas } });
  }
  if (scope.orgLevel === 'KEBELE' && scope.kebeles?.length) {
    filters.push({ kebele: { in: scope.kebeles } });
  }

  // Bbox filter on Location
  if (query.bbox) {
    const bbox = parseBbox(query.bbox);
    filters.push({
      location: {
        latitude: { gte: bbox.south, lte: bbox.north },
        longitude: { gte: bbox.west, lte: bbox.east }
      }
    });
  }

  const rows = await prisma.beneficiary.findMany({
    where: {
      AND: filters.length ? filters : [{}],
      location: { latitude: { not: null }, longitude: { not: null } }
    },
    include: { location: true },
    take: 5000
  });

  return rows
    .filter((b) => b.location?.latitude != null && b.location?.longitude != null)
    .map((b) => ({
      beneficiaryId: b.beneficiaryId,
      uniqueId: b.uniqueId,
      fullName: b.fullName,
      lat: b.location!.latitude!,
      lon: b.location!.longitude!,
      status: b.status,
      ...(b.woreda ? { woreda: b.woreda } : {}),
      ...(b.region ? { region: b.region } : {})
    }));
}

/* ════════════════════════════════════════════════════════════════════
 * INTERVENTION MARKERS
 * ════════════════════════════════════════════════════════════════════ */

export async function getInterventionMarkers(
  query: MarkersQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string
): Promise<InterventionMarkerDTO[]> {
  const filters: Prisma.ServiceDeliveryWhereInput[] = [
    { installLat: { not: null }, installLon: { not: null } }
  ];

  if (query.project_id) {
    const p = await prisma.project.findUnique({
      where: { projectId: query.project_id },
      include: { location: true }
    });
    if (!p) throw new NotFoundError('Project', query.project_id);
    if (!canAccessProject(scope, orgId, userId, {
      ownerOrgId: p.ownerOrgId, createdById: p.createdById, location: p.location
    })) throw new ForbiddenError('Access denied');
    filters.push({ projectId: query.project_id });
  }

  if (query.bbox) {
    const bbox = parseBbox(query.bbox);
    filters.push({
      installLat: { gte: bbox.south, lte: bbox.north },
      installLon: { gte: bbox.west, lte: bbox.east }
    });
  }

  const rows = await prisma.serviceDelivery.findMany({
    where: { AND: filters },
    include: {
      project: { select: { projectCode: true } },
      supplier: { select: { name: true } },
      product: { select: { name: true } }
    },
    take: 5000
  });

  return rows.map((d) => ({
    deliveryId: d.deliveryId,
    productName: d.product?.name ?? 'Product',
    ...(d.serialNo ? { serialNo: d.serialNo } : {}),
    lat: d.installLat!,
    lon: d.installLon!,
    ...(d.installDate ? { installDate: d.installDate.toISOString().slice(0, 10) } : {}),
    ...(d.supplier ? { supplierName: d.supplier.name } : {}),
    ...(d.project ? { projectCode: d.project.projectCode } : {})
  }));
}

/* ════════════════════════════════════════════════════════════════════
 * GEO VERIFY
 * ════════════════════════════════════════════════════════════════════ */

export async function verifyGeo(input: GeoVerifyInput): Promise<GeoVerifyResponseDTO> {
  let actual: { lat: number; lon: number } | null = null;

  if (input.entityType === 'BENEFICIARY') {
    const b = await prisma.beneficiary.findUnique({
      where: { beneficiaryId: input.entityId },
      include: { location: true }
    });
    if (!b) throw new NotFoundError('Beneficiary', input.entityId);
    if (b.location?.latitude != null && b.location?.longitude != null) {
      actual = { lat: b.location.latitude, lon: b.location.longitude };
    }
  } else {
    const d = await prisma.serviceDelivery.findUnique({
      where: { deliveryId: input.entityId }
    });
    if (!d) throw new NotFoundError('ServiceDelivery', input.entityId);
    if (d.installLat != null && d.installLon != null) {
      actual = { lat: d.installLat, lon: d.installLon };
    }
  }

  if (!actual) {
    return {
      match: false,
      distanceMeters: -1,
      verifiedAt: new Date().toISOString()
    };
  }

  const distanceKm = haversineKm(actual, input.claimedLocation);
  const distanceMeters = Math.round(distanceKm * 1000);
  const match = distanceMeters <= input.toleranceMeters;

  return {
    match,
    distanceMeters,
    verifiedAt: new Date().toISOString()
  };
}