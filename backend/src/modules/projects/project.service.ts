import { Prisma } from "@prisma/client";
import type { ProjectStatus } from "@prisma/client";

import type {
  CreateProjectInput,
  UpdateProjectInput,
  StageAdvanceInput,
  ListProjectsQuery,
} from "./project.schemas.js";
import type {
  FinancingLineDTO,
  ProjectDTO,
  ProjectSummaryDTO,
  StageAdvanceDTO,
  PipelineCountsDTO,
} from "./project.types.js";

import { logger } from "@/config/logger.js";
import { writeAudit } from "@/lib/audit.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors.js";
import type { ScopeClaim } from "@/lib/jwt.js";
import { prisma } from "@/lib/prisma.js";
import { canAccessProject, projectScopeWhere } from "@/lib/scope.js";
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
  decodeCursor,
} from "@/utils/pagination.js";

import type { FinancingLineDTO } from "./project.types.js";

/* ════════════════════════════════════════════════════════════════════
Shared include shape
════════════════════════════════════════════════════════════════════ */
const projectInclude = {
  ownerOrg: { select: { orgId: true, name: true, level: true, code: true } },
  location: true,
} satisfies Prisma.ProjectInclude;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

/* ════════════════════════════════════════════════════════════════════
Mappers
════════════════════════════════════════════════════════════════════ */
function toProjectDTO(project: ProjectWithRelations): ProjectDTO {
  return {
    projectId: project.projectId,
    projectCode: project.projectCode,
    name: project.name,
    ...(project.nameAm ? { nameAm: project.nameAm } : {}),
    ...(project.description ? { description: project.description } : {}),
    sector: project.sector,
    ...(project.subsector ? { subsector: project.subsector } : {}),
    status: project.status,
    ...(project.stageGate ? { stageGate: project.stageGate } : {}),
    ownerOrgId: project.ownerOrgId,
    ...(project.ownerOrg ? { ownerOrgName: project.ownerOrg.name } : {}),
    ...(project.location
      ? {
          location: {
            locationId: project.location.locationId,
            region: project.location.region,
            ...(project.location.zone ? { zone: project.location.zone } : {}),
            ...(project.location.woreda
              ? { woreda: project.location.woreda }
              : {}),
            ...(project.location.kebele
              ? { kebele: project.location.kebele }
              : {}),
            ...(project.location.latitude != null
              ? { latitude: project.location.latitude }
              : {}),
            ...(project.location.longitude != null
              ? { longitude: project.location.longitude }
              : {}),
          },
        }
      : {}),
    totalBudget: {
      amount: project.totalBudget.toString(),
      currency: project.currency,
    },
    ...(project.wbCreditNo ? { wbCreditNo: project.wbCreditNo } : {}),
    ...(project.approvalDate
      ? { approvalDate: project.approvalDate.toISOString().slice(0, 10) }
      : {}),
    ...(project.startDate
      ? { startDate: project.startDate.toISOString().slice(0, 10) }
      : {}),
    ...(project.endDate
      ? { endDate: project.endDate.toISOString().slice(0, 10) }
      : {}),
    ...(project.actualStart
      ? { actualStart: project.actualStart.toISOString().slice(0, 10) }
      : {}),
    ...(project.actualEnd
      ? { actualEnd: project.actualEnd.toISOString().slice(0, 10) }
      : {}),
    ...(project.implementationArrangement
      ? { implementationArrangement: project.implementationArrangement }
      : {}),
    ...(project.financingSource
      ? {
          financingSource:
            project.financingSource as unknown as ( FinancingLineDTO[] | undefined),
        }
      : {}),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    version: project.version,
  };
}

