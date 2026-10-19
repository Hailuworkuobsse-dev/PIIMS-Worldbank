import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_PATH: z.string().startsWith('/').default('/v1'),
  CORS_ORIGINS: z.string().default(
    'http://localhost:5173,http://localhost:3414,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:3414'
  ),
  TRUST_PROXY: z.coerce.boolean().default(false),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('8h'),

  MFA_ISSUER: z.string().default('PIIMS'),
  MFA_REQUIRED_ROLES: z.string().default(''),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(5),

  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(false),

  FEATURE_IMPACT: z.coerce.boolean().default(true),
  FEATURE_GEO: z.coerce.boolean().default(true),
  FEATURE_OFFLINE: z.coerce.boolean().default(true),

  // Integration endpoints — optional until Step 9
  FMIS_BASE_URL: z.string().url().optional(),
  FMIS_API_KEY: z.string().optional(),
  DBE_BASE_URL: z.string().url().optional(),
  DBE_API_KEY: z.string().optional(),
  WB_BASE_URL: z.string().url().optional(),
  SMS_GATEWAY_URL: z.string().url().optional(),
  SMS_GATEWAY_KEY: z.string().optional(),
  USSD_GATEWAY_URL: z.string().url().optional(),
  USSD_GATEWAY_KEY: z.string().optional(),
  GIS_BASE_URL: z.string().url().optional(),
  GIS_API_KEY: z.string().optional(),
  ODK_BASE_URL: z.string().url().optional(),
  ODK_API_KEY: z.string().optional(),
  SAFE_ROOM_URL: z.string().url().optional(),
  IDP_ISSUER_URL: z.string().url().optional(),
  API_PUBLIC_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  IDP_CLIENT_ID: z.string().optional(),
  IDP_CLIENT_SECRET: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  cached = parsed.data;
  return cached;
}

export const env = loadEnv();

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
export const mfaRequiredRoles = env.MFA_REQUIRED_ROLES.split(',').map((s) => s.trim()).filter(Boolean);