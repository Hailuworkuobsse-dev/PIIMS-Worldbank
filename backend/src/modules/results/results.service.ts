import { Prisma } from "@prisma/client";
import type {
  IndicatorDirection,
  IndicatorFrequency,
  IndicatorType,
  TrafficLight,
} from "@prisma/client";

import type {
  AggregateQuery,
  CreateComponentInput,
  CreateIndicatorInput,
  CreateSubcomponentInput,
  ListIndicatorsQuery,
  RecordValueInput,
  UpdateComponentInput,
  UpdateIndicatorInput,
  UpdateSubcomponentInput,
} from "./results.schemas.js";
import type {
  AggregationRowDTO,
  ComponentDTO,
  IndicatorDTO,
  IndicatorValueDTO,
  SubcomponentDTO,
} from "./results.types.js";
import { computeAchievement, computeTrafficLight } from "./results.utils.js";

import { writeAudit } from "@/lib/audit.js";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors.js";
import type { ScopeClaim } from "@/lib/jwt.js";
import { prisma } from "@/lib/prisma.js";
import { canAccessProject } from "@/lib/scope.js";
import { renderExcel } from "@/modules/reports/renderers/excel.renderer.js";

type Ctx = {
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
};

/* ════════════════════════════════════════════════════════════════════
Helpers
════════════════════════════════════════════════════════════════════ */
async function assertProjectAccess(
  projectId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { projectId, deletedAt: null },
    include: { location: true },
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
}

