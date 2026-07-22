import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const npmCli = process.env.npm_execpath ?? resolve(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const compose = ['compose', '--project-name', 'marketplace-loning-local', '--file', 'compose.yaml'];

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf-8', shell: false, ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`${cmd} ${args.join(' ')} failed with status ${result.status}`);
  }
  return result.stdout;
}

function runInherited(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed with status ${result.status}`);
}

function npmArgs(args) {
  return [process.execPath, [npmCli, ...args]];
}

function captureEvidence(label) {
  const output = run(...npmArgs(['run', 'db:seed-hash', '--workspace=backend', '--silent']));
  const hash = /Seed Content Hash:\s*([a-f0-9]{64})/i.exec(output)?.[1];
  const countsText = /Seed Row Counts:\s*(\{[^\r\n]+\})/i.exec(output)?.[1];
  if (!hash || !countsText) throw new Error(`Failed to extract complete seed evidence for ${label}`);
  let counts;
  try { counts = JSON.parse(countsText); } catch (error) { throw new Error(`Invalid row counts for ${label}: ${error instanceof Error ? error.message : error}`); }
  console.log(`${label} Hash: ${hash}`);
  console.log(`${label} Row Counts: ${JSON.stringify(counts)}`);
  return { hash, counts };
}

function assertEqual(left, right, label) {
  if (left.hash !== right.hash || JSON.stringify(left.counts) !== JSON.stringify(right.counts)) {
    throw new Error(`FAILURE: ${label} seed evidence differs`);
  }
}

async function main() {
  console.log('--- CLEAN SEED RUN 1 ---');
  runInherited('docker', [...compose, 'down', '-v']);
  runInherited(...npmArgs(['run', 'db:local:setup']));
  const clean1 = captureEvidence('Clean Run 1');

  console.log('--- CLEAN SEED RUN 2 ---');
  runInherited('docker', [...compose, 'down', '-v']);
  runInherited(...npmArgs(['run', 'db:local:setup']));
  const clean2 = captureEvidence('Clean Run 2');
  assertEqual(clean1, clean2, 'independent clean');

  console.log('--- IDEMPOTENT SEED RUN ---');
  runInherited(...npmArgs(['run', 'db:seed', '--workspace=backend']));
  const idempotent = captureEvidence('Idempotent Run');
  assertEqual(clean2, idempotent, 'idempotent');
  console.log('SUCCESS: Clean seed hashes and row counts are deterministic and idempotent!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
