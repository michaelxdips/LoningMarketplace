import { spawn, spawnSync } from 'node:child_process';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const backendOutput = [];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' && command.toLowerCase().endsWith('.cmd'), ...options });
  if (result.error) throw new Error(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}${result.signal ? ` and signal ${result.signal}` : ''}`);
}

async function waitForReady(timeout = 120_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://localhost:3001/api/ready');
      if (response.ok) return;
      lastError = new Error(`Readiness returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Backend did not become ready: ${lastError?.message ?? 'timeout'}\n${backendOutput.join('')}`);
}

function stopOwnedBackend(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

async function main() {
  run(npmCommand, ['run', 'db:local:up']);
  run(npmCommand, ['run', 'db:local:wait']);
  run(npmCommand, ['--prefix', 'backend', 'run', 'db:migrate']);
  run(npmCommand, ['--prefix', 'backend', 'run', 'db:seed']);
  run(npmCommand, ['--prefix', 'backend', 'run', 'e2e:setup']);

  const backend = spawn(npmCommand, ['--prefix', 'backend', 'run', 'dev'], { cwd: root, shell: process.platform === 'win32', env: process.env });
  backend.stdout.on('data', data => backendOutput.push(String(data)));
  backend.stderr.on('data', data => backendOutput.push(String(data)));
  try {
    await waitForReady();
    run(process.execPath, ['scripts/integration-smoke.mjs'], { env: { ...process.env, API_BASE_URL: 'http://localhost:3001/api' } });
  } catch (error) {
    if (backendOutput.length) console.error(`Backend output:\n${backendOutput.slice(-120).join('')}`);
    throw error;
  } finally {
    stopOwnedBackend(backend);
  }
}

try { await main(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
