import { Queue, Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { redis } from './redis.js';
import { logger } from './logger.js';

/**
 * BullMQ queues — used for async work in later steps:
 *   - reports:  PDF/Excel/CSV generation
 *   - sync:     external integration sync (FMIS, DBE, WB)
 *   - anonymize: warehouse anonymization jobs
 *   - notify:   SMS/email dispatch
 *   - import:   bulk CSV import
 */
export const QUEUE_NAMES = {
  REPORTS: 'reports',
  SYNC: 'sync',
  ANONYMIZE: 'anonymize',
  NOTIFY: 'notify',
  IMPORT: 'import'
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: redis as unknown as Redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 }
      }
    });
    queues.set(name, q);
    logger.info({ queue: name }, 'queue initialized');
  }
  return q;
}

export function registerWorker<T = unknown>(
  name: QueueName,
  processor: (job: Job<T>) => Promise<unknown>,
  concurrency = 2
): Worker<T> {
  const worker = new Worker<T>(
    name,
    async (job) => {
      logger.info({ queue: name, jobId: job.id, name: job.name }, 'job started');
      try {
        const result = await processor(job);
        logger.info({ queue: name, jobId: job.id }, 'job completed');
        return result;
      } catch (err) {
        logger.error(
          { queue: name, jobId: job.id, err: (err as Error).message },
          'job failed'
        );
        throw err;
      }
    },
    { connection: redis as unknown as Redis, concurrency }
  );

  worker.on('failed', (job, err) => {
    logger.error({ queue: name, jobId: job?.id, err: err.message }, 'worker job failed');
  });

  return worker;
}

export async function closeQueues(): Promise<void> {
  for (const q of queues.values()) await q.close();
  queues.clear();
  logger.info('All queues closed');
}