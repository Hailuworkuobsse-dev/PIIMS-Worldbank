import { logger } from './logger.js';

import { prisma } from '@/lib/prisma.js';

/**
 * MySQL-only job queues — replaces the former BullMQ/Redis implementation.
 *
 * Jobs are persisted in the `jobs` table (see prisma/schema.prisma) and
 * processed by an in-process poller, so the backend needs no Redis server.
 * The public API mirrors the old one (getQueue / registerWorker / closeQueues)
 * so callers stay unchanged.
 */
export const QUEUE_NAMES = {
  REPORTS: 'reports',
  SYNC: 'sync',
  ANONYMIZE: 'anonymize',
  NOTIFY: 'notify',
  IMPORT: 'import'
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
}

type AddJobOptions = Record<string, unknown> & { jobId?: string; attempts?: number };

const DEFAULT_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 2000;
const STALE_RUNNING_MS = 15 * 60 * 1000; // re-claim jobs whose worker died

type Processor = (job: Job) => Promise<unknown>;

class MysqlQueue {
  constructor(readonly name: QueueName) {}

  async add(
    jobName: string,
    data: unknown,
    opts: AddJobOptions = {}
  ): Promise<Job> {
    const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
    try {
      const row = await prisma.job.create({
        data: {
          queue: this.name,
          name: jobName,
          payload: (data ?? null) as never,
          status: 'WAITING',
          attemptsMade: 0,
          maxAttempts: attempts,
          externalId: opts.jobId ?? null
        }
      });
      return { id: row.jobId, name: row.name, data: row.payload as never };
    } catch (err) {
      // Unique-constraint on externalId ⇒ duplicate jobId: treat as idempotent no-op.
      if (
        opts.jobId &&
        (err as { code?: string }).code === 'P2002'
      ) {
        logger.debug(
          { queue: this.name, jobId: opts.jobId },
          'duplicate job ignored'
        );
        const existing = await prisma.job.findUnique({
          where: { externalId: opts.jobId }
        });
        return {
          id: existing?.jobId ?? '',
          name: jobName,
          data: (existing?.payload ?? data) as never
        };
      }
      throw err;
    }
  }

  /** Waiting + active + delayed jobs — used for health reporting. */
  async getJobCounts(..._types: string[]): Promise<Record<string, number>> {
    const rows = await prisma.job.groupBy({
      by: ['status'],
      where: { queue: this.name, status: { in: ['WAITING', 'ACTIVE', 'DELAYED'] } },
      _count: { _all: true }
    });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      counts[r.status.toLowerCase()] = r._count._all;
    }
    return counts;
  }
}

const queues = new Map<QueueName, MysqlQueue>();

export function getQueue(name: QueueName): MysqlQueue {
  let q = queues.get(name);
  if (!q) {
    q = new MysqlQueue(name);
    queues.set(name, q);
    logger.info({ queue: name }, 'queue initialized (mysql-backed)');
  }
  return q;
}

/* ── In-process worker pool ─────────────────────────────────────────── */

interface WorkerHandle {
  queue: QueueName;
  processor: Processor;
  concurrency: number;
  stopped: boolean;
}

const workers = new Map<QueueName, WorkerHandle>();
let pollerTimer: NodeJS.Timeout | null = null;
let polling = false;

export function registerWorker<T = unknown>(
  name: QueueName,
  processor: (job: Job<T>) => Promise<unknown>,
  concurrency = 2
): { close: () => Promise<void> } {
  workers.set(name, {
    queue: name,
    processor: processor as Processor,
    concurrency,
    stopped: false
  });
  ensurePoller();
  logger.info({ queue: name, concurrency }, 'worker registered (mysql-backed)');

  return {
    close: async () => {
      const w = workers.get(name);
      if (w) w.stopped = true;
      workers.delete(name);
    }
  };
}

