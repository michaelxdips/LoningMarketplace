import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertDisposableDatabase } from './lib/disposable-db-safety.mjs';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const readOptional = (path) => existsSync(resolve(root, path)) ? read(path) : '';
const readJson = (path) => JSON.parse(read(path));
const valid = { NODE_ENV: 'test', ALLOW_DISPOSABLE_DB_MUTATION: '1', DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-test-phase0', DATABASE_URL: 'postgresql://loning_test:secret@127.0.0.1:55432/loning_phase0_test' };
assert.deepEqual(assertDisposableDatabase(valid), { project: valid.DISPOSABLE_COMPOSE_PROJECT, host: '127.0.0.1', port: 55432, database: 'loning_phase0_test', redactedUrl: 'postgresql://loning_test:***@127.0.0.1:55432/loning_phase0_test' });
assert.equal(assertDisposableDatabase({ ...valid, DATABASE_URL: 'postgresql://loning_test:secret@[::1]:55433/loning_phase0_e2e', DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-e2e-phase0' }).database, 'loning_phase0_e2e');
assert.equal(assertDisposableDatabase({ ...valid, DATABASE_URL: 'postgresql://loning_test:secret@127.0.0.1:61234/loning_ephemeral_test' }).port, 61234);

const refused = [
  { label: 'wrong NODE_ENV', patch: { NODE_ENV: 'development' } },
  { label: 'missing mutation flag', patch: { ALLOW_DISPOSABLE_DB_MUTATION: undefined } },
  { label: 'wrong mutation flag', patch: { ALLOW_DISPOSABLE_DB_MUTATION: '0' } },
  { label: 'invalid project', patch: { DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-local' } },
  { label: 'empty project', patch: { DISPOSABLE_COMPOSE_PROJECT: '' } },
  { label: 'malformed URL', patch: { DATABASE_URL: 'not-a-url' } },
  { label: 'wrong protocol', patch: { DATABASE_URL: 'mysql://u:p@127.0.0.1:55432/loning_phase0_test' } },
  { label: 'remote hostname', patch: { DATABASE_URL: 'postgresql://u:p@example.com:55432/loning_phase0_test' } },
  { label: 'unauthorized port', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/loning_phase0_test' } },
  { label: 'development database', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/loning_digital' } },
  { label: 'production-like database', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/loning_prod_test' } },
  { label: 'live-like database', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/live_e2e' } },
  { label: 'missing suffix', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/loning_phase0' } },
  { label: 'managed SSL URL', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/loning_phase0_test?sslmode=require' } },
  { label: 'empty username', patch: { DATABASE_URL: 'postgresql://:p@127.0.0.1:55432/loning_phase0_test' } },
  { label: 'empty password', patch: { DATABASE_URL: 'postgresql://u@127.0.0.1:55432/loning_phase0_test' } },
  { label: 'empty database', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/' } },
  { label: 'encoded slash in database', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/loning%2Fphase0_test' } },
  { label: 'malformed database encoding', patch: { DATABASE_URL: 'postgresql://u:p@127.0.0.1:55432/loning%ZZ_test' } },
];
for (const { label, patch } of refused) assert.throws(() => assertDisposableDatabase({ ...valid, ...patch }), /DISPOSABLE_DB_REFUSED/, label);

const rootPackage = readJson('package.json');
const backendPackage = readJson('backend/package.json');
const runIsolated = read('scripts/run-isolated.mjs');
const integrationWrapper = read('scripts/test-integration-local.mjs');
const determinism = read('scripts/verify-seed-determinism.mjs');
const composeTest = read('compose.test.yaml');
const render = read('render.yaml');
const railway = readOptional('backend/railway.toml');

const activeCommands = [
  ...Object.entries(rootPackage.scripts).map(([name, command]) => [`root:${name}`, command]),
  ...Object.entries(backendPackage.scripts).filter(([name]) => name !== 'db:seed').map(([name, command]) => [`backend:${name}`, command]),
];
for (const [name, command] of activeCommands) {
  assert.doesNotMatch(command, /(?:^|\s)(?:npm\s+(?:--prefix\s+\S+\s+)?run\s+db:seed|db:seed\s+--workspace)(?:\s|$)/, `${name} invokes legacy db:seed`);
}
assert.match(backendPackage.scripts['db:seed'], /process\.exit\(1\)/, 'legacy seed alias must hard-fail');
assert.equal(rootPackage.scripts['test:integration'], 'npm run test:integration:isolated');
assert.match(rootPackage.scripts['test:all'], /test:e2e:zoom-native:isolated/);
assert.match(rootPackage.scripts['test:all'], /test:migration:existing:isolated/);

for (const [name, source] of [['run-isolated', runIsolated], ['seed-determinism', determinism]]) {
  assert.doesNotMatch(source, /['"]db:seed['"]/, `${name} contains an active legacy runner argument`);
  assert.match(source, /['"]db:seed:test['"]/);
  assert.match(source, /const seedEnv = \{ \.\.\.env, ALLOW_SEED: '1' \}/);
  assert.match(source, /\{ env: seedEnv \}/);
  assert.match(source, /APP_ENV: 'test'/);
  assert.match(source, /DATABASE_ENVIRONMENT: 'test'/);
  assert.match(source, /SEED_PROFILE: 'test'/);
  assert.match(source, /'AWS_ACCESS_KEY_ID'/);
  assert.match(source, /finally/);
  assert.doesNotMatch(source, /compose\.yaml/);
  assert.doesNotMatch(source, /loning_digital/);
}
assert.match(runIsolated, /findAvailablePorts\(5\)/);
assert.match(determinism, /SEED_CLEAN_REPEATABILITY/);
assert.match(determinism, /SEED_SAME_TARGET_IDEMPOTENCY/);
assert.match(determinism, /findAvailablePorts\(3\)/);
assert.match(integrationWrapper, /\[harness, 'integration', \.\.\.process\.argv\.slice\(2\)\]/);
assert.match(integrationWrapper, /stdio: 'inherit'/);
assert.match(integrationWrapper, /result\.signal/);
assert.match(integrationWrapper, /result\.status \?\? 1/);
assert.doesNotMatch(integrationWrapper, /compose\.yaml|db:local|loning_digital|db:seed/);
assert.match(composeTest, /\$\{DISPOSABLE_DB_PORT\}:5432/);
assert.match(composeTest, /\$\{DISPOSABLE_MINIO_PORT\}:9000/);
assert.match(composeTest, /\$\{DISPOSABLE_MINIO_CONSOLE_PORT\}:9001/);
assert.doesNotMatch(composeTest, /DISPOSABLE_(?:DB|MINIO|MINIO_CONSOLE)_PORT:-/);
assert.doesNotMatch(render, /startCommand:.*(?:db:seed|db:bootstrap-admin|admin:create)/);
assert.doesNotMatch(railway, /(?:db:seed|db:bootstrap-admin|admin:create)/);

console.log(`Disposable harness safety self-test: passed (${3} baseline + ephemeral valid, ${refused.length} refused, executable contracts verified)`);