function toProjectSummaryDTO(project: ProjectWithRelations): ProjectSummaryDTO {
  return {
    projectId: project.projectId,
    projectCode: project.projectCode,
    name: project.name,
    sector: project.sector,
    status: project.status,
    totalBudget: {
      amount: project.totalBudget.toString(),
      currency: project.currency,
    },
    ...(project.startDate
      ? { startDate: project.startDate.toISOString().slice(0, 10) }
      : {}),
    ...(project.endDate
      ? { endDate: project.endDate.toISOString().slice(0, 10) }
      : {}),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    ...(project.ownerOrg ? { ownerOrgName: project.ownerOrg.name } : {}),
    ...(project.location?.region ? { region: project.location.region } : {}),
  };
}

/* ════════════════════════════════════════════════════════════════════
LIST
════════════════════════════════════════════════════════════════════ */
export async function listProjects(
  query: ListProjectsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<{
  data: ProjectSummaryDTO[];
  pagination: {
    nextCursor?: string;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  // Build filter
  const filters: Prisma.ProjectWhereInput[] = [
    { deletedAt: null },
    projectScopeWhere(scope, orgId, userId),
  ];

  if (query.q) {
    filters.push({
      OR: [
        { name: { contains: query.q } },
        { projectCode: { contains: query.q } },
      ],
    });
  }

  if (query.status) {
    const statuses = query.status.split(",").filter(Boolean) as ProjectStatus[];
    if (statuses.length) filters.push({ status: { in: statuses } });
  }

  if (query.sector) {
    const sectors = query.sector
      .split(",")
      .filter(Boolean) as Prisma.EnumProjectSectorFilter["in"];
    if (sectors) filters.push({ sector: { in: sectors } });
  }

  if (query.region) {
    filters.push({ location: { region: query.region } });
  }

  if (query.owner_org_id) {
    filters.push({ ownerOrgId: query.owner_org_id });
  }

  if (query.created_after) {
    filters.push({ createdAt: { gte: new Date(query.created_after) } });
  }

  if (query.created_before) {
    filters.push({ createdAt: { lte: new Date(query.created_before) } });
  }

  const where: Prisma.ProjectWhereInput = { AND: filters };

  // Cursor
  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  const cursorClause: Prisma.ProjectWhereInput | undefined = cursorId
    ? { projectId: { not: cursorId } } // simple skip for MVP
    : undefined;

  const orderBy = parseSort(query.sort, [
    "createdAt",
    "updatedAt",
    "name",
    "projectCode",
    "status",
    "startDate",
    "endDate",
    "totalBudget",
  ]);

  const [rows, totalCount] = await Promise.all([
    prisma.project.findMany({
      where: cursorClause ? { AND: [where, cursorClause] } : where,
      include: projectInclude,
      orderBy,
      take: pagination.limit + 1,
    }),
    prisma.project.count({ where }),
  ]);

  const { rows: trimmed, meta } = buildPaginationMeta(
    rows.map((r) => ({ id: r.projectId, ...r })),
    pagination.limit,
    totalCount,
  );

  const trimmedIds = new Set(trimmed.map((t) => t.id));
  const finalRows = rows.filter((r) => trimmedIds.has(r.projectId));

  return {
    data: finalRows.map(toProjectSummaryDTO),
    pagination: {
      ...(meta.nextCursor ? { nextCursor: meta.nextCursor } : {}),
      limit: meta.limit,
      totalCount: meta.totalCount,
      hasMore: meta.hasMore,
    },
  };
}

/* ════════════════════════════════════════════════════════════════════
GET by ID
════════════════════════════════════════════════════════════════════ */
export async function getProjectById(
  projectId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<ProjectDTO> {
  const project = await prisma.project.findFirst({
    where: { projectId, deletedAt: null },
    include: projectInclude,
  });

  if (!project) throw new NotFoundError("Project", projectId);

  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: project.ownerOrgId,
      createdById: project.createdById,
      location: project.location
        ? {
            region: project.location.region,
            zone: project.location.zone,
            woreda: project.location.woreda,
            kebele: project.location.kebele,
          }
        : null,
    })
  ) {
    throw new ForbiddenError("You do not have access to this project");
  }

  return toProjectDTO(project);
}