function ensurePoller(): void {
  if (pollerTimer) return;
  pollerTimer = setInterval(() => {
    void drainOnce().catch((err) =>
      logger.error({ err: (err as Error).message }, 'job poller error')
    );
  }, POLL_INTERVAL_MS);
  // Do not keep the process alive solely for the poller.
  pollerTimer.unref?.();
}

async function drainOnce(): Promise<void> {
  if (polling) return;
  polling = true;
  try {
    for (const handle of workers.values()) {
      if (handle.stopped) continue;
      await claimAndRun(handle);
    }
  } finally {
    polling = false;
  }
}

async function claimAndRun(handle: WorkerHandle): Promise<void> {
  // Re-claim crashed/stale ACTIVE jobs and pick up WAITING ones.
  await prisma.job.updateMany({
    where: {
      queue: handle.queue,
      status: 'ACTIVE',
      startedAt: { lt: new Date(Date.now() - STALE_RUNNING_MS) }
    },
    data: { status: 'WAITING', startedAt: null }
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidates = await prisma.job.findMany({
      where: {
        queue: handle.queue,
        status: 'WAITING',
        runAfter: { lte: new Date() }
      },
      orderBy: { createdAt: 'asc' },
      take: handle.concurrency
    });
    if (candidates.length === 0) break;

    await Promise.all(
      candidates.map(async (candidate: NonNullable<typeof candidates[number]>) => {
        // Atomic claim: only the update that flips WAITING→ACTIVE wins.
        const claimed = await prisma.job.updateMany({
          where: { jobId: candidate.jobId, status: 'WAITING' },
          data: { status: 'ACTIVE', startedAt: new Date() }
        });
        if (claimed.count !== 1) return;

        const job: Job = {
          id: candidate.jobId,
          name: candidate.name,
          data: candidate.payload as never
        };
        logger.info(
          { queue: handle.queue, jobId: job.id, name: job.name },
          'job started'
        );
        try {
          await handle.processor(job);
          await prisma.job.update({
            where: { jobId: candidate.jobId },
            data: { status: 'COMPLETED', finishedAt: new Date(), error: null }
          });
          logger.info({ queue: handle.queue, jobId: job.id }, 'job completed');
        } catch (err) {
          const message = (err as Error).message;
          const attemptsMade = candidate.attemptsMade + 1;
          if (attemptsMade >= candidate.maxAttempts) {
            await prisma.job.update({
              where: { jobId: candidate.jobId },
              data: {
                status: 'FAILED',
                attemptsMade,
                finishedAt: new Date(),
                error: message.slice(0, 1000)
              }
            });
            logger.error(
              { queue: handle.queue, jobId: job.id, err: message },
              'worker job failed'
            );
          } else {
            // Exponential backoff before retrying.
            const delay = Math.min(2 ** attemptsMade * 2000, 60_000);
            await prisma.job.update({
              where: { jobId: candidate.jobId },
              data: {
                status: 'DELAYED',
                attemptsMade,
                error: message.slice(0, 1000),
                runAfter: new Date(Date.now() + delay)
              }
            });
            logger.warn(
              { queue: handle.queue, jobId: job.id, attempt: attemptsMade, delayMs: delay },
              'job failed — will retry'
            );
          }
        }
      })
    );
  }
}

/** Background task: prune completed/failed jobs older than 7 days. */
async function pruneOldJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const deleted = await prisma.job.deleteMany({
    where: {
      status: { in: ['COMPLETED', 'FAILED'] },
      finishedAt: { lt: cutoff }
    }
  });
  if (deleted.count > 0) {
    logger.info({ removed: deleted.count }, 'pruned old completed/failed jobs');
  }
}

setInterval(() => {
  void pruneOldJobs().catch(() => undefined);
}, 60 * 60 * 1000).unref?.();

export async function closeQueues(): Promise<void> {
  if (pollerTimer) {
    clearInterval(pollerTimer);
    pollerTimer = null;
  }
  workers.clear();
  queues.clear();
  logger.info('All queues closed');
}
