import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

const MAX_RECONNECT_ATTEMPTS = 10;
const READY_TIMEOUT_MS = 35_000;
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.fatal(
          { attempts: MAX_RECONNECT_ATTEMPTS },
          'Redis is unreachable; stopping automatic reconnects. Check REDIS_URL and confirm Redis is running.'
        );
        return null;
      }

      const delay = Math.min(times * 250, 3000);
      logger.warn(
        { attempt: times, maxAttempts: MAX_RECONNECT_ATTEMPTS, delayMs: delay },
        'Redis reconnect scheduled'
      );
      return delay;
    }
  });

redis.on('connect', () => logger.info('Redis TCP connection established'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) =>
  logger.error(
    {
      errorName: err.name,
      message: err.message || '(empty error message)',
      code: 'code' in err ? err.code : undefined,
      errno: 'errno' in err ? err.errno : undefined,
      syscall: 'syscall' in err ? err.syscall : undefined,
      address: 'address' in err ? err.address : undefined,
      port: 'port' in err ? err.port : undefined
    },
    'Redis connection error'
  )
);
redis.on('close', () => logger.warn('Redis connection closed'));
redis.on('end', () => logger.error('Redis reconnect attempts exhausted; restart after fixing Redis availability'));

if (env.NODE_ENV !== 'production') globalForRedis.redis = redis;

/**
 * Wait for Redis during startup so the API does not report ready while its
 * cache and BullMQ queue dependency is unavailable.
 */
export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') {
    await redis.ping();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = (): void => {
      clearTimeout(timeout);
      redis.off('ready', onReady);
      redis.off('end', onEnd);
    };
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onReady = (): void => {
      void redis
        .ping()
        .then(() => finish())
        .catch((error: unknown) =>
          finish(error instanceof Error ? error : new Error(String(error)))
        );
    };
    const onEnd = (): void =>
      finish(
        new Error(
          'Redis did not become available after 10 connection attempts. Check REDIS_URL and start Redis, then restart the backend.'
        )
      );
    const timeout = setTimeout(
      () => finish(new Error('Timed out waiting for Redis to become ready. Check REDIS_URL and Redis health.')),
      READY_TIMEOUT_MS
    );

    redis.once('ready', onReady);
    redis.once('end', onEnd);

    // Handle a connection that became ready immediately before listeners were attached.
    if (redis.status === 'ready') onReady();
    else if (redis.status === 'end') onEnd();
  });
}

export async function disconnectRedis(): Promise<void> {
  if (redis.status === 'end' || redis.status === 'wait') {
    logger.info({ status: redis.status }, 'Redis already disconnected');
    return;
  }
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
