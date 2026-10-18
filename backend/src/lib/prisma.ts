import { PrismaClient } from '@prisma/client';
import { env, isDev } from '@/config/env.js';
import { logger } from '@/config/logger.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' }
        ]
      : [{ emit: 'event', level: 'error' }]
  });

if (isDev) globalForPrisma.prisma = prisma;

// Log slow queries + errors via pino
if (isDev) {
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 200) {
      logger.warn({ duration: e.duration, query: e.query.slice(0, 300) }, 'slow query');
    }
  });
}

(prisma as any).$on('error', (e: any) => {
  logger.error({ message: e.message }, 'prisma error');
});

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
  logger.info({ url: maskDbUrl(env.DATABASE_URL) }, 'PostgreSQL connected');
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}

function maskDbUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username}:***@${u.host}${u.pathname}`;
  } catch {
    return '[unparseable]';
  }
}