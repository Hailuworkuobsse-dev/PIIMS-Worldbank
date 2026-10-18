import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      logger.warn({ attempt: times, delayMs: delay }, 'redis reconnect');
      return delay;
    }
  });

redis.on('connect', () => logger.info('Redis connecting…'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.error({ err: err.message }, 'Redis error'));
redis.on('close', () => logger.warn('Redis closed'));

if (env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}

/**
 * Cache helpers — used across modules (Step 3+).
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },
  async del(key: string): Promise<void> {
    await redis.del(key);
  },
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  }
};