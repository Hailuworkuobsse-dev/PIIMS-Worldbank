import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectPrisma, disconnectPrisma } from './lib/prisma.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { closeQueues } from './config/queue.js';

async function bootstrap(): Promise<void> {
  logger.info({ env: env.NODE_ENV, node: process.version }, 'PIIMS backend starting');

  // ── Connect dependencies before reporting the API as ready ──
  await connectRedis();
  await connectPrisma();

  // ── Build Express app ──
  const app = buildApp();

  // ── Listen ──
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        basePath: env.API_BASE_PATH,
        health: `http://localhost:${env.PORT}/healthz`,
        ready: `http://localhost:${env.PORT}/readyz`
      },
      'PIIMS backend ready'
    );
  });

  // ── Graceful shutdown ──
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown signal received');
    server.close(async () => {
      try {
        await closeQueues();
        await disconnectRedis();
        await disconnectPrisma();
        logger.info('shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err: (err as Error).message }, 'shutdown error');
        process.exit(1);
      }
    });

    // Force exit after 30s
    setTimeout(() => {
      logger.error('forced shutdown after timeout');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ── Unhandled errors ──
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandled rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, 'uncaught exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});