import { createHash } from 'node:crypto';

export type SeedProfile = 'development' | 'test' | 'preview';
export type DatabaseTarget = { host: string; port: string; database: string; fingerprint: string };

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const FORBIDDEN_TEST_PORTS = new Set(['5432']);
const TEST_PROJECT = /^marketplace-loning-(?:test|e2e)-[a-z0-9][a-z0-9-]{0,39}$/;
const TEST_DATABASE = /_(?:test|e2e)$/;
const PRODUCTION_NAME = /(?:^|_)(?:prod|production|live)(?:_|$)/i;
const PRODUCTION_HOST = /(?:aivencloud|\.render\.com|loningmarketplace)/i;

function refused(scope: string, reason: string): never {
  throw new Error(`${scope}_REFUSED: ${reason}`);
}

export function fingerprintDatabaseTarget(databaseUrl: string): DatabaseTarget {
  let parsed: URL;
  try { parsed = new URL(databaseUrl); } catch { return refused('DATABASE_TARGET', 'DATABASE_URL must be a valid PostgreSQL URL'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) return refused('DATABASE_TARGET', 'DATABASE_URL must use PostgreSQL');
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!parsed.hostname || !database || database.includes('/')) return refused('DATABASE_TARGET', 'DATABASE_URL must identify one database');
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port || '5432';
  const fingerprint = createHash('sha256').update(`${host}:${port}/${database}`).digest('hex').slice(0, 16);
  return { host, port, database, fingerprint };
}

export function formatDatabaseTarget(target: DatabaseTarget): string {
  return `${target.host}:${target.port}/${target.database} [target:${target.fingerprint}]`;
}

function assertNotProduction(target: DatabaseTarget, env: NodeJS.ProcessEnv, scope: string) {
  if (env.NODE_ENV === 'production' || env.APP_ENV === 'production' || env.DATABASE_ENVIRONMENT === 'production') refused(scope, 'production environment markers are not seed targets');
  if (PRODUCTION_HOST.test(target.host) || PRODUCTION_NAME.test(target.database)) refused(scope, 'production-like database target');
}

export function resolveSeedProfile(argv: readonly string[], env: NodeJS.ProcessEnv): SeedProfile {
  const flagIndex = argv.indexOf('--profile');
  const profile = flagIndex >= 0 ? argv[flagIndex + 1] : undefined;
  if (flagIndex < 0 || !profile || !['development', 'test', 'preview'].includes(profile)) refused('SEED_PROFILE', 'use --profile development|test|preview');
  if (profile === 'preview') refused('SEED_PROFILE_DISABLED', 'preview seed is disabled');
  if (env.SEED_PROFILE && env.SEED_PROFILE !== profile) refused('SEED_PROFILE', 'SEED_PROFILE does not match command profile');
  return profile as SeedProfile;
}

export function assertSafeSeedTarget(profile: SeedProfile, env: NodeJS.ProcessEnv): DatabaseTarget {
  if (env.ALLOW_SEED !== '1') refused('SEED_TARGET', 'ALLOW_SEED must equal 1');
  if (env.APP_ENV !== profile || env.DATABASE_ENVIRONMENT !== profile) refused('SEED_TARGET', 'APP_ENV and DATABASE_ENVIRONMENT must match the explicit seed profile');
  const target = fingerprintDatabaseTarget(env.DATABASE_URL ?? '');
  assertNotProduction(target, env, 'SEED_TARGET');
  if (profile === 'development') {
    if (env.NODE_ENV !== 'development') refused('SEED_TARGET', 'development seed requires NODE_ENV=development');
    if (!LOOPBACK_HOSTS.has(target.host) || !/(?:_dev|_development)$/i.test(target.database)) refused('SEED_TARGET', 'development seed requires a loopback database ending in _dev or _development');
  }
  if (profile === 'test') {
    if (env.NODE_ENV !== 'test') refused('SEED_TARGET', 'test seed requires NODE_ENV=test');
    if (env.ALLOW_DISPOSABLE_DB_MUTATION !== '1' || !TEST_PROJECT.test(env.DISPOSABLE_COMPOSE_PROJECT ?? '')) refused('SEED_TARGET', 'test seed requires the disposable Compose marker');
    const port = Number(target.port);
    if (!LOOPBACK_HOSTS.has(target.host) || !Number.isInteger(port) || port < 1024 || port > 65535 || FORBIDDEN_TEST_PORTS.has(target.port) || !TEST_DATABASE.test(target.database)) refused('SEED_TARGET', 'test seed requires a disposable loopback database target');
  }
  return target;
}

export function assertSafeBootstrapTarget(env: NodeJS.ProcessEnv): DatabaseTarget {
  if (env.NODE_ENV !== 'production' || env.APP_ENV !== 'production' || env.DATABASE_ENVIRONMENT !== 'production') refused('BOOTSTRAP_TARGET', 'bootstrap requires production environment markers');
  if (env.ALLOW_ADMIN_BOOTSTRAP !== '1' || env.BOOTSTRAP_CONFIRM !== 'CREATE_SUPERADMIN') refused('BOOTSTRAP_TARGET', 'explicit bootstrap confirmation is required');
  const target = fingerprintDatabaseTarget(env.DATABASE_URL ?? '');
  if (!PRODUCTION_HOST.test(target.host) && !PRODUCTION_NAME.test(target.database)) refused('BOOTSTRAP_TARGET', 'target does not look like the declared production database');
  return target;
}
