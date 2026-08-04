import { rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertDisposableDatabase } from './lib/disposable-db-safety.mjs';

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for shell-free npm execution');
const invocationId = `${process.pid}-${Date.now().toString(36)}`;
const project = `marketplace-loning-test-seed-${invocationId}`.slice(0, 59);
const database = `loning_seed_${invocationId.replaceAll('-', '_')}_test`;
const compose = ['compose', '--project-name', project, '--file', 'compose.test.yaml'];
const applicationSpecificKeys = [
  'ALLOW_ADMIN_BOOTSTRAP', 'ALLOW_SEED', 'APP_ENV', 'AWS_ACCESS_KEY_ID', 'AWS_CONTAINER_CREDENTIALS_FULL_URI',
  'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI', 'AWS_PROFILE', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
  'AWS_WEB_IDENTITY_TOKEN_FILE', 'BOOTSTRAP_CONFIRM', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD',
  'BOOTSTRAP_ADMIN_USERNAME', 'DATABASE_ENVIRONMENT', 'DATABASE_URL', 'GOOGLE_APPLICATION_CREDENTIALS',
  'MEDIA_FILESYSTEM_ROOT', 'MEDIA_PUBLIC_BASE_URL', 'MEDIA_STORAGE_DRIVER', 'PUBLIC_SITE_URL',
  'S3_ACCESS_KEY_ID', 'S3_BUCKET', 'S3_ENDPOINT', 'S3_FORCE_PATH_STYLE', 'S3_REGION', 'S3_SECRET_ACCESS_KEY',
  'SEED_DEVELOPMENT_PASSWORD', 'SEED_PROFILE', 'VITE_API_URL', 'VITE_PUBLIC_SITE_URL',
];
const inheritedEnv = { ...process.env };
for (const key of applicationSpecificKeys) delete inheritedEnv[key];
async function findAvailablePorts(count) {
  const servers = [];
  try {
    for (let index = 0; index < count; index += 1) {
      const server = createServer();
      await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
      servers.push(server);
    }
    return servers.map((server) => String(server.address().port));
  } finally {
    await Promise.all(servers.map((server) => new Promise((accept) => server.close(accept))));
  }
}
const [port, minioPort, minioConsolePort] = await findAvailablePorts(3);
const mediaRoot = resolve(root, '.phase0-runtime', 'seed-determinism', invocationId, 'media');
const env = {
  ...inheritedEnv,
  NODE_ENV: 'test', APP_ENV: 'test', DATABASE_ENVIRONMENT: 'test', SEED_PROFILE: 'test',
  ALLOW_DISPOSABLE_DB_MUTATION: '1', DISPOSABLE_COMPOSE_PROJECT: project,
  DISPOSABLE_DB_PORT: port, DISPOSABLE_DB_NAME: database,
  DISPOSABLE_MINIO_PORT: minioPort, DISPOSABLE_MINIO_CONSOLE_PORT: minioConsolePort,
  DATABASE_URL: `postgresql://loning_test:loning_disposable_only@127.0.0.1:${port}/${database}`,
  MEDIA_STORAGE_DRIVER: 'filesystem', MEDIA_FILESYSTEM_ROOT: mediaRoot,
  MEDIA_PUBLIC_BASE_URL: 'http://127.0.0.1:3191', PUBLIC_SITE_URL: 'http://127.0.0.1:3190',
  COOKIE_SECURE: 'false', CORS_ORIGIN: 'http://127.0.0.1:3190',
};
const seedEnv = { ...env, ALLOW_SEED: '1' };
const target = assertDisposableDatabase(env);
let ownsResources = false;
let signalName;

