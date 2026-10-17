import { prisma } from './prisma.js';
import { sha256 } from '@/utils/crypto.js';
import { logger } from '@/config/logger.js';
import type { AuditAction, Prisma } from '@prisma/client';

const GENESIS_HASH = '0'.repeat(64);

export interface AuditWriteInput {
  userId?: string | null;
  entity: string;
  entityId?: string | null;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

/**
 * Append an entry to the hash-chained audit log.
 *
 * Every entry stores `prevHash` (the recordHash of the previous entry)
 * and `recordHash` (SHA-256 of prevHash + payload). Tampering with any
 * entry breaks the chain for every subsequent entry.
 *
 * Fire-and-forget: failures are logged but never thrown, so audit
 * failures can't break user-facing flows.
 */
export async function writeAudit(input: AuditWriteInput): Promise<void> {
  try {
    // Serialize writes to prevent hash-chain races. In production, use a
    // dedicated mutex or a database advisory lock if throughput is high.
    // For MVP, sequential last-write-wins is acceptable.
    const last = await prisma.auditLog.findFirst({
      orderBy: { logId: 'desc' },
      select: { recordHash: true }
    });

    const prevHash = last?.recordHash ?? GENESIS_HASH;

    const payload = {
      userId: input.userId ?? null,
      entity: input.entity,
      entityId: input.entityId ?? null,
      action: input.action,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      correlationId: input.correlationId ?? null,
      timestamp: new Date().toISOString()
    };

    const recordHash = sha256(`${prevHash}|${JSON.stringify(payload)}`);

    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        entity: input.entity,
        entityId: input.entityId ?? null,
        action: input.action,
        oldValue: (input.oldValue ?? null) as Prisma.InputJsonValue,
        newValue: (input.newValue ?? null) as Prisma.InputJsonValue,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        correlationId: input.correlationId ?? null,
        prevHash,
        recordHash
      }
    });
  } catch (err) {
    logger.error(
      { err: (err as Error).message, entity: input.entity, action: input.action },
      'audit log write failed'
    );
  }
}

/**
 * Verify the integrity of the audit chain over a range of entries.
 * Used by the auditor UI (M16) and periodic integrity checks.
 */
export async function verifyAuditChain(
  fromLogId?: bigint,
  toLogId?: bigint
): Promise<{ valid: boolean; brokenAt?: string }> {
  const where =
    fromLogId || toLogId
      ? {
          logId: {
            ...(fromLogId ? { gte: fromLogId } : {}),
            ...(toLogId ? { lte: toLogId } : {})
          }
        }
      : {};

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { logId: 'asc' },
    select: {
      logId: true,
      userId: true,
      entity: true,
      entityId: true,
      action: true,
      oldValue: true,
      newValue: true,
      ipAddress: true,
      userAgent: true,
      correlationId: true,
      prevHash: true,
      recordHash: true,
      createdAt: true
    }
  });

  let previousHash = entries[0]?.prevHash ?? GENESIS_HASH;

  for (const entry of entries) {
    const payload = {
      userId: entry.userId ?? null,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      action: entry.action,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      correlationId: entry.correlationId ?? null,
      timestamp: entry.createdAt.toISOString()
    };
    const expected = sha256(`${previousHash}|${JSON.stringify(payload)}`);

    if (expected !== entry.recordHash) {
      return { valid: false, brokenAt: String(entry.logId) };
    }
    previousHash = entry.recordHash;
  }

  return { valid: true };
}