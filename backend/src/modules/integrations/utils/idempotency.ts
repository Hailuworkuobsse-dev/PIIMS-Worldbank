import { redis } from '@/config/redis.js';
import { logger } from '@/config/logger.js';

const PREFIX = 'idem:ext:';
const DEFAULT_TTL = 86_400 * 7; // 7 days

export async function getIdempotencyKey<T>(
  integrationCode: string,
  referenceId: string
): Promise<T | null> {
  try {
    const raw = await redis.get(`${PREFIX}${integrationCode}:${referenceId}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveIdempotencyKey<T>(
  integrationCode: string,
  referenceId: string,
  result: T,
  ttl = DEFAULT_TTL
): Promise<void> {
  try {
    await redis.set(
      `${PREFIX}${integrationCode}:${referenceId}`,
      JSON.stringify(result),
      'EX',
      ttl
    );
  } catch (err) {
    logger.warn({ err: (err as Error).message, integrationCode, referenceId }, 'idempotency save failed');
  }
}