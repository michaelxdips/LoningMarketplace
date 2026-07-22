import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for shell-free npm execution');
const npm = (args) => [process.execPath, [npmCli, ...args]];
const compose = ['compose', '--project-name', 'marketplace-loning-local', '--file', 'compose.yaml'];
const snapshotDirectory = resolve(root, '.e2e-snapshots');
const snapshotPath = resolve(snapshotDirectory, `e2e-baseline-${randomUUID()}.sql`);
let snapshotValid = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false, ...options });
  if (result.error) throw new Error(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  return result;
}

function captureBaseline() {
  mkdirSync(snapshotDirectory, { recursive: true });
  const result = run('docker', [...compose, 'exec', '-T', 'postgres', 'pg_dump', '--username=loning', '--dbname=loning_digital', '--clean', '--if-exists', '--no-owner', '--no-privileges'], { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout) throw new Error(`Baseline pg_dump failed with exit code ${result.status}`);
  writeFileSync(snapshotPath, result.stdout);
  const stats = statSync(snapshotPath);
  if (stats.size <= 0) throw new Error('Baseline snapshot is empty');
  snapshotValid = true;
  console.log(`Baseline snapshot: ${snapshotPath} (${stats.size} bytes)`);
}

function restoreBaseline() {
  if (!snapshotValid) { console.log('Baseline restore skipped: no valid snapshot.'); return; }
  const snapshot = readFileSync(snapshotPath);
  const result = spawnSync('docker', [...compose, 'exec', '-T', 'postgres', 'psql', '--username=loning', '--dbname=loning_digital', '--set', 'ON_ERROR_STOP=1'], { cwd: root, input: snapshot, stdio: ['pipe', 'inherit', 'inherit'], shell: false });
  if (result.status !== 0) throw new Error(`Baseline restore failed with exit code ${result.status}`);
  rmSync('backend/storage/fixtures', { recursive: true, force: true });
  console.log('Baseline restore: passed');
}

let rootError;
const playwrightArgs = process.argv.slice(2);
try {
  run(...npm(['run', 'db:local:setup']));
  captureBaseline();
  run(...npm(['--prefix', 'backend', 'run', 'e2e:setup']));
  run(...npm(['exec', '--', 'playwright', 'test', ...playwrightArgs]));
} catch (error) {
  rootError = error instanceof Error ? error : new Error(String(error));
} finally {
  try { restoreBaseline(); } catch (error) { console.error(`RESTORE_FAILURE: ${error instanceof Error ? error.message : error}`); if (!rootError) rootError = error instanceof Error ? error : new Error(String(error)); }
  try { rmSync(snapshotPath, { force: true }); } catch (error) { console.error(`SNAPSHOT_CLEANUP_FAILURE: ${error instanceof Error ? error.message : error}`); if (!rootError) rootError = error instanceof Error ? error : new Error(String(error)); }
  try { rmSync(snapshotDirectory, { recursive: true, force: true }); } catch (error) { console.error(`SNAPSHOT_DIRECTORY_CLEANUP_FAILURE: ${error instanceof Error ? error.message : error}`); if (!rootError) rootError = error instanceof Error ? error : new Error(String(error)); }
}
if (rootError) { console.error(`E2E_FAILURE: ${rootError.message}`); process.exitCode = 1; }
