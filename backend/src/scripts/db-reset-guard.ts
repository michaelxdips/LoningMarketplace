export const ALLOWED_RESET_ENVIRONMENTS = new Set(['development', 'test']);
export const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'db', 'postgres', 'supabase_db']);
export const RESETTABLE_APPLICATION_TABLES = ['products', 'umkms', 'media_assets', 'sessions', 'audit_logs', 'users'] as const;
export const LOCAL_COMPOSE_PROJECT = 'marketplace-loning-local';
export const LOCAL_COMPOSE_FILE = 'compose.yaml';

export type ResetSafetyInput = {
  nodeEnv: string | undefined;
  force: boolean;
  databaseUrl: string | undefined;
  affectedTables: readonly string[];
  composeProject: string | undefined;
  composeFile: string | undefined;
  allowedTestProjectRefs?: readonly string[];
};

export type ResetSafetyResult =
  | { safe: true; url: URL; target: 'local' | 'allowlisted-test-project' }
  | { safe: false; reason: string };

const protectedMarker = /(^|[^a-z0-9])(prod(uction)?|stag(e|ing)?)([^a-z0-9]|$)/i;

export function validateResetSafety(input: ResetSafetyInput): ResetSafetyResult {
  if (!input.nodeEnv || !ALLOWED_RESET_ENVIRONMENTS.has(input.nodeEnv)) {
    return { safe: false, reason: `NODE_ENV must be one of: ${[...ALLOWED_RESET_ENVIRONMENTS].join(', ')}` };
  }
  if (!input.force) return { safe: false, reason: 'The --force flag is required.' };
  if (!input.databaseUrl?.trim()) return { safe: false, reason: 'DATABASE_URL is required.' };
  if (input.affectedTables.length === 0) return { safe: false, reason: 'Affected table scope must be explicit.' };
  if (input.affectedTables.some((table) => !RESETTABLE_APPLICATION_TABLES.includes(table as typeof RESETTABLE_APPLICATION_TABLES[number]))) {
    return { safe: false, reason: 'Affected table scope contains an unknown table.' };
  }
  if (input.composeProject !== LOCAL_COMPOSE_PROJECT) return { safe: false, reason: 'Compose project identity is not the local project.' };
  if (input.composeFile !== LOCAL_COMPOSE_FILE) return { safe: false, reason: 'Compose file identity is not explicit or recognized.' };

  let url: URL;
  try {
    url = new URL(input.databaseUrl);
  } catch {
    return { safe: false, reason: 'Malformed DATABASE_URL.' };
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
    return { safe: false, reason: 'DATABASE_URL must identify a PostgreSQL host and database.' };
  }

  const identity = `${url.hostname}/${url.pathname.slice(1)}`;
  if (protectedMarker.test(identity)) return { safe: false, reason: 'Production or staging database identity detected.' };
  if (LOCAL_DATABASE_HOSTS.has(url.hostname)) return { safe: true, url, target: 'local' };

  const projectMatch = /^db\.([a-z0-9-]+)\.supabase\.co$/i.exec(url.hostname);
  const projectRef = projectMatch?.[1];
  if (input.nodeEnv === 'test' && projectRef && input.allowedTestProjectRefs?.includes(projectRef)) {
    return { safe: true, url, target: 'allowlisted-test-project' };
  }
  return { safe: false, reason: `Database host '${url.hostname}' is not an allowed local or test target.` };
}

