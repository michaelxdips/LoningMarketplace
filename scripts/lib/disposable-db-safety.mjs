const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const DATABASE_SUFFIX = /_(?:test|e2e)$/;
const PROJECT_NAME = /^marketplace-loning-(?:test|e2e)-[a-z0-9][a-z0-9-]{0,39}$/;
const RESERVED_DATABASES = new Set(['loning_digital', 'loning_digital_dev', 'postgres', 'template0', 'template1']);
const PRODUCTION_LIKE_DATABASE = /(?:^|_)(?:prod|production|live)(?:_|$)/;
const FORBIDDEN_PORTS = new Set([5432]);

export function assertDisposableDatabase(env) {
  if (env.NODE_ENV !== 'test') throw new Error('DISPOSABLE_DB_REFUSED: NODE_ENV must equal test');
  if (env.ALLOW_DISPOSABLE_DB_MUTATION !== '1') throw new Error('DISPOSABLE_DB_REFUSED: ALLOW_DISPOSABLE_DB_MUTATION must equal 1');
  if (!PROJECT_NAME.test(env.DISPOSABLE_COMPOSE_PROJECT ?? '')) throw new Error('DISPOSABLE_DB_REFUSED: invalid isolated Compose project name');
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error('DISPOSABLE_DB_REFUSED: malformed DATABASE_URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DISPOSABLE_DB_REFUSED: DATABASE_URL must use PostgreSQL');
  if (!LOOPBACK_HOSTS.has(url.hostname)) throw new Error('DISPOSABLE_DB_REFUSED: database host must be loopback');
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || FORBIDDEN_PORTS.has(port)) throw new Error('DISPOSABLE_DB_REFUSED: DATABASE_URL must use a non-development loopback port');
  if (!url.username || !url.password) throw new Error('DISPOSABLE_DB_REFUSED: explicit test username and password are required');
  let database;
  try { database = decodeURIComponent(url.pathname.slice(1)); } catch { throw new Error('DISPOSABLE_DB_REFUSED: malformed encoded database name'); }
  if (!database || database.includes('/') || !DATABASE_SUFFIX.test(database) || RESERVED_DATABASES.has(database) || PRODUCTION_LIKE_DATABASE.test(database)) throw new Error('DISPOSABLE_DB_REFUSED: database must be an unambiguous non-production name ending in _test or _e2e');
  const sslmode = url.searchParams.get('sslmode');
  if (sslmode && sslmode !== 'disable') throw new Error('DISPOSABLE_DB_REFUSED: managed/SSL database URLs are not disposable targets');
  return { project: env.DISPOSABLE_COMPOSE_PROJECT, host: url.hostname, port: Number(url.port), database, redactedUrl: `${url.protocol}//${encodeURIComponent(url.username)}:***@${url.host}/${database}` };
}