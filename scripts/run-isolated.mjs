import { rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertDisposableDatabase } from './lib/disposable-db-safety.mjs';

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for shell-free npm execution');
const mode = process.argv[2];
if (!['integration', 'e2e', 'full'].includes(mode)) throw new Error('Usage: node scripts/run-isolated.mjs integration|e2e|full [Playwright args]');
const project = mode === 'e2e' ? 'marketplace-loning-e2e-phase0' : 'marketplace-loning-test-phase0';
const database = mode === 'e2e' ? 'loning_phase0_e2e' : 'loning_phase0_test';
const port = mode === 'e2e' ? '55433' : '55432';
const artifactRoot = resolve(root, '.phase0-runtime', mode);
const artifactMediaRoot = resolve(artifactRoot, 'media');
const env = {
  ...process.env,
  NODE_ENV: 'test',
  ALLOW_DISPOSABLE_DB_MUTATION: '1',
  DISPOSABLE_COMPOSE_PROJECT: project,
  DISPOSABLE_DB_PORT: port,
  DISPOSABLE_DB_NAME: database,
  DATABASE_URL: `postgresql://loning_test:loning_disposable_only@127.0.0.1:${port}/${database}`,
  COOKIE_SECURE: 'false',
  CORS_ORIGIN: 'http://localhost:3000',
  MEDIA_STORAGE_DRIVER: 'filesystem',
  MEDIA_FILESYSTEM_ROOT: artifactMediaRoot,
  MEDIA_PUBLIC_BASE_URL: 'http://localhost:3001/media',
  RATE_LIMIT_MAX: '10000',
  LOGIN_RATE_LIMIT_MAX: '1000',
};
const target = assertDisposableDatabase(env);
const compose = ['compose', '--project-name', project, '--file', 'compose.test.yaml'];
const composeConfig = spawnSync('docker', [...compose, 'config', '--quiet'], { cwd: root, env, stdio: 'ignore', shell: false, windowsHide: true });
if (composeConfig.error || composeConfig.status !== 0) throw new Error('ISOLATED_REFUSED: test Compose configuration is invalid or Docker is unavailable');
const existingProject = spawnSync('docker', ['compose', '--project-name', project, '--file', 'compose.test.yaml', 'ps', '-q'], { cwd: root, env, encoding: 'utf8', shell: false, windowsHide: true });
if (existingProject.error || existingProject.status !== 0) throw new Error(`ISOLATED_REFUSED: Docker project preflight failed${existingProject.error ? `: ${existingProject.error.message}` : ` with exit code ${existingProject.status}`}`);
if (existingProject.stdout.trim()) throw new Error(`ISOLATED_REFUSED: isolated project ${project} already has resources; refusing to adopt them`);
const backendOutput = [];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: false, windowsHide: true, ...options });
  if (result.error) throw new Error(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}${result.signal ? ` and signal ${result.signal}` : ''}`);
  return result;
}
function npm(args, options) { return run(process.execPath, [npmCli, ...args], options); }
function docker(args, options) { return run('docker', [...compose, ...args], options); }
async function waitForPostgres(timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = spawnSync('docker', [...compose, 'exec', '-T', 'postgres', 'pg_isready', '-U', 'loning_test', '-d', database], { cwd: root, env, stdio: 'ignore', shell: false, windowsHide: true });
    if (result.status === 0) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Disposable PostgreSQL did not become healthy');
}
async function waitForBackend(timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { const response = await fetch('http://127.0.0.1:3001/api/ready'); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Backend did not become ready\n${backendOutput.slice(-100).join('')}`);
}
function stop(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  else child.kill('SIGTERM');
}
async function integration() {
  const backend = spawn(process.execPath, [npmCli, '--prefix', 'backend', 'run', 'dev'], { cwd: root, env, shell: false, windowsHide: true });
  backend.stdout.on('data', data => backendOutput.push(String(data)));
  backend.stderr.on('data', data => backendOutput.push(String(data)));
  try { await waitForBackend(); run(process.execPath, ['scripts/integration-smoke.mjs'], { env: { ...env, API_BASE_URL: 'http://127.0.0.1:3001/api' } }); }
  finally { stop(backend); }
}

let failure;
console.log(`Disposable target: ${target.redactedUrl}; project=${target.project}; port=${target.port}`);
try {
  docker(['up', '-d', '--wait', 'postgres']);
  await waitForPostgres();
   npm(['--prefix', 'backend', 'run', 'db:migrate']);
   npm(['--prefix', 'backend', 'run', 'db:seed']);
   if (mode === 'e2e' || mode === 'full') npm(['--prefix', 'backend', 'run', 'e2e:setup']);
   if (mode === 'integration' || mode === 'full') await integration();
  if (mode === 'e2e' || mode === 'full') npm(['exec', '--', 'playwright', 'test', ...process.argv.slice(3)]);
  npm(['--prefix', 'backend', 'run', 'db:audit']);
} catch (error) {
  failure = error instanceof Error ? error : new Error(String(error));
  try { docker(['logs', '--no-color', '--tail', '200', 'postgres']); } catch {}
}
let cleanupFailure;
try {
  docker(['down', '--volumes', '--remove-orphans']);
} catch (error) {
  cleanupFailure = error instanceof Error ? error : new Error(String(error));
}
try {
  rmSync(artifactRoot, { recursive: true, force: true });
} catch (error) {
  const artifactCleanupFailure = error instanceof Error ? error : new Error(String(error));
  cleanupFailure = cleanupFailure ? new Error(`${cleanupFailure.message}; artifact cleanup also failed: ${artifactCleanupFailure.message}`) : artifactCleanupFailure;
}
if (failure) { console.error(`ISOLATED_${mode.toUpperCase()}_FAILURE: ${failure.message}`); process.exitCode = 1; }
if (cleanupFailure) { console.error(`ISOLATED_${mode.toUpperCase()}_CLEANUP_FAILURE: ${cleanupFailure.message}`); process.exitCode = 1; }