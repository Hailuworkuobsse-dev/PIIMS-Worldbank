import { prisma } from '@/lib/prisma.js';
import { logger } from '@/config/logger.js';

const PREFIX = 'idem:ext:';
const DEFAULT_TTL_MS = 86_400_000 * 7; // 7 days

async function readKey<T>(key: string): Promise<T | null> {
  const row = await prisma.idempotencyKey.findUnique({ where: { key: key } });
  if (!row) return null;
  if (row.expiresAt < new Date()) return null;
  return JSON.parse(row.response) as T;
}

async function writeKey(key: string, value: unknown, ttlMs: number): Promise<void> {
  await prisma.idempotencyKey.upsert({
    where: { key: key },
    create: {
      key: key,
      response: JSON.stringify(value),
      expiresAt: new Date(Date.now() + ttlMs)
    },
    update: {
      response: JSON.stringify(value),
      expiresAt: new Date(Date.now() + ttlMs)
    }
  });
}

export async function getIdempotencyKey<T>(
  integrationCode: string,
  referenceId: string
): Promise<T | null> {
  try {
    return await readKey<T>(`${PREFIX}${integrationCode}:${referenceId}`);
  } catch {
    return null;
  }
}

export async function saveIdempotencyKey<T>(
  integrationCode: string,
  referenceId: string,
  result: T,
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  try {
    await writeKey(`${PREFIX}${integrationCode}:${referenceId}`, result, ttlMs);
  } catch (err) {
    logger.warn({ err: (err as Error).message, integrationCode, referenceId }, 'idempotency save failed');
  }
}

/**
 * Run `executor` at most once per (integrationCode, referenceId) pair.
 * The first result is cached; subsequent calls return the cached result.
 */
export async function checkAndSetIdempotency<T>(
  integrationCode: string,
  referenceId: string,
  executor: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const existing = await getIdempotencyKey<T>(integrationCode, referenceId);
  if (existing !== null) return existing;
  const result = await executor();
  await saveIdempotencyKey(integrationCode, referenceId, result, ttlMs);
  return result;
}
