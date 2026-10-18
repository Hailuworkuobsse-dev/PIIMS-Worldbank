import { prisma } from '@/lib/prisma.js';
import { logger } from '@/config/logger.js';

const DEFAULT_TTL_MS = 86_400_000; // 24 h

/**
 * Idempotency check for POST endpoints. The frontend sends
 * `X-Idempotency-Key` on every create; we cache the full response
 * keyed by that header in MySQL (IdempotencyKey table). A retry
 * returns the cached response instead of re-creating the resource.
 */
export async function getIdempotentResponse<T>(key: string | undefined): Promise<T | null> {
  if (!key) return null;
  try {
    const row = await prisma.idempotencyKey.findUnique({ where: { key } });
    if (!row) return null;
    if (row.expiresAt < new Date()) return null;
    return JSON.parse(row.response) as T;
  } catch (err) {
    logger.warn({ err: (err as Error).message, key }, 'idempotency read failed');
    return null;
  }
}

export async function setIdempotentResponse<T>(
  key: string | undefined,
  response: T,
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  if (!key) return;
  try {
    await prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        response: JSON.stringify(response),
        expiresAt: new Date(Date.now() + ttlMs)
      },
      update: {
        response: JSON.stringify(response),
        expiresAt: new Date(Date.now() + ttlMs)
      }
    });
  } catch (err) {
    logger.warn({ err: (err as Error).message, key }, 'idempotency write failed');
  }
}
