import assert from 'node:assert/strict';
import { assertDisposableDatabase } from './lib/disposable-db-safety.mjs';

const valid = { NODE_ENV: 'test', ALLOW_DISPOSABLE_DB_MUTATION: '1', DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-test-phase0', DATABASE_URL: 'postgresql://loning_test:secret@127.0.0.1:55432/loning_phase0_test' };
assert.deepEqual(assertDisposableDatabase(valid), { project: valid.DISPOSABLE_COMPOSE_PROJECT, host: '127.0.0.1', port: 55432, database: 'loning_phase0_test', redactedUrl: 'postgresql://loning_test:***@127.0.0.1:55432/loning_phase0_test' });
assert.equal(assertDisposableDatabase({ ...valid, DATABASE_URL: 'postgresql://loning_test:secret@[::1]:55433/loning_phase0_e2e', DISPOSABLE_COMPOSE_PROJECT: 'marketplace-loning-e2e-phase0' }).database, 'loning_phase0_e2e');
assert.equal(assertDisposableDatabase({ ...valid, DATABASE_URL: 'postgresql://loning_test:secret@localhost:55432/loning_phase0_test?sslmode=disable' }).host, 'localhost');

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
console.log(`Disposable database safety self-test: passed (${3} valid, ${refused.length} refused)`);