function execute(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: false, windowsHide: true, ...options });
  if (result.error) throw new Error(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  if (result.signal) throw new Error(`${command} ${args.join(' ')} terminated by ${result.signal}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  return result;
}
function npm(args, options) { return execute(process.execPath, [npmCli, ...args], options); }
function docker(args, options) { return execute('docker', [...compose, ...args], options); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function waitForPostgres(timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = spawnSync('docker', [...compose, 'exec', '-T', 'postgres', 'pg_isready', '-U', 'loning_test', '-d', database], { cwd: root, env, stdio: 'ignore', shell: false, windowsHide: true });
    if (result.status === 0) return;
    await sleep(500);
  }
  throw new Error('Disposable PostgreSQL did not become healthy');
}

function captureEvidence(label) {
  const result = npm(['run', 'db:seed-hash', '--workspace=backend', '--silent'], { env, stdio: 'pipe', encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const hash = /Seed Content Hash:\s*([a-f0-9]{64})/i.exec(output)?.[1];
  const countsText = /Seed Row Counts:\s*(\{[^\r\n]+\})/i.exec(output)?.[1];
  if (!hash || !countsText) throw new Error(`Failed to extract canonical seed evidence for ${label}`);
  const counts = JSON.parse(countsText);
  console.log(`${label} Hash: ${hash}`);
  console.log(`${label} Row Counts: ${JSON.stringify(counts)}`);
  return { hash, counts };
}

function assertEqual(left, right, gate) {
  if (left.hash !== right.hash || JSON.stringify(left.counts) !== JSON.stringify(right.counts)) throw new Error(`${gate}_FAILURE: canonical seed evidence differs`);
  console.log(`${gate}_PASS: canonical hashes and row counts match.`);
}

async function teardown() {
  if (!ownsResources) return;
  const result = spawnSync('docker', [...compose, 'down', '--volumes', '--remove-orphans'], { cwd: root, env, stdio: 'inherit', shell: false, windowsHide: true });
  ownsResources = false;
  if (result.error || result.status !== 0) throw new Error(`Seed verifier teardown failed${result.error ? `: ${result.error.message}` : ` with exit code ${result.status}`}`);
}

async function freshDatabase() {
  if (ownsResources) await teardown();
  docker(['up', '-d', 'postgres']);
  ownsResources = true;
  await waitForPostgres();
  npm(['run', 'db:migrate', '--workspace=backend']);
}

async function cleanSeedSnapshot(label) {
  await freshDatabase();
  try {
    npm(['run', 'db:seed:test', '--workspace=backend'], { env: seedEnv });
    return captureEvidence(label);
  } finally {
    await teardown();
  }
}

async function verifyCleanRepeatability() {
  const first = await cleanSeedSnapshot('Clean Run A');
  const second = await cleanSeedSnapshot('Clean Run B');
  assertEqual(first, second, 'SEED_CLEAN_REPEATABILITY');
}

async function verifySameTargetIdempotency() {
  await freshDatabase();
  try {
    npm(['run', 'db:seed:test', '--workspace=backend'], { env: seedEnv });
    const first = captureEvidence('Same Target Run A');
    npm(['run', 'db:seed:test', '--workspace=backend'], { env: seedEnv });
    const second = captureEvidence('Same Target Run B');
    assertEqual(first, second, 'SEED_SAME_TARGET_IDEMPOTENCY');
  } finally {
    await teardown();
  }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => { signalName = signal; void teardown().finally(() => process.exit(1)); });
}

console.log(`Disposable seed target: ${target.redactedUrl}; project=${target.project}; port=${target.port}`);
try {
  const composeConfig = spawnSync('docker', [...compose, 'config', '--quiet'], { cwd: root, env, stdio: 'ignore', shell: false, windowsHide: true });
  if (composeConfig.error || composeConfig.status !== 0) throw new Error('SEED_VERIFIER_REFUSED: test Compose configuration is invalid or Docker is unavailable');
  await verifyCleanRepeatability();
  await verifySameTargetIdempotency();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  try { await teardown(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
  try { rmSync(resolve(mediaRoot, '..'), { recursive: true, force: true }); } catch (error) { console.error(`Seed verifier media cleanup failed: ${error instanceof Error ? error.message : error}`); process.exitCode = 1; }
  if (signalName) process.exitCode = 1;
}
