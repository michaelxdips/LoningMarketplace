import { describe, expect, it } from 'vitest';
import { bootstrapSuperadmin, readBootstrapInput } from '../src/scripts/admin-create.js';
import { assertSafeBootstrapTarget, formatDatabaseTarget } from '../src/db/target-safety.js';
import type { Security } from '../src/auth/security.js';
import type { Repository } from '../src/db/repository.js';

const env = {
  NODE_ENV: 'production', APP_ENV: 'production', DATABASE_ENVIRONMENT: 'production', ALLOW_ADMIN_BOOTSTRAP: '1', BOOTSTRAP_CONFIRM: 'CREATE_SUPERADMIN',
  DATABASE_URL: 'postgresql://bootstrap:password@db.example.test:5432/loning_prod',
  BOOTSTRAP_ADMIN_EMAIL: 'superadmin@example.test', BOOTSTRAP_ADMIN_USERNAME: 'superadmin', BOOTSTRAP_ADMIN_PASSWORD: 'strong-password-12', BOOTSTRAP_ADMIN_DISPLAY_NAME: 'Super Admin',
};
const crypto: Security = { hashPassword: async (value) => `hash:${value}`, verifyPassword: async () => false, token: () => 'token', hashToken: (value) => `hash:${value}` };

function state(superadmins = 0) {
  const created: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const repository = {
    countSuperadmins: async () => superadmins,
    findUserByEmail: async () => undefined,
    findUserByUsername: async () => undefined,
    createUser: async (value: Record<string, unknown>) => { created.push(value); return { id: '00000000-0000-4000-8000-000000000001', ...value }; },
    addAudit: async (value: Record<string, unknown>) => { audits.push(value); },
    transaction: async (operation: (tx: Repository) => Promise<unknown>) => operation(repository as unknown as Repository),
  } as unknown as Repository;
  return { repository, created, audits };
}

describe('explicit superadmin bootstrap', () => {
  it('requires complete valid input and a confirmed production target', () => {
    expect(() => readBootstrapInput({ ...env, BOOTSTRAP_ADMIN_PASSWORD: '' })).toThrow('BOOTSTRAP_INPUT_REFUSED');
    expect(() => assertSafeBootstrapTarget({ ...env, APP_ENV: 'development' })).toThrow('BOOTSTRAP_TARGET_REFUSED');
    const target = formatDatabaseTarget(assertSafeBootstrapTarget(env));
    expect(target).toContain('target:');
    expect(target).not.toContain('password');
  });

  it('creates exactly one Super Admin without a session or business data', async () => {
    const fixture = state();
    const created = await bootstrapSuperadmin(fixture.repository, crypto, readBootstrapInput(env), () => new Date('2026-08-04T00:00:00.000Z'));
    expect(created).toMatchObject({ role: 'superadmin', mustChangePassword: true });
    expect(fixture.created).toHaveLength(1);
    expect(fixture.created[0]).toMatchObject({ role: 'superadmin' });
    expect(fixture.audits[0]).toMatchObject({ actorUserId: null, action: 'auth.superadmin_bootstrapped', metadata: { actorType: 'system' } });
  });

  it('refuses when a Super Admin already exists without exposing the password', async () => {
    const fixture = state(1);
    await expect(bootstrapSuperadmin(fixture.repository, crypto, readBootstrapInput(env), () => new Date())).rejects.toThrow('BOOTSTRAP_REFUSED');
    expect(fixture.created).toHaveLength(0);
  });
});
