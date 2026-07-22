import { describe, expect, it } from 'vitest';
import {
  LOCAL_COMPOSE_FILE,
  LOCAL_COMPOSE_PROJECT,
  RESETTABLE_APPLICATION_TABLES,
  type ResetSafetyInput,
  validateResetSafety,
} from '../src/scripts/db-reset-guard.js';

const safeInput: ResetSafetyInput = {
  nodeEnv: 'test',
  force: true,
  databaseUrl: 'postgresql://user:pass@localhost:5432/test_db',
  affectedTables: RESETTABLE_APPLICATION_TABLES,
  composeProject: LOCAL_COMPOSE_PROJECT,
  composeFile: LOCAL_COMPOSE_FILE,
};

function refused(overrides: Partial<ResetSafetyInput>) {
  expect(validateResetSafety({ ...safeInput, ...overrides }).safe).toBe(false);
}

describe('database reset safety guard', () => {
  it.each([
    ['NODE_ENV unset', { nodeEnv: undefined }],
    ['empty environment', { nodeEnv: '' }],
    ['production', { nodeEnv: 'production' }],
    ['staging', { nodeEnv: 'staging' }],
    ['typo environment', { nodeEnv: 'developmnt' }],
    ['allowed environment without force', { force: false }],
    ['missing database URL', { databaseUrl: undefined }],
    ['empty database URL', { databaseUrl: '' }],
    ['malformed database URL', { databaseUrl: 'not-a-url' }],
    ['non-PostgreSQL URL', { databaseUrl: 'https://localhost/test_db' }],
    ['unknown remote host', { databaseUrl: 'postgresql://user:pass@example.com/test_db' }],
    ['production database name', { databaseUrl: 'postgresql://user:pass@localhost/production_db' }],
    ['staging project reference', { databaseUrl: 'postgresql://user:pass@db.staging.supabase.co/test_db', allowedTestProjectRefs: ['staging'] }],
    ['empty affected scope', { affectedTables: [] }],
    ['unknown affected table', { affectedTables: ['products', 'auth.users'] }],
    ['missing Compose project', { composeProject: undefined }],
    ['wrong Compose project', { composeProject: 'another-project' }],
    ['missing Compose file', { composeFile: undefined }],
    ['wrong Compose file', { composeFile: 'other.yaml' }],
  ] as const)('refuses %s', (_name, overrides) => refused(overrides));

  it('allows local host with allowed environment, force, and explicit scope', () => {
    expect(validateResetSafety(safeInput)).toMatchObject({ safe: true, target: 'local' });
  });

  it('allows an explicitly allowlisted remote test project with force', () => {
    expect(validateResetSafety({
      ...safeInput,
      databaseUrl: 'postgresql://user:pass@db.loning-test.supabase.co/test_db',
      allowedTestProjectRefs: ['loning-test'],
    })).toMatchObject({ safe: true, target: 'allowlisted-test-project' });
  });
});

