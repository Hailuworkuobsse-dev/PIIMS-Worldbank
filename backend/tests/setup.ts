import { beforeAll, afterAll, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mysql://root:admin@localhost:3307/piims_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-32-chars-minimum-aaaaaaaa';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-32-chars-minimum-bbbbbbb';
process.env.S3_ACCESS_KEY = 'minio';
process.env.S3_SECRET_KEY = 'minio123';
process.env.S3_BUCKET = 'piims-test';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_REGION = 'us-east-1';
process.env.LOG_LEVEL = 'silent';

beforeAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterAll(() => {
  vi.useRealTimers();
});