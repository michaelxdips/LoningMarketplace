import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const harness = resolve(root, 'scripts', 'run-isolated.mjs');
const result = spawnSync(process.execPath, [harness, 'integration', ...process.argv.slice(2)], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: false,
  windowsHide: true,
});

if (result.error) {
  console.error(`ISOLATED_INTEGRATION_DELEGATION_FAILURE: ${result.error.message}`);
  process.exitCode = 1;
} else if (result.signal) {
  console.error(`ISOLATED_INTEGRATION_DELEGATION_FAILURE: child terminated by ${result.signal}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
