import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { CAPABILITIES, hasCapability, type UserRole } from '../src/auth/policy.js';
import type { Security } from '../src/auth/security.js';
import type { AppEnv } from '../src/config/env.js';
import type { Repository, SessionUser } from '../src/db/repository.js';

const env: AppEnv = { DATABASE_URL: '', PORT: 3001, HOST: 'localhost', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'test', SESSION_TTL_HOURS: 2, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCKOUT_MINUTES: 10, LOGIN_RATE_LIMIT_MAX: 100, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false };
const now = new Date('2026-07-30T00:00:00.000Z');
const roles = ['admin', 'pelaku_umkm', 'superadmin', 'perangkat_desa', 'unknown'] as const;
const supported = new Set(['admin', 'pelaku_umkm']);
const crypto: Security = {
  hashPassword: async (value) => `hash-password:${value}`,
  verifyPassword: async (hash, value) => hash === `hash-password:${value}`,
  token: () => 'raw-token',
  hashToken: (value) => `hash:${value}`,
};

function fixture(role: typeof roles[number]) {
  const user = { id: '00000000-0000-4000-8000-000000000001', username: role, email: `${role}@example.test`, displayName: role, role, isActive: true, mustChangePassword: false, passwordHash: 'hash-password:correct-password', failedLoginCount: 0, lockedUntil: null } as unknown as SessionUser & { email: string; passwordHash: string; failedLoginCount: number; lockedUntil: Date | null };
  let revoked = 0;
  let created = 0;
  const repository = {
    findUserByEmail: async (email: string) => email === user.email ? user : undefined,
    findUserByUsername: async (username: string) => username === user.username ? user : undefined,
    findSession: async () => ({ sessionId: '00000000-0000-4000-8000-000000000002', csrfTokenHash: 'hash:csrf', user }),
    createSession: async () => { created += 1; return { id: '00000000-0000-4000-8000-000000000002' }; },
    rotateSessionCsrf: async () => {},
    revokeSession: async () => { revoked += 1; },
    revokeUserSessions: async () => { revoked += 1; },
    recordLoginFailure: async () => {},
    recordLoginSuccess: async () => {},
    addAudit: async () => {},
    transaction: async (operation: (tx: Repository) => Promise<unknown>) => operation(repository as unknown as Repository),
  } as unknown as Repository;
  return { repository, get revoked() { return revoked; }, get created() { return created; } };
}

describe('reserved role policy', () => {
  it.each(roles)('enforces the login contract for %s', async (role) => {
    const state = fixture(role);
    const app = await buildApp(env, state.repository, { security: crypto, now: () => now });
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: env.CORS_ORIGIN }, payload: { identifier: `${role}@example.test`, password: 'correct-password' } });
    if (supported.has(role)) {
      expect(response.statusCode).toBe(200);
      expect(state.created).toBe(1);
    } else {
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: { message: 'Email/username atau kata sandi salah.', code: 'INVALID_CREDENTIALS' } });
      expect(state.created).toBe(0);
    }
    await app.close();
  });

  it.each(roles)('enforces the existing-session contract for %s', async (role) => {
    const state = fixture(role);
    const app = await buildApp(env, state.repository, { security: crypto, now: () => now });
    const response = await app.inject({ url: '/api/auth/session', headers: { cookie: `loning_session=${role}` } });
    if (supported.has(role)) {
      expect(response.statusCode).toBe(200);
      expect(state.revoked).toBe(0);
    } else {
      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe('ROLE_INVALID');
      expect(response.headers['set-cookie']).toContain('loning_session=;');
      expect(state.revoked).toBe(1);
    }
    await app.close();
  });

  it.each(['superadmin', 'perangkat_desa'] as const)('assigns zero capabilities to %s', (role) => {
    expect(CAPABILITIES.every((capability) => !hasCapability(role, capability))).toBe(true);
  });

  it.each(['superadmin', 'perangkat_desa'] as const)('rejects admin assignment of %s', async (role) => {
    const state = fixture('admin');
    const app = await buildApp(env, state.repository, { security: crypto, now: () => now });
    const response = await app.inject({ method: 'POST', url: '/api/admin/users', headers: { cookie: 'loning_session=admin', origin: env.CORS_ORIGIN, 'x-csrf-token': 'csrf' }, payload: { email: 'new@example.test', username: 'new-user', displayName: 'New User', temporaryPassword: 'temporary-password', role } });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
    await app.close();
  });

  it('keeps unknown roles outside the typed capability policy', () => {
    expect(hasCapability('unknown' as UserRole, 'accessDashboard')).toBe(false);
  });
});
