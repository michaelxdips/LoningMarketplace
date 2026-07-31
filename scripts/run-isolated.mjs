import { rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertDisposableDatabase } from './lib/disposable-db-safety.mjs';

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required for shell-free npm execution');
const mode = process.argv[2];
if (!['integration', 'e2e', 'full', 'migration', 'zoom-native'].includes(mode)) throw new Error('Usage: node scripts/run-isolated.mjs integration|e2e|full|migration|zoom-native [Playwright args]');
const project = mode === 'e2e' || mode === 'zoom-native' ? 'marketplace-loning-e2e-phase0' : mode === 'migration' ? 'marketplace-loning-test-migration-v12' : 'marketplace-loning-test-phase0';
const database = mode === 'e2e' || mode === 'zoom-native' ? 'loning_phase0_e2e' : mode === 'migration' ? 'loning_v12_migration_test' : 'loning_phase0_test';
const port = mode === 'e2e' || mode === 'zoom-native' ? '55433' : '55432';
const artifactRoot = resolve(root, '.phase0-runtime', mode);
const artifactMediaRoot = resolve(artifactRoot, 'media');
const frontendOrigin = 'http://localhost:3100';
const backendOrigin = 'http://localhost:3101';
const env = {
  ...process.env,
  NODE_ENV: 'test',
  ALLOW_DISPOSABLE_DB_MUTATION: '1',
  DISPOSABLE_COMPOSE_PROJECT: project,
  DISPOSABLE_DB_PORT: port,
  DISPOSABLE_DB_NAME: database,
  DATABASE_URL: `postgresql://loning_test:loning_disposable_only@127.0.0.1:${port}/${database}`,
  COOKIE_SECURE: 'false',
  PORT: '3101',
  CORS_ORIGIN: frontendOrigin,
  MEDIA_STORAGE_DRIVER: 'filesystem',
  MEDIA_FILESYSTEM_ROOT: artifactMediaRoot,
  MEDIA_PUBLIC_BASE_URL: `${backendOrigin}/media`,
  RATE_LIMIT_MAX: '10000',
  LOGIN_RATE_LIMIT_MAX: '1000',
  VITE_API_URL: `${backendOrigin}/api`,
  VITE_PUBLIC_SITE_URL: frontendOrigin,
  E2E_API_BASE_URL: `${backendOrigin}/api`,
  E2E_BASE_URL: frontendOrigin,
  E2E_FRONTEND_ORIGIN: frontendOrigin,
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
    try { const response = await fetch(`${backendOrigin}/api/ready`); if (response.ok) return; } catch {}
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
  try { await waitForBackend(); run(process.execPath, ['scripts/integration-smoke.mjs'], { env: { ...env, API_BASE_URL: `${backendOrigin}/api`, FRONTEND_ORIGIN: frontendOrigin } }); }
  finally { stop(backend); }
}
function psql(statement) {
  docker(['exec', '-T', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'loning_test', '-d', database, '-c', statement]);
}
function expectMigrationFailure(message) {
  const result = spawnSync(process.execPath, [npmCli, '--prefix', 'backend', 'run', 'db:migrate'], { cwd: root, env, encoding: 'utf8', shell: false, windowsHide: true });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status === 0 || !output.includes(message)) throw new Error(`Expected migration failure containing "${message}", received exit ${result.status}\n${output}`);
  console.log(`EXPECTED_MIGRATION_REFUSAL: ${message}`);
}
function rewindFinalIntegrity({ dropPhoneConstraints = false } = {}) {
  psql(`
    DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1785380400000;
    DROP INDEX IF EXISTS products_slug_unique;
    DROP INDEX IF EXISTS umkms_slug_unique;
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_nonempty_check;
    ALTER TABLE umkms DROP CONSTRAINT IF EXISTS umkms_slug_nonempty_check;
    ALTER TABLE products ALTER COLUMN slug DROP NOT NULL;
    ALTER TABLE umkms ALTER COLUMN slug DROP NOT NULL;
    ${dropPhoneConstraints ? 'ALTER TABLE umkms DROP CONSTRAINT IF EXISTS umkms_phone_normalized_check; ALTER TABLE umkms DROP CONSTRAINT IF EXISTS umkms_published_phone_ready_check;' : ''}
  `);
}
function existingDataMigration() {
  console.log('Scenario: clean database');
  npm(['--prefix', 'backend', 'run', 'db:migrate']);
  npm(['--prefix', 'backend', 'run', 'db:audit']);

  rewindFinalIntegrity();
  console.log('Scenario: null and empty slugs');
  console.log('Scenario: Unicode and collision fallback');
  psql(`
    INSERT INTO umkms (id, name, slug, owner, description, phone, category, image_url, address, publication_status, published_at, created_at)
    VALUES
      ('f2000000-0000-4000-8000-000000000001', 'Dapur Bu Sri', NULL, 'Sri', 'Legacy migration fixture', '628123456789', 'Kuliner', 'https://example.test/umkm-1.png', 'Loning', 'published', now(), '2025-01-01T00:00:00Z'),
      ('f2000000-0000-4000-8000-000000000002', 'Dapur-Bu Sri', '   ', 'Sri Dua', 'Collision migration fixture', '628123456788', 'Kuliner', 'https://example.test/umkm-2.png', 'Loning', 'published', now(), '2025-01-02T00:00:00Z'),
      ('f2000000-0000-4000-8000-000000000003', '商店 🛍️', '', 'Unicode', 'Fallback migration fixture', '628123456787', 'Kuliner', 'https://example.test/umkm-3.png', 'Loning', 'draft', NULL, '2025-01-03T00:00:00Z'),
      ('f2000000-0000-4000-8000-000000000004', 'Canonical', 'canonical-kept', 'Canonical', 'Preserved migration fixture', '628123456786', 'Kuliner', 'https://example.test/umkm-4.png', 'Loning', 'draft', NULL, '2025-01-04T00:00:00Z');
    INSERT INTO products (id, umkm_id, name, slug, price, description, category, image_url, publication_status, published_at, created_at)
    VALUES
      ('f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Keripik Pisang Cokelat', NULL, 12000, 'Legacy migration fixture', 'Kuliner', 'https://example.test/product-1.png', 'published', now(), '2025-01-01T00:00:00Z'),
      ('f3000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000002', 'Keripik-Pisang Cokelat', ' ', 13000, 'Collision migration fixture', 'Kuliner', 'https://example.test/product-2.png', 'published', now(), '2025-01-02T00:00:00Z'),
      ('f3000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000003', '🎁 商品', '', 14000, 'Fallback migration fixture', 'Kuliner', 'https://example.test/product-3.png', 'draft', NULL, '2025-01-03T00:00:00Z'),
      ('f3000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000004', 'Canonical', 'canonical-product-kept', 15000, 'Preserved migration fixture', 'Kuliner', 'https://example.test/product-4.png', 'draft', NULL, '2025-01-04T00:00:00Z');
  `);

  console.log('Scenario: failure after committed preparation');
  psql('CREATE INDEX products_slug_unique ON products (slug)');
  expectMigrationFailure('Final slug unique index assertion failed');
  console.log('Assertion: preparation persists after migration failure');
  console.log('Assertion: migration 0008 remains unrecorded after failure');
  psql(`
    DO $check$
    DECLARE umkm_slugs text[]; product_slugs text[];
    BEGIN
      SELECT array_agg(slug ORDER BY id) INTO umkm_slugs FROM umkms WHERE id::text LIKE 'f2000000-%';
      IF umkm_slugs <> ARRAY['dapur-bu-sri','dapur-bu-sri-2','umkm','canonical-kept'] THEN RAISE EXCEPTION 'Preparation did not persist UMKM slugs: %', umkm_slugs; END IF;
      SELECT array_agg(slug ORDER BY id) INTO product_slugs FROM products WHERE id::text LIKE 'f3000000-%';
      IF product_slugs <> ARRAY['keripik-pisang-cokelat','keripik-pisang-cokelat-2','produk','canonical-product-kept'] THEN RAISE EXCEPTION 'Preparation did not persist product slugs: %', product_slugs; END IF;
      IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=1785380400000) THEN RAISE EXCEPTION 'Failed migration 0008 was recorded'; END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('umkms','products') AND column_name='slug' AND is_nullable='NO') THEN RAISE EXCEPTION 'Failed migration left slug NOT NULL applied'; END IF;
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('products_slug_nonempty_check','umkms_slug_nonempty_check')) THEN RAISE EXCEPTION 'Failed migration left slug constraints applied'; END IF;
      IF EXISTS (SELECT 1 FROM pg_class i JOIN pg_index x ON x.indexrelid=i.oid WHERE i.relname='products_slug_unique' AND x.indisunique) THEN RAISE EXCEPTION 'Failure injection index unexpectedly became unique'; END IF;
      IF EXISTS (SELECT 1 FROM pg_class WHERE relname='umkms_slug_unique') THEN RAISE EXCEPTION 'Failed migration left UMKM unique index applied'; END IF;
    END $check$;
    DROP INDEX products_slug_unique;
  `);
  npm(['--prefix', 'backend', 'run', 'db:migrate']);
  console.log('Assertion: recovery rerun preserves canonical slugs');
  const expected = `
    DO $check$
    DECLARE actual text[];
    BEGIN
      SELECT array_agg(slug ORDER BY id) INTO actual FROM umkms WHERE id::text LIKE 'f2000000-%';
      IF actual <> ARRAY['dapur-bu-sri','dapur-bu-sri-2','umkm','canonical-kept'] THEN RAISE EXCEPTION 'Unexpected UMKM slugs: %', actual; END IF;
      SELECT array_agg(slug ORDER BY id) INTO actual FROM products WHERE id::text LIKE 'f3000000-%';
      IF actual <> ARRAY['keripik-pisang-cokelat','keripik-pisang-cokelat-2','produk','canonical-product-kept'] THEN RAISE EXCEPTION 'Unexpected product slugs: %', actual; END IF;
      IF EXISTS (SELECT 1 FROM products WHERE char_length(slug) > 96) OR EXISTS (SELECT 1 FROM umkms WHERE char_length(slug) > 96) THEN RAISE EXCEPTION 'Oversized slug'; END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('umkms','products') AND column_name='slug' AND (is_nullable <> 'NO' OR character_maximum_length <> 96)) THEN RAISE EXCEPTION 'Invalid slug column contract'; END IF;
      IF (SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('umkms_slug_unique','products_slug_unique')) <> 2 THEN RAISE EXCEPTION 'Missing slug unique indexes'; END IF;
      IF (SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relname='umkms' AND c.conname IN ('umkms_phone_normalized_check','umkms_published_phone_ready_check') AND c.convalidated) <> 2 THEN RAISE EXCEPTION 'WhatsApp constraints are not validated'; END IF;
      IF (SELECT count(*) FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public' AND tc.table_name IN ('umkms','products') AND kcu.column_name='id') <> 2 THEN RAISE EXCEPTION 'UUID id primary keys not retained'; END IF;
      IF (SELECT count(*) FROM drizzle.__drizzle_migrations WHERE created_at=1785380400000) <> 1 THEN RAISE EXCEPTION 'Migration 0008 ledger count is not one'; END IF;
    END $check$;
  `;
  psql(expected);
  console.log('Scenario: idempotent rerun');
  npm(['--prefix', 'backend', 'run', 'db:migrate']);
  psql(expected);

  console.log('Scenario: duplicate product slug refusal');
  rewindFinalIntegrity();
  psql(`UPDATE products SET slug = 'duplicate-product' WHERE id IN ('f3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000002')`);
  expectMigrationFailure('Duplicate product slugs detected');
  psql(`DO $check$ BEGIN IF (SELECT count(*) FROM products WHERE slug='duplicate-product') <> 2 THEN RAISE EXCEPTION 'Duplicate product rows changed after refusal'; END IF; IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=1785380400000) THEN RAISE EXCEPTION 'Failed product migration was recorded'; END IF; END $check$; UPDATE products SET slug='duplicate-product-2' WHERE id='f3000000-0000-4000-8000-000000000002';`);
  npm(['--prefix', 'backend', 'run', 'db:migrate']);

  console.log('Scenario: duplicate UMKM slug refusal');
  rewindFinalIntegrity();
  psql(`UPDATE umkms SET slug = 'duplicate-umkm' WHERE id IN ('f2000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002')`);
  expectMigrationFailure('Duplicate UMKM slugs detected');
  psql(`DO $check$ BEGIN IF (SELECT count(*) FROM umkms WHERE slug='duplicate-umkm') <> 2 THEN RAISE EXCEPTION 'Duplicate UMKM rows changed after refusal'; END IF; IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=1785380400000) THEN RAISE EXCEPTION 'Failed UMKM migration was recorded'; END IF; END $check$; UPDATE umkms SET slug='duplicate-umkm-2' WHERE id='f2000000-0000-4000-8000-000000000002';`);
  npm(['--prefix', 'backend', 'run', 'db:migrate']);

  console.log('Scenario: invalid WhatsApp refusal');
  rewindFinalIntegrity({ dropPhoneConstraints: true });
  psql(`UPDATE umkms SET phone='legacy-invalid-contact' WHERE id='f2000000-0000-4000-8000-000000000003'; ALTER TABLE umkms ADD CONSTRAINT umkms_phone_normalized_check CHECK (phone ~ '^628[0-9]{7,12}$') NOT VALID; ALTER TABLE umkms ADD CONSTRAINT umkms_published_phone_ready_check CHECK (publication_status <> 'published' OR phone ~ '^628[0-9]{7,12}$') NOT VALID;`);
  expectMigrationFailure('Invalid WhatsApp contacts detected');
  psql(`DO $check$ BEGIN IF (SELECT phone FROM umkms WHERE id='f2000000-0000-4000-8000-000000000003') <> 'legacy-invalid-contact' THEN RAISE EXCEPTION 'Invalid phone was rewritten after refusal'; END IF; IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=1785380400000) THEN RAISE EXCEPTION 'Failed phone migration was recorded'; END IF; END $check$; UPDATE umkms SET phone='628123456785' WHERE id='f2000000-0000-4000-8000-000000000003';`);
  npm(['--prefix', 'backend', 'run', 'db:migrate']);
  npm(['--prefix', 'backend', 'run', 'db:audit']);
  console.log('EXISTING_DATA_MIGRATION_PASS');
}

let failure;
console.log(`Disposable target: ${target.redactedUrl}; project=${target.project}; port=${target.port}`);
try {
  docker(['up', '-d', '--wait', 'postgres']);
  await waitForPostgres();
  if (mode === 'migration') existingDataMigration();
  else {
    npm(['--prefix', 'backend', 'run', 'db:migrate']);
    npm(['--prefix', 'backend', 'run', 'db:seed']);
    if (mode === 'e2e' || mode === 'full') npm(['--prefix', 'backend', 'run', 'e2e:setup']);
    if (mode === 'zoom-native') npm(['exec', '--', 'playwright', 'test', '--config', 'playwright.zoom-native.config.ts']);
    else if (mode === 'e2e' || mode === 'full') npm(['exec', '--', 'playwright', 'test', ...process.argv.slice(3)]);
    if (mode === 'integration' || mode === 'full') await integration();
    npm(['--prefix', 'backend', 'run', 'db:audit']);
  }
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