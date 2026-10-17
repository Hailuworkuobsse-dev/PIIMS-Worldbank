import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { redis } from '@/config/redis.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mysql://root:admin@localhost:3307/piims_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379/1';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-32-chars-long-aaaa';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-at-least-32-chars-long-bbbb';
process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? 'minio';
process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? 'minio123';
process.env.S3_BUCKET = process.env.S3_BUCKET ?? 'piims-test';
process.env.S3_ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
process.env.S3_REGION = process.env.S3_REGION ?? 'us-east-1';
process.env.LOG_LEVEL = 'silent';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

beforeEach(async () => {
  // Flush test cache before each test
  await redis.flushdb();
});