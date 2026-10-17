import { redis } from '@/config/redis.js';
import { logger } from '@/config/logger.js';

const PREFIX = 'idem:';
const DEFAULT_TTL = 86_400; // 24 h

/**
 * Idempotency check for POST endpoints. The frontend sends
 * `X-Idempotency-Key` on every create; we cache the full response
 * keyed by that header. A retry returns the cached response instead
 * of re-creating the resource.
 */
export async function getIdempotentResponse<T>(key: string | undefined): Promise<T | null> {
  if (!key) return null;
  try {
    const cached = await redis.get(`${PREFIX}${key}`);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (err) {
    logger.warn({ err: (err as Error).message, key }, 'idempotency read failed');
    return null;
  }
}

export async function setIdempotentResponse<T>(
  key: string | undefined,
  response: T,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  if (!key) return;
  try {
    await redis.set(`${PREFIX}${key}`, JSON.stringify(response), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err: (err as Error).message, key }, 'idempotency write failed');
  }
}