/* ════════════════════════════════════════════════════════════════════
COMPONENTS
════════════════════════════════════════════════════════════════════ */
export async function listComponents(
  projectId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<ComponentDTO[]> {
  await assertProjectAccess(projectId, scope, orgId, userId);
  const rows = await prisma.component.findMany({
    where: { projectId },
    orderBy: { orderNo: "asc" },
  });
  return rows.map(toComponentDTO);
}

export async function createComponent(
  projectId: string,
  input: CreateComponentInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<ComponentDTO> {
  await assertProjectAccess(projectId, scope, orgId, userId);
  try {
    const created = await prisma.component.create({
      data: {
        projectId,
        code: input.code,
        name: input.name,
        ...(input.nameAm ? { nameAm: input.nameAm } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.budget ? { budget: new Prisma.Decimal(input.budget) } : {}),
        ...(input.responsibleOrgId
          ? { responsibleOrgId: input.responsibleOrgId }
          : {}),
        orderNo: input.orderNo,
      },
    });
    await writeAudit({
      userId,
      entity: "COMPONENT",
      entityId: created.componentId,
      action: "CREATE",
      newValue: { projectId, code: created.code, name: created.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });
    return toComponentDTO(created);
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictError(
        `Component code '${input.code}' already exists in this project`,
      );
    }
    throw err;
  }
}

export async function updateComponent(
  componentId: string,
  input: UpdateComponentInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<ComponentDTO> {
  const existing = await prisma.component.findUnique({
    where: { componentId },
    include: { project: { include: { location: true } } },
  });
  if (!existing) throw new NotFoundError("Component", componentId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.project.ownerOrgId,
      createdById: existing.project.createdById,
      location: existing.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  const data: Prisma.ComponentUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.nameAm !== undefined) data.nameAm = input.nameAm || null;
  if (input.description !== undefined)
    data.description = input.description || null;
  if (input.budget !== undefined)
    data.budget = input.budget ? new Prisma.Decimal(input.budget) : null;
  if (input.responsibleOrgId !== undefined) {
    data.responsibleOrg = input.responsibleOrgId
      ? { connect: { orgId: input.responsibleOrgId } }
      : { disconnect: true };
  }
  if (input.orderNo !== undefined) data.orderNo = input.orderNo;

  const updated = await prisma.component.update({
    where: { componentId },
    data,
  });
  await writeAudit({
    userId,
    entity: "COMPONENT",
    entityId: componentId,
    action: "UPDATE",
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
  });
  return toComponentDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
SUBCOMPONENTS
════════════════════════════════════════════════════════════════════ */
export async function listSubcomponents(
  componentId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<SubcomponentDTO[]> {
  const component = await prisma.component.findUnique({
    where: { componentId },
    include: { project: { include: { location: true } } },
  });
  if (!component) throw new NotFoundError("Component", componentId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: component.project.ownerOrgId,
      createdById: component.project.createdById,
      location: component.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  const rows = await prisma.subcomponent.findMany({
    where: { componentId },
    orderBy: { orderNo: "asc" },
  });
  return rows.map(toSubcomponentDTO);
}

export async function createSubcomponent(
  componentId: string,
  input: CreateSubcomponentInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<SubcomponentDTO> {
  const component = await prisma.component.findUnique({
    where: { componentId },
    include: { project: { include: { location: true } } },
  });
  if (!component) throw new NotFoundError("Component", componentId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: component.project.ownerOrgId,
      createdById: component.project.createdById,
      location: component.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  try {
    const created = await prisma.subcomponent.create({
      data: {
        componentId,
        projectId: component.projectId,
        code: input.code,
        name: input.name,
        ...(input.nameAm ? { nameAm: input.nameAm } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.budget ? { budget: new Prisma.Decimal(input.budget) } : {}),
        ...(input.responsibleOrgId
          ? { responsibleOrgId: input.responsibleOrgId }
          : {}),
        orderNo: input.orderNo,
      },
    });
    await writeAudit({
      userId,
      entity: "SUBCOMPONENT",
      entityId: created.subcomponentId,
      action: "CREATE",
      newValue: { componentId, code: created.code, name: created.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });
    return toSubcomponentDTO(created);
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictError(
        `Subcomponent code '${input.code}' already exists in this component`,
      );
    }
    throw err;
  }
}

export async function updateSubcomponent(
  subcomponentId: string,
  input: UpdateSubcomponentInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<SubcomponentDTO> {
  const existing = await prisma.subcomponent.findUnique({
    where: { subcomponentId },
    include: { project: { include: { location: true } } },
  });
  if (!existing) throw new NotFoundError("Subcomponent", subcomponentId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.project.ownerOrgId,
      createdById: existing.project.createdById,
      location: existing.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  const data: Prisma.SubcomponentUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.nameAm !== undefined) data.nameAm = input.nameAm || null;
  if (input.description !== undefined)
    data.description = input.description || null;
  if (input.budget !== undefined)
    data.budget = input.budget ? new Prisma.Decimal(input.budget) : null;
  if (input.orderNo !== undefined) data.orderNo = input.orderNo;

  const updated = await prisma.subcomponent.update({
    where: { subcomponentId },
    data,
  });
  await writeAudit({
    userId,
    entity: "SUBCOMPONENT",
    entityId: subcomponentId,
    action: "UPDATE",
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
  });
  return toSubcomponentDTO(updated);
}

/* ════════════════════════════════════════════════════════════════════
INDICATORS
════════════════════════════════════════════════════════════════════ */
export async function listIndicators(
  query: ListIndicatorsQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<IndicatorDTO[]> {
  const filters: Prisma.IndicatorWhereInput[] = [];
  if (query.project_id) {
    await assertProjectAccess(query.project_id, scope, orgId, userId);
    filters.push({ projectId: query.project_id });
  }
  if (query.component_id)
    filters.push({ subcomponent: { componentId: query.component_id } });
  if (query.subcomponent_id)
    filters.push({ subcomponentId: query.subcomponent_id });
  if (query.status) {
    const statuses = query.status.split(",").filter(Boolean) as TrafficLight[];
    if (statuses.length) filters.push({ status: { in: statuses } });
  }
  if (query.type) {
    const types = query.type.split(",").filter(Boolean) as IndicatorType[];
    if (types.length) filters.push({ indicatorType: { in: types } });
  }
  if (query.q) {
    filters.push({
      OR: [{ name: { contains: query.q } }, { code: { contains: query.q } }],
    });
  }
  // Scope enforcement via project ownership
  if (scope.orgLevel !== "FEDERAL" || scope.ownRecordsOnly) {
    filters.push({
      project: { OR: [{ ownerOrgId: orgId }, { createdById: userId }] },
    });
  }
  const rows = await prisma.indicator.findMany({
    where: filters.length ? { AND: filters } : {},
    include: { subcomponent: { select: { componentId: true } } },
    orderBy: [{ code: "asc" }],
  });
  return rows.map((r) => toIndicatorDTO(r, r.subcomponent.componentId));
}

export async function getIndicator(
  indicatorId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<IndicatorDTO> {
  const row = await prisma.indicator.findUnique({
    where: { indicatorId },
    include: {
      subcomponent: { select: { componentId: true } },
      project: { include: { location: true } },
    },
  });
  if (!row) throw new NotFoundError("Indicator", indicatorId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: row.project.ownerOrgId,
      createdById: row.project.createdById,
      location: row.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  return toIndicatorDTO(row, row.subcomponent.componentId);
}

export async function createIndicator(
  input: CreateIndicatorInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<IndicatorDTO> {
  const sub = await prisma.subcomponent.findUnique({
    where: { subcomponentId: input.subcomponentId },
    include: { project: { include: { location: true } } },
  });
  if (!sub) throw new NotFoundError("Subcomponent", input.subcomponentId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: sub.project.ownerOrgId,
      createdById: sub.project.createdById,
      location: sub.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  const achievement = computeAchievement(
    input.baseline ?? 0,
    input.target ?? 0,
    null,
    input.direction,
  );
  const status = computeTrafficLight(achievement);
  try {
    const created = await prisma.indicator.create({
      data: {
        subcomponentId: input.subcomponentId,
        projectId: sub.projectId,
        code: input.code,
        name: input.name,
        ...(input.nameAm ? { nameAm: input.nameAm } : {}),
        ...(input.description ? { description: input.description } : {}),
        indicatorType: input.indicatorType,
        unit: input.unit,
        ...(input.baseline !== undefined
          ? { baseline: new Prisma.Decimal(input.baseline) }
          : {}),
        ...(input.baselineDate
          ? { baselineDate: new Date(input.baselineDate) }
          : {}),
        ...(input.target !== undefined
          ? { target: new Prisma.Decimal(input.target) }
          : {}),
        ...(input.targetDate ? { targetDate: new Date(input.targetDate) } : {}),
        frequency: input.frequency,
        direction: input.direction,
        ...(input.method ? { method: input.method } : {}),
        disaggregation: input.disaggregation ?? [],
        status,
        ...(achievement != null ? { actual: new Prisma.Decimal(0) } : {}),
      },
      include: { subcomponent: { select: { componentId: true } } },
    });
    await writeAudit({
      userId,
      entity: "INDICATOR",
      entityId: created.indicatorId,
      action: "CREATE",
      newValue: {
        code: created.code,
        name: created.name,
        projectId: sub.projectId,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
    });
    return toIndicatorDTO(created, created.subcomponent.componentId);
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictError(
        `Indicator code '${input.code}' already exists in this subcomponent`,
      );
    }
    throw err;
  }
}

export async function updateIndicator(
  indicatorId: string,
  input: UpdateIndicatorInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<IndicatorDTO> {
  const existing = await prisma.indicator.findUnique({
    where: { indicatorId },
    include: {
      subcomponent: { select: { componentId: true } },
      project: { include: { location: true } },
    },
  });
  if (!existing) throw new NotFoundError("Indicator", indicatorId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: existing.project.ownerOrgId,
      createdById: existing.project.createdById,
      location: existing.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  const data: Prisma.IndicatorUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.nameAm !== undefined) data.nameAm = input.nameAm || null;
  if (input.description !== undefined)
    data.description = input.description || null;
  if (input.indicatorType !== undefined)
    data.indicatorType = input.indicatorType;
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.baseline !== undefined)
    data.baseline = new Prisma.Decimal(input.baseline);
  if (input.baselineDate !== undefined) {
    data.baselineDate = input.baselineDate
      ? new Date(input.baselineDate)
      : null;
  }
  if (input.target !== undefined)
    data.target = new Prisma.Decimal(input.target);
  if (input.targetDate !== undefined) {
    data.targetDate = input.targetDate ? new Date(input.targetDate) : null;
  }
  if (input.frequency !== undefined) data.frequency = input.frequency;
  if (input.direction !== undefined) data.direction = input.direction;
  if (input.method !== undefined) data.method = input.method || null;
  if (input.disaggregation !== undefined)
    data.disaggregation = input.disaggregation;

  // Recompute achievement if baseline/target/actual changed
  const baseline = input.baseline ?? Number(existing.baseline ?? 0);
  const target = input.target ?? Number(existing.target ?? 0);
  const actual = Number(existing.actual ?? 0);
  const direction = input.direction ?? existing.direction;
  const achievement = computeAchievement(baseline, target, actual, direction);
  data.status = computeTrafficLight(achievement);

  const updated = await prisma.indicator.update({
    where: { indicatorId },
    data,
    include: { subcomponent: { select: { componentId: true } } },
  });
  await writeAudit({
    userId,
    entity: "INDICATOR",
    entityId: indicatorId,
    action: "UPDATE",
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
  });
  return toIndicatorDTO(updated, updated.subcomponent.componentId);
}

/* ════════════════════════════════════════════════════════════════════
INDICATOR VALUES
════════════════════════════════════════════════════════════════════ */
export async function listIndicatorValues(
  indicatorId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<IndicatorValueDTO[]> {
  await getIndicator(indicatorId, scope, orgId, userId);
  const rows = await prisma.indicatorValue.findMany({
    where: { indicatorId },
    orderBy: [{ fiscalYear: "desc" }, { period: "desc" }],
    include: { verifiedBy: { select: { fullName: true } } },
  });
  return rows.map(toIndicatorValueDTO);
}

export async function recordValue(
  indicatorId: string,
  input: RecordValueInput,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
  ctx: Ctx,
): Promise<IndicatorValueDTO> {
  const indicator = await prisma.indicator.findUnique({
    where: { indicatorId },
    include: { project: { include: { location: true } } },
  });
  if (!indicator) throw new NotFoundError("Indicator", indicatorId);
  if (
    !canAccessProject(scope, orgId, userId, {
      ownerOrgId: indicator.project.ownerOrgId,
      createdById: indicator.project.createdById,
      location: indicator.project.location,
    })
  ) {
    throw new ForbiddenError("Access denied");
  }
  const target = input.target ?? Number(indicator.target ?? 0);
  const baseline = Number(indicator.baseline ?? 0);
  const achievement = computeAchievement(
    baseline,
    target,
    input.value,
    indicator.direction,
  );

  // Upsert value
  const value = await prisma.indicatorValue.upsert({
    where: {
      indicatorId_period: { indicatorId, period: input.period },
    },
    create: {
      indicatorId,
      period: input.period,
      fiscalYear: input.fiscalYear,
      value: new Prisma.Decimal(input.value),
      ...(input.target !== undefined
        ? { target: new Prisma.Decimal(input.target) }
        : {}),
      ...(achievement != null
        ? { achievementPct: new Prisma.Decimal(achievement) }
        : {}),
      ...(input.disaggregation
        ? { disaggregation: input.disaggregation as Prisma.InputJsonValue }
        : {}),
      ...(input.dataSource ? { dataSource: input.dataSource } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    },
    update: {
      value: new Prisma.Decimal(input.value),
      ...(input.target !== undefined
        ? { target: new Prisma.Decimal(input.target) }
        : {}),
      ...(achievement != null
        ? { achievementPct: new Prisma.Decimal(achievement) }
        : {}),
      ...(input.disaggregation
        ? { disaggregation: input.disaggregation as Prisma.InputJsonValue }
        : {}),
      ...(input.dataSource ? { dataSource: input.dataSource } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    },
    include: { verifiedBy: { select: { fullName: true } } },
  });

  // Update indicator's "actual" + status (latest period wins)
  const latest = await prisma.indicatorValue.findFirst({
    where: { indicatorId },
    orderBy: [{ fiscalYear: "desc" }, { period: "desc" }],
  });
  if (latest) {
    const newAchievement = computeAchievement(
      Number(indicator.baseline ?? 0),
      Number(indicator.target ?? 0),
      Number(latest.value),
      indicator.direction,
    );
    await prisma.indicator.update({
      where: { indicatorId },
      data: {
        actual: latest.value,
        status: computeTrafficLight(newAchievement),
      },
    });
  }
  await writeAudit({
    userId,
    entity: "INDICATOR_VALUE",
    entityId: value.valueId,
    action: "CREATE",
    newValue: { indicatorId, period: input.period, value: input.value },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
  });
  return toIndicatorValueDTO(value);
}

/* ════════════════════════════════════════════════════════════════════
AGGREGATION
════════════════════════════════════════════════════════════════════ */
export async function aggregateResults(
  query: AggregateQuery,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<AggregationRowDTO[]> {
  await assertProjectAccess(query.project_id, scope, orgId, userId);
  const indicatorsRaw = await prisma.indicator.findMany({
    where: { projectId: query.project_id },
    include: {
      subcomponent: {
        select: {
          componentId: true,
          component: { select: { name: true, code: true } },
        },
      },
      project: { select: { location: { select: { region: true } } } },
    },
  });

  const indicators = indicatorsRaw.map((ind) => ({
    ...ind,
    achievementPct: computeAchievement(
      Number(ind.baseline ?? 0),
      Number(ind.target ?? 0),
      Number(ind.actual ?? 0),
      ind.direction,
    ),
  }));

  if (query.group_by === "component") {
    return aggregateByComponent(indicators);
  }
  if (query.group_by === "region") {
    return aggregateByRegion(indicators, query.project_id);
  }
  return aggregateByGender(indicators, query.project_id);
}

function aggregateByComponent(
  indicators: Array<{
    status: TrafficLight;
    achievementPct: unknown;
    subcomponent: {
      componentId: string;
      component: { name: string; code: string };
    };
  }>,
): AggregationRowDTO[] {
  const groups = new Map<
    string,
    AggregationRowDTO & { achievementSum: number; achievementCount: number }
  >();
  for (const ind of indicators) {
    const key = ind.subcomponent.componentId;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: `${ind.subcomponent.component.code} · ${ind.subcomponent.component.name}`,
        indicatorCount: 0,
        onTrack: 0,
        atRisk: 0,
        offTrack: 0,
        notStarted: 0,
        avgAchievement: 0,
        achievementSum: 0,
        achievementCount: 0,
      });
    }
    const g = groups.get(key)!;
    g.indicatorCount++;
    switch (ind.status) {
      case "ON_TRACK":
        g.onTrack++;
        break;
      case "AT_RISK":
        g.atRisk++;
        break;
      case "OFF_TRACK":
        g.offTrack++;
        break;
      default:
        g.notStarted++;
    }
    const ach = ind.achievementPct != null ? Number(ind.achievementPct) : null;
    if (ach != null) {
      g.achievementSum += ach;
      g.achievementCount++;
    }
  }
  return Array.from(groups.values()).map(
    ({ achievementSum, achievementCount, ...rest }) => ({
      ...rest,
      avgAchievement:
        achievementCount > 0
          ? Math.round((achievementSum / achievementCount) * 100) / 100
          : 0,
    }),
  );
}

async function aggregateByRegion(
  indicators: Array<{
    status: TrafficLight;
    achievementPct: unknown;
    subcomponent: { componentId: string };
  }>,
  projectId: string,
): Promise<AggregationRowDTO[]> {
  const project = await prisma.project.findUnique({
    where: { projectId },
    include: { location: true },
  });
  const region = project?.location?.region ?? "Unknown";
  let onTrack = 0,
    atRisk = 0,
    offTrack = 0,
    notStarted = 0,
    sum = 0,
    count = 0;
  for (const ind of indicators) {
    switch (ind.status) {
      case "ON_TRACK":
        onTrack++;
        break;
      case "AT_RISK":
        atRisk++;
        break;
      case "OFF_TRACK":
        offTrack++;
        break;
      default:
        notStarted++;
    }
    const ach = ind.achievementPct != null ? Number(ind.achievementPct) : null;
    if (ach != null) {
      sum += ach;
      count++;
    }
  }
  return [
    {
      key: region,
      label: region,
      indicatorCount: indicators.length,
      onTrack,
      atRisk,
      offTrack,
      notStarted,
      avgAchievement: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
    },
  ];
}

async function aggregateByGender(
  indicators: Array<{ indicatorId: string }>,
  _projectId: string,
): Promise<AggregationRowDTO[]> {
  const ids = indicators.map((i) => i.indicatorId);
  if (!ids.length) return [];
  const values = await prisma.indicatorValue.findMany({
    where: { indicatorId: { in: ids } },
    orderBy: [{ fiscalYear: "desc" }, { period: "desc" }],
  });
  const byGender: Record<string, { sum: number; count: number }> = {};
  for (const v of values) {
    const dis = v.disaggregation as Record<
      string,
      Record<string, number>
    > | null;
    if (!dis?.gender) continue;
    for (const [g, val] of Object.entries(dis.gender)) {
      if (!byGender[g]) byGender[g] = { sum: 0, count: 0 };
      byGender[g]!.sum += Number(val);
      byGender[g]!.count++;
    }
  }
  return Object.entries(byGender).map(([gender, stats]) => ({
    key: gender,
    label: gender,
    indicatorCount: stats.count,
    onTrack: 0,
    atRisk: 0,
    offTrack: 0,
    notStarted: 0,
    avgAchievement: stats.sum,
  }));
}

/* ════════════════════════════════════════════════════════════════════
LOGFRAME EXPORT
════════════════════════════════════════════════════════════════════ */
export async function generateLogframeExcel(
  projectId: string,
  scope: ScopeClaim,
  orgId: string,
  userId: string,
): Promise<Buffer> {
  await assertProjectAccess(projectId, scope, orgId, userId);
  const indicators = await prisma.indicator.findMany({
    where: { projectId },
    include: {
      subcomponent: {
        select: {
          code: true,
          name: true,
          component: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: [
      { subcomponent: { component: { orderNo: "asc" } } },
      { code: "asc" },
    ],
  });
  const rows = indicators.map((ind) => {
    const achievement = computeAchievement(
      Number(ind.baseline ?? 0),
      Number(ind.target ?? 0),
      Number(ind.actual ?? 0),
      ind.direction,
    );
    return {
      "Component Code": ind.subcomponent.component.code,
      "Component Name": ind.subcomponent.component.name,
      "Subcomponent Code": ind.subcomponent.code,
      "Subcomponent Name": ind.subcomponent.name,
      "Indicator Code": ind.code,
      "Indicator Name": ind.name,
      Type: ind.indicatorType,
      Unit: ind.unit,
      Direction: ind.direction,
      Baseline: ind.baseline != null ? Number(ind.baseline) : "",
      Target: ind.target != null ? Number(ind.target) : "",
      Actual: ind.actual != null ? Number(ind.actual) : "",
      "Achievement %": achievement ?? "",
      Status: ind.status,
      Disaggregation: Array.isArray(ind.disaggregation)
        ? (ind.disaggregation as string[]).join(", ")
        : "",
    };
  });
  return renderExcel(rows, "Logframe");
}

/* ════════════════════════════════════════════════════════════════════
MAPPERS
════════════════════════════════════════════════════════════════════ */
function toComponentDTO(c: {
  componentId: string;
  projectId: string;
  code: string;
  name: string;
  nameAm: string | null;
  description: string | null;
  budget: unknown;
  responsibleOrgId: string | null;
  orderNo: number;
  createdAt: Date;
  updatedAt: Date;
}): ComponentDTO {
  return {
    componentId: c.componentId,
    projectId: c.projectId,
    code: c.code,
    name: c.name,
    ...(c.nameAm ? { nameAm: c.nameAm } : {}),
    ...(c.description ? { description: c.description } : {}),
    ...(c.budget != null ? { budget: String(c.budget) } : {}),
    ...(c.responsibleOrgId ? { responsibleOrgId: c.responsibleOrgId } : {}),
    orderNo: c.orderNo,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toSubcomponentDTO(s: {
  subcomponentId: string;
  componentId: string;
  projectId: string;
  code: string;
  name: string;
  nameAm: string | null;
  description: string | null;
  budget: unknown;
  orderNo: number;
  createdAt: Date;
  updatedAt: Date;
}): SubcomponentDTO {
  return {
    subcomponentId: s.subcomponentId,
    componentId: s.componentId,
    projectId: s.projectId,
    code: s.code,
    name: s.name,
    ...(s.nameAm ? { nameAm: s.nameAm } : {}),
    ...(s.description ? { description: s.description } : {}),
    ...(s.budget != null ? { budget: String(s.budget) } : {}),
    orderNo: s.orderNo,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function toIndicatorDTO(
  ind: {
    indicatorId: string;
    subcomponentId: string;
    projectId: string;
    code: string;
    name: string;
    nameAm: string | null;
    description: string | null;
    indicatorType: IndicatorType;
    unit: string;
    baseline: unknown;
    baselineDate: Date | null;
    target: unknown;
    targetDate: Date | null;
    actual: unknown;
    frequency: IndicatorFrequency;
    direction: IndicatorDirection;
    method: string | null;
    disaggregation: unknown;
    status: TrafficLight;
    achievementPct?: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
  componentId: string,
): IndicatorDTO {
  const ach = computeAchievement(
    Number(ind.baseline ?? 0),
    Number(ind.target ?? 0),
    Number(ind.actual ?? 0),
    ind.direction,
  );
  return {
    indicatorId: ind.indicatorId,
    subcomponentId: ind.subcomponentId,
    componentId,
    projectId: ind.projectId,
    code: ind.code,
    name: ind.name,
    ...(ind.nameAm ? { nameAm: ind.nameAm } : {}),
    ...(ind.description ? { description: ind.description } : {}),
    indicatorType: ind.indicatorType,
    unit: ind.unit,
    ...(ind.baseline != null ? { baseline: Number(ind.baseline) } : {}),
    ...(ind.baselineDate
      ? { baselineDate: ind.baselineDate.toISOString().slice(0, 10) }
      : {}),
    ...(ind.target != null ? { target: Number(ind.target) } : {}),
    ...(ind.targetDate
      ? { targetDate: ind.targetDate.toISOString().slice(0, 10) }
      : {}),
    ...(ind.actual != null ? { actual: Number(ind.actual) } : {}),
    frequency: ind.frequency,
    direction: ind.direction,
    ...(ind.method ? { method: ind.method } : {}),
    disaggregation: Array.isArray(ind.disaggregation)
      ? (ind.disaggregation as string[])
      : [],
    status: ind.status,
    ...(ach != null ? { achievementPct: ach } : {}),
    createdAt: ind.createdAt.toISOString(),
    updatedAt: ind.updatedAt.toISOString(),
  };
}

function toIndicatorValueDTO(v: {
  valueId: string;
  indicatorId: string;
  period: string;
  fiscalYear: number;
  value: unknown;
  target: unknown;
  achievementPct: unknown;
  disaggregation: unknown;
  dataSource: string | null;
  notes: string | null;
  verifiedById: string | null;
  verifiedBy: { fullName: string } | null;
  verifiedAt: Date | null;
  createdAt: Date;
}): IndicatorValueDTO {
  return {
    valueId: v.valueId,
    indicatorId: v.indicatorId,
    period: v.period,
    fiscalYear: v.fiscalYear,
    value: Number(v.value),
    ...(v.target != null ? { target: Number(v.target) } : {}),
    ...(v.achievementPct != null
      ? { achievementPct: Number(v.achievementPct) }
      : {}),
    ...(v.disaggregation
      ? {
          disaggregation: v.disaggregation as Record<
            string,
            Record<string, number>
          >,
        }
      : {}),
    ...(v.dataSource ? { dataSource: v.dataSource } : {}),
    ...(v.notes ? { notes: v.notes } : {}),
    ...(v.verifiedById ? { verifiedById: v.verifiedById } : {}),
    ...(v.verifiedBy ? { verifiedByName: v.verifiedBy.fullName } : {}),
    ...(v.verifiedAt ? { verifiedAt: v.verifiedAt.toISOString() } : {}),
    createdAt: v.createdAt.toISOString(),
  };
}
