import { Router } from 'express';
import { prisma } from '@/lib/prisma.js';
import { sendSuccess } from '@/lib/response.js';
import { env } from '@/config/env.js';

export const healthRouter: Router = Router();

/** Lightweight — for load balancer / Docker healthcheck */
healthRouter.get('/healthz', (_req, res) => {
  res.status(200).type('text/plain').send('ok\n');
});

/** Detailed — for monitoring dashboards */
healthRouter.get('/readyz', async (_req, res, next) => {
  try {
    const start = Date.now();

    // DB ping
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    sendSuccess(res, {
      status: 'healthy',
      version: '2.0.0',
      env: env.NODE_ENV,
      uptime: process.uptime(),
      dependencies: {
        database: { status: 'up', latencyMs: dbLatency }
      },
      totalLatencyMs: Date.now() - start
    });
  } catch (err) {
    next(err);
  }
});