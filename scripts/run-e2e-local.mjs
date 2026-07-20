import { spawnSync } from 'node:child_process';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
}

async function main() {
  run(npmCommand, ['run', 'db:local:setup']);
  run(npmCommand, ['--prefix', 'backend', 'run', 'e2e:setup']);
  run(npmCommand, ['exec', '--', 'playwright', 'test']);
}

try { await main(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
