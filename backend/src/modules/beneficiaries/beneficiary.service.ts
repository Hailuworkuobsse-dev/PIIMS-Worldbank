import { Prisma, BeneficiaryStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { canAccessProject } from '@/lib/scope.js';
import { parsePagination, decodeCursor } from '@/utils/pagination.js';
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError
} from '@/lib/errors.js';
import type { ScopeClaim } from '@/lib/jwt.js';
import { scoreDuplicateMatch } from './beneficiary.utils.js';
import type {
  BeneficiaryDTO, DuplicateCandidateDTO, ServiceDeliveryDTO
} from './beneficiary.types.js';
import type {
  RegisterBeneficiaryInput, DedupCheckInput, ListBeneficiariesQuery,
  VerifyBeneficiaryInput, MergeBeneficiaryInput,
  CreateDeliveryInput, ListDeliveriesQuery, VerifyDeliveryInput
} from './beneficiary.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

/* ════════════════════════════════════════════════════════════════════
 * UNIQUE ID GENERATOR
 * ════════════════════════════════════════════════════════════════════ */

async function generateUniqueId(attempt = 1): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BEN-${year}-`;
  if (attempt > 5) throw new ConflictError('Could not generate a unique beneficiary ID');

  const last = await prisma.beneficiary.findFirst({
    where: { uniqueId: { startsWith: prefix } },
    orderBy: { uniqueId: 'desc' },
    select: { uniqueId: true }
  });

  const next = last ? parseInt(last.uniqueId.split('-')[2] || '0', 10) + 1 : 1;
  const candidate = `${prefix}${String(next).padStart(5, '0')}`;

  const exists = await prisma.beneficiary.findUnique({ where: { uniqueId: candidate } });
  if (exists) return generateUniqueId(attempt + 1);
  return candidate;
}

/* ════════════════════════════════════════════════════════════════════
 * DEDUP CHECK
 * ════════════════════════════════════════════════════════════════════ */

export async function checkDuplicates(input: DedupCheckInput): Promise<DuplicateCandidateDTO[]> {
  const candidates = await prisma.beneficiary.findMany({
    where: {
      status: { not: 'DUPLICATE' },
      OR: [
        ...(input.phone ? [{ phone: input.phone }] : []),
        ...(input.nationalId ? [{ nationalId: input.nationalId }] : []),
        ...(input.location.woreda ? [{ woreda: input.location.woreda }] : []),
        { region: input.location.region }
      ]
    },
    include: { location: true },
    take: 50
  });

  const scored = candidates
    .map((c) => {
      const { score, reasons } = scoreDuplicateMatch(
        {
          fullName: c.fullName,
          phone: c.phone,
          nationalId: c.nationalId,
          region: c.region,
          woreda: c.woreda
        },
        {
          fullName: input.fullName,
          phone: input.phone || null,
          nationalId: input.nationalId || null,
          region: input.location.region,
          woreda: input.location.woreda || null
        }
      );
      return {
        candidateId: c.beneficiaryId,
        fullName: c.fullName,
        uniqueId: c.uniqueId,
        region: c.region ?? '',
        woreda: c.woreda ?? '',
        ...(c.phone ? { phone: c.phone } : {}),
        dedupScore: Math.round(score * 100) / 100,
        matchReasons: reasons
      };
    })
    .filter((c) => c.dedupScore >= 0.6)
    .sort((a, b) => b.dedupScore - a.dedupScore);

  return scored;
}

/* ════════════════════════════════════════════════════════════════════
 * REGISTER
 * ════════════════════════════════════════════════════════════════════ */

export async function registerBeneficiary(
  input: RegisterBeneficiaryInput,
  userId: string,
  ctx: Ctx
): Promise<BeneficiaryDTO> {
  // Dedup check
  const duplicates = await checkDuplicates({
    fullName: input.fullName,
    gender: input.gender,
    phone: input.phone || '',
    nationalId: input.nationalId || '',
    location: input.location
  });

  const strong = duplicates.filter((d) => d.dedupScore >= 0.7);

  if (strong.length > 0 && !input.force_create) {
    throw Object.assign(
      new ConflictError('Potential duplicate beneficiary detected'),
      { details: { candidates: strong } }
    );
  }

  // Create location
  const location = await prisma.location.create({
    data: {
      region: input.location.region,
      ...(input.location.zone ? { zone: input.location.zone } : {}),
      ...(input.location.woreda ? { woreda: input.location.woreda } : {}),
      ...(input.location.kebele ? { kebele: input.location.kebele } : {}),
      ...(input.location.latitude != null ? { latitude: input.location.latitude } : {}),
      ...(input.location.longitude != null ? { longitude: input.location.longitude } : {})
    }
  });

  const uniqueId = await generateUniqueId();
  const topDedupScore = duplicates[0]?.dedupScore ?? 0;

  // Create beneficiary
  const beneficiary = await prisma.beneficiary.create({
    data: {
      uniqueId,
      fullName: input.fullName,
      ...(input.fullNameAm ? { fullNameAm: input.fullNameAm } : {}),
      gender: input.gender,
      ...(input.dateOfBirth ? { dateOfBirth: new Date(input.dateOfBirth) } : {}),
      ...(input.ageYears !== undefined ? { ageYears: input.ageYears } : {}),
      ...(input.householdSize !== undefined ? { householdSize: input.householdSize } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.nationalId ? { nationalId: input.nationalId } : {}),
      locationId: location.locationId,
      region: input.location.region,
      ...(input.location.woreda ? { woreda: input.location.woreda } : {}),
      ...(input.location.kebele ? { kebele: input.location.kebele } : {}),
      registrationChannel: input.registrationChannel,
      registrationDate: new Date(),
      status: 'REGISTERED',
      ...(topDedupScore > 0 ? { dedupScore: new Prisma.Decimal(topDedupScore) } : {})
    },
    include: { location: true }
  });

  // Create consent records
  const consentTypes: { type: any; given: boolean }[] = [
    { type: 'PARTICIPATION', given: input.consent.participation },
    { type: 'DATA_USE', given: input.consent.data_use },
    { type: 'FUTURE_RESEARCH', given: input.consent.future_research },
    { type: 'MEDIA', given: input.consent.media },
    { type: 'CONTACT', given: input.consent.contact }
  ];

  for (const c of consentTypes) {
    await prisma.consent.create({
      data: {
        beneficiaryId: beneficiary.beneficiaryId,
        consentType: c.type,
        consentGiven: c.given,
        consentVersion: input.consent.consent_version,
        consentText: 'Consent text version ' + input.consent.consent_version,
        language: input.consent.language,
        givenAt: new Date()
      }
    });
  }

  await writeAudit({
    userId, entity: 'BENEFICIARY', entityId: beneficiary.beneficiaryId, action: 'CREATE',
    newValue: {
      uniqueId: beneficiary.uniqueId,
      fullName: beneficiary.fullName,
      region: beneficiary.region,
      woreda: beneficiary.woreda,
      dedupScore: topDedupScore
    },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toBeneficiaryDTO(beneficiary);
}

/* ════════════════════════════════════════════════════════════════════
 * LIST
 * ════════════════════════════════════════════════════════════════════ */

export async function listBeneficiaries(
  query: ListBeneficiariesQuery,
  scope: ScopeClaim,
  _orgId: string
): Promise<{
  data: BeneficiaryDTO[];
  pagination: { nextCursor?: string; limit: number; totalCount: number; hasMore: boolean };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);
  const filters: Prisma.BeneficiaryWhereInput[] = [];

  if (query.q) {
    filters.push({
      OR: [
        { fullName: { contains: query.q } },
        { uniqueId: { contains: query.q } },
        { phone: { contains: query.q } }
      ]
    });
  }
  if (query.region) filters.push({ region: query.region });
  if (query.woreda) filters.push({ woreda: query.woreda });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.gender) {
    const genders = query.gender.split(',').filter(Boolean);
    if (genders.length) filters.push({ gender: { in: genders as any[] } });
  }
  if (query.registered_from) filters.push({ registrationDate: { gte: new Date(query.registered_from) } });
  if (query.registered_to) filters.push({ registrationDate: { lte: new Date(query.registered_to) } });
  if (query.sms_intake) {
    filters.push({
      registrationChannel: { in: ['SMS', 'USSD'] },
      status: 'REGISTERED'
    });
  }

  // Scope filter (LG officer sees own locality)
  if (scope.orgLevel !== 'FEDERAL') {
    if (scope.orgLevel === 'REGIONAL' && scope.regions?.length) {
      filters.push({ region: { in: scope.regions } });
    }
    if (scope.orgLevel === 'WOREDA' && scope.woredas?.length) {
      filters.push({ woreda: { in: scope.woredas } });
    }
    if (scope.orgLevel === 'KEBELE' && scope.kebeles?.length) {
      filters.push({ kebele: { in: scope.kebeles } });
    }
  }

  const where: Prisma.BeneficiaryWhereInput = filters.length ? { AND: filters } : {};

  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.BeneficiaryWhereInput | undefined = cursorId
    ? { beneficiaryId: { not: cursorId } }
    : undefined;

  const [rows, totalCount] = await Promise.all([
    prisma.beneficiary.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      include: {
        location: true,
        verifiedBy: { select: { fullName: true } }
      },
      orderBy: { registrationDate: 'desc' },
      take: pagination.limit
    }),
    prisma.beneficiary.count({ where })
  ]);

  return {
    data: rows.map(toBeneficiaryDTO),
    pagination: { limit: pagination.limit, totalCount, hasMore: totalCount > rows.length }
  };
}

export async function getBeneficiary(beneficiaryId: string): Promise<BeneficiaryDTO> {
  const b = await prisma.beneficiary.findUnique({
    where: { beneficiaryId },
    include: { location: true, verifiedBy: { select: { fullName: true } } }
  });
  if (!b) throw new NotFoundError('Beneficiary', beneficiaryId);
  return toBeneficiaryDTO(b);
}

/* ════════════════════════════════════════════════════════════════════
 * VERIFY
 * ════════════════════════════════════════════════════════════════════ */

export async function verifyBeneficiary(
  beneficiaryId: string,
  input: VerifyBeneficiaryInput,
  userId: string,
  ctx: Ctx
): Promise<BeneficiaryDTO> {
  const existing = await prisma.beneficiary.findUnique({ where: { beneficiaryId } });
  if (!existing) throw new NotFoundError('Beneficiary', beneficiaryId);

  const status: BeneficiaryStatus = input.verified ? 'VERIFIED' : 'INACTIVE';

  const updated = await prisma.beneficiary.update({
    where: { beneficiaryId },
    data: {
      status,
      verifiedById: input.verified ? userId : null,
      verifiedAt: input.verified ? new Date() : null
    },
    include: { location: true, verifiedBy: { select: { fullName: true } } }
  });

  await writeAudit({
    userId, entity: 'BENEFICIARY', entityId: beneficiaryId, action: 'APPROVE',
    oldValue: { status: existing.status }, newValue: { status },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toBeneficiaryDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * MERGE
 * ════════════════════════════════════════════════════════════════════ */

export async function mergeBeneficiary(
  primaryId: string,
  input: MergeBeneficiaryInput,
  userId: string,
  ctx: Ctx
): Promise<BeneficiaryDTO> {
  if (primaryId === input.duplicate_id) {
    throw new BadRequestError('Cannot merge a beneficiary with itself');
  }

  const [primary, duplicate] = await Promise.all([
    prisma.beneficiary.findUnique({ where: { beneficiaryId: primaryId } }),
    prisma.beneficiary.findUnique({ where: { beneficiaryId: input.duplicate_id } })
  ]);

  if (!primary) throw new NotFoundError('Beneficiary', primaryId);
  if (!duplicate) throw new NotFoundError('Beneficiary', input.duplicate_id);

  await prisma.$transaction([
    // Move service deliveries
    prisma.serviceDelivery.updateMany({
      where: { beneficiaryId: input.duplicate_id },
      data: { beneficiaryId: primaryId }
    }),
    // Move grievances
    prisma.grievance.updateMany({
      where: { beneficiaryId: input.duplicate_id },
      data: { beneficiaryId: primaryId }
    }),
    // Move consents
    prisma.consent.updateMany({
      where: { beneficiaryId: input.duplicate_id },
      data: { beneficiaryId: primaryId }
    }),
    // Mark duplicate
    prisma.beneficiary.update({
      where: { beneficiaryId: input.duplicate_id },
      data: {
        status: 'DUPLICATE',
        dedupScore: new Prisma.Decimal(1.0)
      }
    })
  ]);

  await writeAudit({
    userId, entity: 'BENEFICIARY', entityId: primaryId, action: 'UPDATE',
    newValue: { mergedFrom: input.duplicate_id, primary: primaryId },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getBeneficiary(primaryId);
}

/* ════════════════════════════════════════════════════════════════════
 * SERVICE DELIVERY
 * ════════════════════════════════════════════════════════════════════ */

export async function listServiceDeliveries(
  query: ListDeliveriesQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  role: string
): Promise<{
  data: ServiceDeliveryDTO[];
  pagination: { limit: number; totalCount: number; hasMore: boolean };
}> {
  const filters: Prisma.ServiceDeliveryWhereInput[] = [];

  if (query.project_id) {
    const p = await prisma.project.findFirst({ where: { projectId: query.project_id }, include: { location: true } });
    if (!p) throw new NotFoundError('Project', query.project_id);
    if (!canAccessProject(scope, orgId, userId, {
      ownerOrgId: p.ownerOrgId, createdById: p.createdById, location: p.location
    })) throw new ForbiddenError('Access denied');
    filters.push({ projectId: query.project_id });
  }
  if (query.supplier_id) filters.push({ supplierId: query.supplier_id });
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.q) filters.push({ serialNo: { contains: query.q } });

  // Supplier scope — only see own
  if (role.startsWith('SP-')) {
    const supplier = await prisma.supplier.findFirst({ where: { orgId } });
    if (!supplier) throw new ForbiddenError('No supplier account');
    filters.push({ supplierId: supplier.supplierId });
  }

  const where: Prisma.ServiceDeliveryWhereInput = filters.length ? { AND: filters } : {};
  const limit = Math.min(200, Number(query.limit) || 25);

  const [rows, totalCount] = await Promise.all([
    prisma.serviceDelivery.findMany({
      where,
      include: {
        beneficiary: { select: { fullName: true, uniqueId: true } },
        project: { select: { projectCode: true } },
        supplier: { select: { name: true } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.serviceDelivery.count({ where })
  ]);

  return {
    data: rows.map(toDeliveryDTO),
    pagination: { limit, totalCount, hasMore: totalCount > rows.length }
  };
}

export async function createServiceDelivery(
  input: CreateDeliveryInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  role: string,
  ctx: Ctx
): Promise<ServiceDeliveryDTO> {
  // Project access
  const project = await prisma.project.findFirst({
    where: { projectId: input.projectId, deletedAt: null },
    include: { location: true }
  });
  if (!project) throw new NotFoundError('Project', input.projectId);
  if (!canAccessProject(scope, orgId, userId, {
    ownerOrgId: project.ownerOrgId, createdById: project.createdById, location: project.location
  })) throw new ForbiddenError('Access denied');

  // Supplier role → restrict to own supplierId
  if (role.startsWith('SP-')) {
    const supplier = await prisma.supplier.findFirst({ where: { orgId } });
    if (!supplier) throw new ForbiddenError('No supplier account');
    if (input.supplierId && input.supplierId !== supplier.supplierId) {
      throw new ForbiddenError('Cannot record deliveries for another supplier');
    }
  }

  // Serial uniqueness
  if (input.serialNo) {
    const existing = await prisma.serviceDelivery.findFirst({
      where: { serialNo: input.serialNo }
    });
    if (existing) throw new ConflictError(`Serial number '${input.serialNo}' already registered`);
  }

  const created = await prisma.serviceDelivery.create({
    data: {
      beneficiaryId: input.beneficiaryId,
      projectId: input.projectId,
      ...(input.supplierId ? { supplierId: input.supplierId } : {}),
      ...(input.productId ? { productId: input.productId } : {}),
      ...(input.serialNo ? { serialNo: input.serialNo } : {}),
      quantity: input.quantity,
      ...(input.installDate ? { installDate: new Date(input.installDate) } : {}),
      ...(input.installGps ? { installLat: input.installGps.lat, installLon: input.installGps.lon } : {}),
      ...(input.warrantyStart ? { warrantyStart: new Date(input.warrantyStart) } : {}),
      ...(input.warrantyEnd ? { warrantyEnd: new Date(input.warrantyEnd) } : {}),
      status: input.status
    },
    include: {
      beneficiary: { select: { fullName: true, uniqueId: true } },
      project: { select: { projectCode: true } },
      supplier: { select: { name: true } },
      product: { select: { name: true } }
    }
  });

  await writeAudit({
    userId, entity: 'SERVICE_DELIVERY', entityId: created.deliveryId, action: 'CREATE',
    newValue: { serialNo: input.serialNo, beneficiaryId: input.beneficiaryId },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toDeliveryDTO(created);
}

export async function verifyDelivery(
  deliveryId: string,
  input: VerifyDeliveryInput,
  userId: string,
  ctx: Ctx
): Promise<ServiceDeliveryDTO> {
  const existing = await prisma.serviceDelivery.findUnique({ where: { deliveryId } });
  if (!existing) throw new NotFoundError('ServiceDelivery', deliveryId);

  const updated = await prisma.serviceDelivery.update({
    where: { deliveryId },
    data: {
      status: input.verified ? 'VERIFIED' : 'FAILED',
      verifiedById: input.verified ? userId : null,
      verifiedAt: input.verified ? new Date() : null
    },
    include: {
      beneficiary: { select: { fullName: true, uniqueId: true } },
      project: { select: { projectCode: true } },
      supplier: { select: { name: true } },
      product: { select: { name: true } }
    }
  });

  await writeAudit({
    userId, entity: 'SERVICE_DELIVERY', entityId: deliveryId, action: 'APPROVE',
    oldValue: { status: existing.status }, newValue: { status: updated.status },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return toDeliveryDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
 * MAPPERS
 * ════════════════════════════════════════════════════════════════════ */

function toBeneficiaryDTO(b: any): BeneficiaryDTO {
  return {
    beneficiaryId: b.beneficiaryId,
    uniqueId: b.uniqueId,
    ...(b.nationalId ? { nationalId: b.nationalId } : {}),
    fullName: b.fullName,
    ...(b.fullNameAm ? { fullNameAm: b.fullNameAm } : {}),
    gender: b.gender,
    ...(b.dateOfBirth ? { dateOfBirth: b.dateOfBirth.toISOString().slice(0, 10) } : {}),
    ...(b.ageYears != null ? { ageYears: b.ageYears } : {}),
    ...(b.householdSize != null ? { householdSize: b.householdSize } : {}),
    ...(b.phone ? { phone: b.phone } : {}),
    location: b.location ? {
      locationId: b.location.locationId,
      region: b.location.region,
      ...(b.location.zone ? { zone: b.location.zone } : {}),
      ...(b.location.woreda ? { woreda: b.location.woreda } : {}),
      ...(b.location.kebele ? { kebele: b.location.kebele } : {}),
      ...(b.location.latitude != null ? { latitude: b.location.latitude } : {}),
      ...(b.location.longitude != null ? { longitude: b.location.longitude } : {})
    } : { region: b.region ?? '' },
    registrationChannel: b.registrationChannel,
    registrationDate: b.registrationDate.toISOString().slice(0, 10),
    status: b.status,
    ...(b.verifiedById ? { verifiedById: b.verifiedById } : {}),
    ...(b.verifiedBy ? { verifiedByName: b.verifiedBy.fullName } : {}),
    ...(b.verifiedAt ? { verifiedAt: b.verifiedAt.toISOString() } : {}),
    ...(b.dedupScore != null ? { dedupScore: Number(b.dedupScore) } : {})
  };
}

function toDeliveryDTO(d: any): ServiceDeliveryDTO {
  return {
    deliveryId: d.deliveryId,
    beneficiaryId: d.beneficiaryId,
    beneficiaryName: d.beneficiary?.fullName ?? '',
    beneficiaryUniqueId: d.beneficiary?.uniqueId ?? '',
    projectId: d.projectId,
    projectCode: d.project?.projectCode ?? '',
    ...(d.supplierId ? { supplierId: d.supplierId } : {}),
    ...(d.supplier ? { supplierName: d.supplier.name } : {}),
    ...(d.productId ? { productId: d.productId } : {}),
    productName: d.product?.name ?? '',
    ...(d.serialNo ? { serialNo: d.serialNo } : {}),
    quantity: d.quantity,
    ...(d.installDate ? { installDate: d.installDate.toISOString().slice(0, 10) } : {}),
    ...(d.installLat != null && d.installLon != null
      ? { installGps: { lat: d.installLat, lon: d.installLon } } : {}),
    ...(d.warrantyStart ? { warrantyStart: d.warrantyStart.toISOString().slice(0, 10) } : {}),
    ...(d.warrantyEnd ? { warrantyEnd: d.warrantyEnd.toISOString().slice(0, 10) } : {}),
    status: d.status,
    ...(d.verifiedById ? { verifiedById: d.verifiedById } : {}),
    ...(d.verifiedAt ? { verifiedAt: d.verifiedAt.toISOString() } : {}),
    createdAt: d.createdAt.toISOString()
  };
}