/**
 * Also allow lookup by projectCode — used by the frontend (routes like
 * `/projects/PIIMS-2026-0042`).
 */
export async function getProjectByCodeOrId(
  codeOrId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<ProjectDTO> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      codeOrId,
    );

  const project = await prisma.project.findFirst({
    where: isUuid
      ? { projectId: codeOrId, deletedAt: null }
      : { projectCode: codeOrId, deletedAt: null },
    include: projectInclude,
  });

  if (!project) throw new NotFoundError("Project", codeOrId);

  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: project.ownerOrgId,
      createdById: project.createdById,
      location: project.location
        ? {
            region: project.location.region,
            zone: project.location.zone,
            woreda: project.location.woreda,
            kebele: project.location.kebele,
          }
        : null,
    })
  ) {
    throw new ForbiddenError("You do not have access to this project");
  }

  return toProjectDTO(project);
}

/* ════════════════════════════════════════════════════════════════════
CREATE
════════════════════════════════════════════════════════════════════ */
export async function createProject(
  input: CreateProjectInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: {
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string | null;
  },
): Promise<ProjectDTO> {
  // ── Scope check — FEDERAL can create for any org; scoped users only for their org
  if (scope.orgLevel !== "FEDERAL" && input.ownerOrgId !== orgId) {
    throw new ForbiddenError(
      "You can only create projects for your own organization",
    );
  }

  // ── Verify owner org exists
  const ownerOrg = await prisma.organization.findUnique({
    where: { orgId: input.ownerOrgId },
    select: { orgId: true, status: true },
  });

  if (!ownerOrg || ownerOrg.status !== "ACTIVE") {
    throw new ValidationError(
      "Owner organization does not exist or is inactive",
    );
  }

  // ── Generate project code with retry on unique collision
  const project = await createProjectWithCode(input, userId);

  // ── Audit
  await writeAudit({
    userId,
    entity: "PROJECT",
    entityId: project.projectId,
    action: "CREATE",
    newValue: {
      projectCode: project.projectCode,
      name: project.name,
      sector: project.sector,
      status: project.status,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
  });

  return toProjectDTO(project);
}

async function createProjectWithCode(
  input: CreateProjectInput,
  userId: string,
  attempt = 1,
): Promise<ProjectWithRelations> {
  if (attempt > 5) {
    throw new ConflictError(
      "Could not generate a unique project code, please try again",
    );
  }

  const year = new Date().getFullYear();
  const prefix = `PIIMS-${year}-`;

  try {
    return await prisma.$transaction(async (tx) => {
      // Find current max sequence for this year
      const last = await tx.project.findFirst({
        where: { projectCode: { startsWith: prefix } },
        orderBy: { projectCode: "desc" },
        select: { projectCode: true },
      });

      let nextNumber = 1;
      if (last) {
        const parts = last.projectCode.split("-");
        if (parts[2]) {
          const parsed = parseInt(parts[2], 10);
          if (!isNaN(parsed)) nextNumber = parsed + 1;
        }
      }

      const projectCode = `${prefix}${String(nextNumber).padStart(4, "0")}`;

      // Create location if region is provided (always required per schema)
      const location = await tx.location.create({
        data: {
          region: input.region,
          ...(input.zone ? { zone: input.zone } : {}),
          ...(input.woreda ? { woreda: input.woreda } : {}),
          ...(input.kebele ? { kebele: input.kebele } : {}),
          ...(input.latitude != null ? { latitude: input.latitude } : {}),
          ...(input.longitude != null ? { longitude: input.longitude } : {}),
        },
      });

      const project = await tx.project.create({
        data: {
          projectCode,
          name: input.name,
          ...(input.nameAm ? { nameAm: input.nameAm } : {}),
          ...(input.description ? { description: input.description } : {}),
          sector: input.sector,
          ...(input.subsector ? { subsector: input.subsector } : {}),
          status: "IDEA",
          ownerOrgId: input.ownerOrgId,
          locationId: location.locationId,
          totalBudget: new Prisma.Decimal(input.totalBudget.amount),
          currency: input.totalBudget.currency,
          ...(input.wbCreditNo ? { wbCreditNo: input.wbCreditNo } : {}),
          ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
          ...(input.implementationArrangement
            ? { implementationArrangement: input.implementationArrangement }
            : {}),
          ...(input.financingSource
            ? {
                financingSource: input.financingSource as Prisma.InputJsonValue,
              }
            : {}),
          createdById: userId,
        },
        include: projectInclude,
      });

      return project;
    });
  } catch (err) {
    // Unique violation on projectCode → retry
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      attempt < 5
    ) {
      logger.warn(
        { attempt, projectCodePrefix: prefix },
        "project code collision, retrying",
      );
      return createProjectWithCode(input, userId, attempt + 1);
    }
    throw err;
  }
}

