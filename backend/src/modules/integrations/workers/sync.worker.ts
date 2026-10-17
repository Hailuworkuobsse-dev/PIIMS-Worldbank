import { QUEUE_NAMES, registerWorker } from '@/config/queue.js';
import { logger } from '@/config/logger.js';
import { executeSync } from '../integration.service.js';
import type { IntegrationCode } from '../integration.types.js';

type SyncJobPayload = { jobId: string; integrationCode: IntegrationCode; kind: string };

export function startSyncWorker(): ReturnType<typeof registerWorker> {
  const worker = registerWorker<SyncJobPayload>(
    QUEUE_NAMES.SYNC,
    async (job) => {
      const { jobId, integrationCode } = job.data;
      logger.info({ jobId, integrationCode }, 'sync worker processing');
      return executeSync(jobId);
    },
    2
  );

  logger.info('sync worker registered');
  return worker;
}