import { prisma } from '@/lib/prisma.js';
import { getQueue, QUEUE_NAMES } from '@/config/queue.js';
import { env } from '@/config/env.js';
import type { SystemHealthDTO } from './admin.types.js';

let healthStartTime = Date.now();

export async function getSystemHealth(): Promise<SystemHealthDTO> {
  const dbStart = Date.now();
  try { await prisma.$queryRaw`SELECT 1`; } catch { /* ignore */ }
  const dbLatency = Date.now() - dbStart;

  let queueDepth = 0;
  try {
    const reportQ = getQueue(QUEUE_NAMES.REPORTS);
    const counts = await reportQ.getJobCounts('waiting', 'active', 'delayed');
    queueDepth = (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);
  } catch { /* ignore */ }

  const db = dbLatency < 5000;

  const since24h = new Date(Date.now() - 24 * 3600 * 1000);

  const [activeUsers24h, auditCount24h] = await Promise.all([
    prisma.user
      .count({ where: { lastLoginAt: { gte: since24h } } })
      .catch(() => 0),
    prisma.auditLog
      .count({ where: { createdAt: { gte: since24h } } })
      .catch(() => 0)
  ]);

  const status: SystemHealthDTO['status'] =
    !db ? 'down' : queueDepth > 1000 ? 'degraded' : 'healthy';

  return {
    status,
    version: '2.0.0',
    env: env.NODE_ENV,
    uptime: Math.floor((Date.now() - healthStartTime) / 1000),
    api: {
      status: 'HEALTHY',
      p95LatencyMs: 0 // computed by monitoring — placeholder
    },
    database: {
      status: db ? 'HEALTHY' : 'DOWN',
      connections: 1, // approximation, real count from MySQL admin
      maxConnections: 100
    },
    queue: {
      status: queueDepth > 1000 ? 'DEGRADED' : 'HEALTHY',
      depth: queueDepth
    },
    storage: {
      usedGb: 0,
      totalGb: 100
    },
    activeUsers24h,
    apiCalls24h: auditCount24h
  };
}
