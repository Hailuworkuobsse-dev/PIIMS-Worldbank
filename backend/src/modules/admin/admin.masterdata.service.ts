import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { writeAudit } from '@/lib/audit.js';
import { ConflictError, NotFoundError } from '@/lib/errors.js';
import type { MasterDataDTO } from './admin.types.js';
import type {
  CreateMasterDataInput, UpdateMasterDataInput, ListMasterDataQuery
} from './admin.schemas.js';

function toDTO(m: {
  masterId: string; category: string; code: string; name: string;
  nameAm: string | null; parentId: string | null; attributes: unknown;
  orderNo: number | null; active: boolean;
  createdAt: Date; updatedAt: Date;
}): MasterDataDTO {
  return {
    masterId: m.masterId,
    category: m.category,
    code: m.code,
    name: m.name,
    ...(m.nameAm ? { nameAm: m.nameAm } : {}),
    ...(m.parentId ? { parentId: m.parentId } : {}),
    ...(m.attributes ? { attributes: m.attributes as Record<string, unknown> } : {}),
    ...(m.orderNo != null ? { orderNo: m.orderNo } : {}),
    active: m.active,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString()
  };
}

export async function listMasterData(query: ListMasterDataQuery): Promise<MasterDataDTO[]> {
  const where: Prisma.MasterDataWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.active !== undefined) where.active = query.active;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { code: { contains: query.q } }
    ];
  }

  const rows = await prisma.masterData.findMany({
    where,
    orderBy: [{ category: 'asc' }, { orderNo: 'asc' }, { name: 'asc' }],
    take: query.limit ?? 500
  });
  return rows.map(toDTO);
}

export async function createMasterData(
  input: CreateMasterDataInput,
  actor: { userId: string },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<MasterDataDTO> {
  const existing = await prisma.masterData.findUnique({
    where: { category_code: { category: input.category, code: input.code } }
  });
  if (existing) {
    throw new ConflictError(
      `Master data '${input.code}' already exists in category '${input.category}'`
    );
  }

  const created = await prisma.masterData.create({
    data: {
      category: input.category,
      code: input.code,
      name: input.name,
      ...(input.nameAm ? { nameAm: input.nameAm } : {}),
      ...(input.parentId ? { parentId: input.parentId } : {}),
      ...(input.attributes ? { attributes: input.attributes as Prisma.InputJsonValue } : {}),
      ...(input.orderNo != null ? { orderNo: input.orderNo } : {}),
      active: input.active,
      createdById: actor.userId
    }
  });

  await writeAudit({
    userId: actor.userId,
    entity: 'MASTER_DATA',
    entityId: created.masterId,
    action: 'CREATE',
    newValue: { category: created.category, code: created.code, name: created.name },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toDTO(created);
}

export async function updateMasterData(
  masterId: string,
  input: UpdateMasterDataInput,
  actor: { userId: string },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<MasterDataDTO> {
  const existing = await prisma.masterData.findUnique({ where: { masterId } });
  if (!existing) throw new NotFoundError('MasterData', masterId);

  const updated = await prisma.masterData.update({
    where: { masterId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.nameAm !== undefined ? { nameAm: input.nameAm || null } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId || null } : {}),
      ...(input.attributes !== undefined
        ? { attributes: input.attributes as Prisma.InputJsonValue }
        : {}),
      ...(input.orderNo !== undefined ? { orderNo: input.orderNo } : {}),
      ...(input.active !== undefined ? { active: input.active } : {})
    }
  });

  await writeAudit({
    userId: actor.userId,
    entity: 'MASTER_DATA',
    entityId: masterId,
    action: 'UPDATE',
    oldValue: { name: existing.name, active: existing.active },
    newValue: { name: updated.name, active: updated.active },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });

  return toDTO(updated);
}

export async function deleteMasterData(
  masterId: string,
  actor: { userId: string },
  context: { ipAddress: string | null; userAgent: string | null; correlationId: string | null }
): Promise<void> {
  const existing = await prisma.masterData.findUnique({ where: { masterId } });
  if (!existing) throw new NotFoundError('MasterData', masterId);

  // Soft delete — set inactive (data might be referenced elsewhere)
  await prisma.masterData.update({
    where: { masterId },
    data: { active: false }
  });

  await writeAudit({
    userId: actor.userId,
    entity: 'MASTER_DATA',
    entityId: masterId,
    action: 'DELETE',
    oldValue: { category: existing.category, code: existing.code, name: existing.name },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId
  });
}