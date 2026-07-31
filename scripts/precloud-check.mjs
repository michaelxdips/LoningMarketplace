import { spawnSync } from 'node:child_process';

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for shell-free npm execution');

const isProductionProbe = process.argv.includes('--production') || process.argv.includes('--probe-storage');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false, windowsHide: true, ...options });
  if (result.error) throw new Error(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  return result;
}

function npm(args, options) {
  return run(process.execPath, [npmCli, ...args], options);
}

console.log(`--- PRE-CLOUD AUDIT & HEALTH CHECK (Mode: ${isProductionProbe ? 'PROVISIONED_PRODUCTION' : 'STATIC_READINESS'}) ---`);

console.log('1. Checking static code health (lint & typecheck)...');
npm(['run', 'lint']);
npm(['run', 'typecheck']);

if (isProductionProbe) {
  console.log('2. Running provisioned S3 storage probe check...');
  npm(['--prefix', 'backend', 'run', 'storage:check', '--', '--probe']);
} else {
  console.log('2. Checking backend storage configuration preflight (config mode)...');
  npm(['--prefix', 'backend', 'run', 'storage:check']);
}

console.log('3. Checking unit test suite...');
npm(['run', 'test:unit']);

console.log('4. Verifying production build environment contract...');
const testSiteUrl = process.env.VITE_PUBLIC_SITE_URL || 'https://loning-maju.example.com';
npm(['run', 'build'], { env: { ...process.env, VITE_PUBLIC_SITE_URL: testSiteUrl } });

console.log(`--- PRE-CLOUD ${isProductionProbe ? 'PROVISIONED' : 'STATIC'} HEALTH CHECK PASSED CLEANLY ---`);
