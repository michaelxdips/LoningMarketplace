import net from 'node:net';
import { spawnSync } from 'node:child_process';

const host = process.env.LOCAL_DB_HOST ?? '127.0.0.1';
const port = Number(process.env.LOCAL_DB_PORT ?? 5432);
const timeoutMs = Number(process.env.LOCAL_DB_WAIT_TIMEOUT_MS ?? 120000);
const started = Date.now();

function composeReady() {
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'loning', '-d', 'loning_digital'], { stdio: 'ignore', windowsHide: true });
  return result.status === 0;
}

function check() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ready) => { socket.destroy(); resolve(ready); };
    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

while (Date.now() - started < timeoutMs) {
  if (composeReady() || (await check() && composeReady())) { console.log(`Local PostgreSQL is ready on ${host}:${port}.`); process.exit(0); }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.error(`Timed out waiting for PostgreSQL on ${host}:${port}. Check Docker Desktop and run npm run db:local:logs.`);
process.exit(1);