/* ════════════════════════════════════════════════════════════════════
UPDATE (with optimistic lock)
════════════════════════════════════════════════════════════════════ */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: {
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string | null;
  },
): Promise<ProjectDTO> {
  const existing = await prisma.project.findFirst({
    where: { projectId, deletedAt: null },
    include: projectInclude,
  });

  if (!existing) throw new NotFoundError("Project", projectId);

  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.ownerOrgId,
      createdById: existing.createdById,
      location: existing.location
        ? {
            region: existing.location.region,
            zone: existing.location.zone,
            woreda: existing.location.woreda,
            kebele: existing.location.kebele,
          }
        : null,
    })
  ) {
    throw new ForbiddenError("You do not have access to this project");
  }

  // ── Optimistic lock check
  if (existing.version !== input.version) {
    throw new ConflictError(
      "This project has been modified by someone else. Please reload and try again.",
    );
  }

  // ── Build update data
  const data: Prisma.ProjectUpdateInput = {
    version: { increment: 1 },
    updatedBy: { connect: { userId } },
  };

  if (input.name !== undefined) data.name = input.name;
  if (input.nameAm !== undefined) data.nameAm = input.nameAm || null;
  if (input.description !== undefined)
    data.description = input.description || null;
  if (input.subsector !== undefined) data.subsector = input.subsector || null;
  if (input.sector !== undefined) data.sector = input.sector;
  if (input.implementationArrangement !== undefined) {
    data.implementationArrangement = input.implementationArrangement || null;
  }
  if (input.wbCreditNo !== undefined)
    data.wbCreditNo = input.wbCreditNo || null;
  if (input.startDate !== undefined) {
    data.startDate = input.startDate ? new Date(input.startDate) : null;
  }
  if (input.endDate !== undefined) {
    data.endDate = input.endDate ? new Date(input.endDate) : null;
  }
  if (input.totalBudget !== undefined) {
    data.totalBudget = new Prisma.Decimal(input.totalBudget.amount);
    data.currency = input.totalBudget.currency;
  }
  if (input.financingSource !== undefined) {
    data.financingSource = input.financingSource as Prisma.InputJsonValue;
  }

  const updated = await prisma.project.update({
    where: { projectId, version: input.version },
    data,
    include: projectInclude,
  });

  await writeAudit({
    userId,
    entity: "PROJECT",
    entityId: projectId,
    action: "UPDATE",
    oldValue: {
      name: existing.name,
      status: existing.status,
      version: existing.version,
    },
    newValue: {
      name: updated.name,
      status: updated.status,
      version: updated.version,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
  });

  return toProjectDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
SOFT DELETE
════════════════════════════════════════════════════════════════════ */
export async function deleteProject(
  projectId: string,
  version: number,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: {
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string | null;
  },
): Promise<void> {
  const existing = await prisma.project.findFirst({
    where: { projectId, deletedAt: null },
    include: projectInclude,
  });

  if (!existing) throw new NotFoundError("Project", projectId);

  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.ownerOrgId,
      createdById: existing.createdById,
      location: existing.location
        ? {
            region: existing.location.region,
            zone: existing.location.zone,
            woreda: existing.location.woreda,
            kebele: existing.location.kebele,
          }
        : null,
    })
  ) {
    throw new ForbiddenError("You do not have access to this project");
  }

  if (existing.version !== version) {
    throw new ConflictError(
      "This project has been modified. Please reload and try again.",
    );
  }

  await prisma.project.update({
    where: { projectId, version },
    data: {
      deletedAt: new Date(),
      version: { increment: 1 },
    },
  });

  await writeAudit({
    userId,
    entity: "PROJECT",
    entityId: projectId,
    action: "DELETE",
    oldValue: {
      projectCode: existing.projectCode,
      name: existing.name,
      status: existing.status,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
  });
}

