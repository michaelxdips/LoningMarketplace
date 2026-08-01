import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(24 * 30).default(24 * 7),
  SESSION_RETENTION_DAYS: z.coerce.number().int().nonnegative().max(3650).default(30),
  SESSION_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default('loning_session'),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().max(100).default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().max(1440).default(15),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1000).default(10),
  LOGIN_RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().max(100000).default(100),
  TRUST_PROXY: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  COOKIE_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).optional(),
  MEDIA_STORAGE_DRIVER: z.enum(['filesystem', 's3']).default('filesystem'),
  MEDIA_FILESYSTEM_ROOT: z.string().trim().min(1).default('./storage'),
  MEDIA_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3001/media'),
  MEDIA_MAX_BYTES: z.coerce.number().int().positive().max(50_000_000).default(5 * 1024 * 1024),
  MEDIA_MAX_WIDTH: z.coerce.number().int().positive().max(100_000).default(8_000),
  MEDIA_MAX_HEIGHT: z.coerce.number().int().positive().max(100_000).default(8_000),
  MEDIA_MAX_PIXELS: z.coerce.number().int().positive().max(500_000_000).default(40_000_000),
  MEDIA_ORPHAN_GRACE_HOURS: z.coerce.number().int().nonnegative().max(24 * 365).default(24),
  S3_BUCKET: z.string().trim().min(1).optional(),
  S3_REGION: z.string().trim().min(1).optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});

type ParsedEnv = z.infer<typeof envSchema>;
export type AppEnv = Omit<ParsedEnv, 'DATABASE_URL' | 'PUBLIC_SITE_URL' | keyof MediaConfig> & { DATABASE_URL: string; PUBLIC_SITE_URL?: string; COOKIE_SAMESITE?: 'lax' | 'strict' | 'none' } & Partial<MediaConfig>;
export type MediaConfig = Pick<ParsedEnv, 'MEDIA_STORAGE_DRIVER' | 'MEDIA_FILESYSTEM_ROOT' | 'MEDIA_PUBLIC_BASE_URL' | 'MEDIA_MAX_BYTES' | 'MEDIA_MAX_WIDTH' | 'MEDIA_MAX_HEIGHT' | 'MEDIA_MAX_PIXELS' | 'MEDIA_ORPHAN_GRACE_HOURS' | 'S3_BUCKET' | 'S3_REGION' | 'S3_ENDPOINT' | 'S3_ACCESS_KEY_ID' | 'S3_SECRET_ACCESS_KEY' | 'S3_FORCE_PATH_STYLE'>;

export function mediaConfig(env: AppEnv): MediaConfig {
  return {
    MEDIA_STORAGE_DRIVER: env.MEDIA_STORAGE_DRIVER ?? 'filesystem', MEDIA_FILESYSTEM_ROOT: env.MEDIA_FILESYSTEM_ROOT ?? './storage',
    MEDIA_PUBLIC_BASE_URL: env.MEDIA_PUBLIC_BASE_URL ?? 'http://localhost:3001/media', MEDIA_MAX_BYTES: env.MEDIA_MAX_BYTES ?? 5 * 1024 * 1024,
    MEDIA_MAX_WIDTH: env.MEDIA_MAX_WIDTH ?? 8_000, MEDIA_MAX_HEIGHT: env.MEDIA_MAX_HEIGHT ?? 8_000, MEDIA_MAX_PIXELS: env.MEDIA_MAX_PIXELS ?? 40_000_000,
    MEDIA_ORPHAN_GRACE_HOURS: env.MEDIA_ORPHAN_GRACE_HOURS ?? 24, S3_BUCKET: env.S3_BUCKET, S3_REGION: env.S3_REGION,
    S3_ENDPOINT: env.S3_ENDPOINT, S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE: env.S3_FORCE_PATH_STYLE ?? false,
  };
}

export function parseEnv(input: NodeJS.ProcessEnv, requireDatabase = true): AppEnv {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  if (requireDatabase && !parsed.data.DATABASE_URL) throw new Error('DATABASE_URL is required. For local development: copy backend/.env.example to backend/.env, run npm run db:local:setup, then run npm run dev:all. Aiven is not required for local development.');
  if (parsed.data.NODE_ENV === 'production' && !input.CORS_ORIGIN) throw new Error('CORS_ORIGIN is required in production');
  if (parsed.data.NODE_ENV === 'production' && parsed.data.COOKIE_SECURE === false) throw new Error('COOKIE_SECURE must be true in production');
  if (parsed.data.NODE_ENV === 'production' && parsed.data.MEDIA_STORAGE_DRIVER !== 's3') throw new Error('MEDIA_STORAGE_DRIVER must be s3 in production');
  if (parsed.data.MEDIA_STORAGE_DRIVER === 's3' && (!parsed.data.S3_BUCKET || !parsed.data.S3_REGION)) throw new Error('S3_BUCKET and S3_REGION are required for S3 storage');
  if ((parsed.data.S3_ACCESS_KEY_ID && !parsed.data.S3_SECRET_ACCESS_KEY) || (!parsed.data.S3_ACCESS_KEY_ID && parsed.data.S3_SECRET_ACCESS_KEY)) throw new Error('Both S3 credential fields must be provided together');
  if (parsed.data.NODE_ENV === 'production' && !input.MEDIA_PUBLIC_BASE_URL) throw new Error('MEDIA_PUBLIC_BASE_URL is required in production');
  if (parsed.data.NODE_ENV === 'production') {
    if (!input.PUBLIC_SITE_URL) throw new Error('PUBLIC_SITE_URL is required in production');
    const u = new URL(parsed.data.PUBLIC_SITE_URL);
    if (u.protocol !== 'https:') throw new Error('PUBLIC_SITE_URL must use HTTPS in production');
    if (u.hostname === 'localhost' || u.hostname.endsWith('.example.com') || u.hostname === 'example.com') throw new Error('PUBLIC_SITE_URL cannot use localhost or example placeholders in production');
    if (u.pathname !== '/' || u.search || u.hash || u.username || u.password) throw new Error('PUBLIC_SITE_URL must be a plain origin without path, query, or credentials');
  }
  if (parsed.data.CORS_ORIGIN === '*' || parsed.data.CORS_ORIGIN.includes(',')) throw new Error('CORS_ORIGIN must be one explicit origin');
  const cookieSecure = parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === 'production';
  const cookieSameSite = input.COOKIE_SAMESITE ? (input.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') : (parsed.data.NODE_ENV === 'production' ? 'none' : parsed.data.COOKIE_SAMESITE);
  return { ...parsed.data, COOKIE_SECURE: cookieSecure, COOKIE_SAMESITE: cookieSameSite, DATABASE_URL: parsed.data.DATABASE_URL ?? '' };
}

export function loadEnv(requireDatabase = true): AppEnv {
  return parseEnv(process.env, requireDatabase);
}
