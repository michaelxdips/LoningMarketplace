import { spawnSync } from 'child_process';
import { resolve } from 'path';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed with status ${result.status}`);
}

async function main() {
  console.log('--- RESET AND SEED ---');
  // First, completely tear down any existing stack
  spawnSync('docker', ['compose', '--project-name', 'marketplace-loning-local', 'down', '-v'], { stdio: 'inherit' });
  
  run('npm', ['run', 'db:local:setup']); // Sets up the compose stack and runs migration+seed
  
  console.log('--- AUDIT BEFORE E2E ---');
  run('npm', ['run', 'db:audit', '--workspace=backend']);
  
  for (let i = 1; i <= 3; i++) {
    console.log(`--- E2E RUN ${i} ---`);
    run('npm', ['run', 'test:e2e:local']);
  }
  
  console.log('--- AUDIT AFTER E2E ---');
  run('npm', ['run', 'db:audit', '--workspace=backend']);
  
  console.log('--- CHECK PORTS ---');
  // Check if 3000, 3001 are free. 5432 will be active since we didn't spin down compose yet.
  const netstat = spawnSync('netstat', ['-ano']);
  const output = netstat.stdout.toString();
  const ports = ['3000', '3001'];
  for (const port of ports) {
    if (output.includes(`:${port} `)) {
      console.log(`WARNING: Port ${port} is NOT free.`);
    } else {
      console.log(`Port ${port} is free.`);
    }
  }
  
  console.log('--- COMPLETED ---');
}

main().catch(console.error);