/* ════════════════════════════════════════════════════════════════════
ADVANCE STAGE
════════════════════════════════════════════════════════════════════ */
const STAGE_ORDER: ProjectStatus[] = [
  "IDEA",
  "PROFILE",
  "PRE_FEASIBILITY",
  "FEASIBILITY",
  "APPRAISAL",
  "APPROVED",
  "ACTIVE",
  "CLOSED",
];

export async function advanceStage(
  projectId: string,
  input: StageAdvanceInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  context: {
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string | null;
  },
): Promise<StageAdvanceDTO> {
  const existing = await prisma.project.findFirst({
    where: { projectId, deletedAt: null },
    include: projectInclude,
  });

  if (!existing) throw new NotFoundError("Project", projectId);

  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.ownerOrgId,
      createdById: existing.createdById,
      location: existing.location
        ? {
            region: existing.location.region,
            zone: existing.location.zone,
            woreda: existing.location.woreda,
            kebele: existing.location.kebele,
          }
        : null,
    })
  ) {
    throw new ForbiddenError("You do not have access to this project");
  }

  if (existing.status === "CANCELLED") {
    throw new BadRequestError("Cannot advance a cancelled project");
  }

  const currentIdx = STAGE_ORDER.indexOf(existing.status);
  const targetIdx = STAGE_ORDER.indexOf(input.targetStage);

  if (targetIdx === -1) {
    throw new BadRequestError("Invalid target stage");
  }

  if (targetIdx <= currentIdx) {
    throw new BadRequestError(
      `Cannot advance backwards (current: ${existing.status}, target: ${input.targetStage})`,
    );
  }

  if (targetIdx > currentIdx + 1) {
    throw new BadRequestError(
      `Cannot skip stages. Next stage is ${STAGE_ORDER[currentIdx + 1]}`,
    );
  }

  const updated = await prisma.project.update({
    where: { projectId },
    data: {
      status: input.targetStage,
      version: { increment: 1 },
    },
    include: projectInclude,
  });

  await writeAudit({
    userId,
    entity: "PROJECT",
    entityId: projectId,
    action: "APPROVE",
    oldValue: { status: existing.status },
    newValue: {
      status: input.targetStage,
      checklist: input.checklist,
      notes: input.notes,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
  });

  return {
    projectId: updated.projectId,
    projectCode: updated.projectCode,
    previousStatus: existing.status,
    newStatus: updated.status,
    advancedAt: new Date().toISOString(),
    advancedBy: userId,
  };
}

/* ════════════════════════════════════════════════════════════════════
PIPELINE COUNTS
════════════════════════════════════════════════════════════════════ */
export async function getPipelineCounts(
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<PipelineCountsDTO> {
  const where: Prisma.ProjectWhereInput = {
    AND: [{ deletedAt: null }, projectScopeWhere(scope, orgId, userId)],
  };

  const grouped = await prisma.project.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  const result: PipelineCountsDTO = {
    IDEA: 0,
    PROFILE: 0,
    PRE_FEASIBILITY: 0,
    FEASIBILITY: 0,
    APPRAISAL: 0,
    APPROVED: 0,
    ACTIVE: 0,
    CLOSED: 0,
    CANCELLED: 0,
  };

  for (const row of grouped) {
    result[row.status] = row._count.status;
  }

  return result;
}
