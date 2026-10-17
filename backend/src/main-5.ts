import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectPrisma, disconnectPrisma } from './lib/prisma.js';
import { disconnectRedis } from './config/redis.js';
import { closeQueues } from './config/queue.js';
import { startReportWorker } from './workers/report.worker.js';
import { startNotificationWorker } from './modules/notifications/notification.worker.js';
import { startSyncWorker } from './modules/integrations/workers/sync.worker.js';

async function bootstrap(): Promise<void> {
  logger.info({ env: env.NODE_ENV, node: process.version }, 'PIIMS backend starting');

  await connectPrisma();

  const app = buildApp();

  // Start BullMQ workers
  const reportWorker = startReportWorker();
  const notificationWorker = startNotificationWorker();
  const syncWorker = startSyncWorker();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, basePath: env.API_BASE_PATH, health: `http://localhost:${env.PORT}/healthz` },
      'PIIMS backend ready'
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown signal received');
    server.close(async () => {
      try {
        await reportWorker.close();
        await notificationWorker.close();
        await syncWorker.close();
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
    setTimeout(() => { logger.error('forced shutdown after timeout'); process.exit(1); }, 30_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandled rejection'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, 'uncaught exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});