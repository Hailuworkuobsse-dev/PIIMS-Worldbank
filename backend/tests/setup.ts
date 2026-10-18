import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, afterAll, vi } from 'vitest';

// Load .env.test (if present) so unit tests get valid env vars without
// polluting process.env with developer-specific values. Existing vars win.
const envTestPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(envTestPath)) {
  for (const rawLine of fs.readFileSync(envTestPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

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