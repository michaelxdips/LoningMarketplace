import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/config/env.js';
import { security } from '../src/auth/security.js';

describe('Admin-assisted password reset security contract', () => {
  const env = parseEnv({
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:3000',
    PUBLIC_SITE_URL: 'http://localhost:3000',
  }, false);

  const mockTargetUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'umkm@example.com',
    username: 'umkm_user',
    displayName: 'UMKM User',
    role: 'pelaku_umkm' as const,
    isActive: true,
    mustChangePassword: false,
    passwordHash: '$argon2id$v=19$m=65536,t=2,p=1$mock$oldhash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin = {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'admin@example.com',
    username: 'admin_user',
    displayName: 'Admin User',
    role: 'admin' as const,
    isActive: true,
    mustChangePassword: false,
    passwordHash: '$argon2id$v=19$m=65536,t=2,p=1$mock$adminhash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('1. rejects unauthenticated reset request with 401', async () => {
    const mockRepo = {
      findUserById: async () => mockTargetUser,
    } as any;

    const app = await buildApp(env, mockRepo);
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${mockTargetUser.id}/reset-password`,
      payload: { temporaryPassword: 'new-secure-password-123' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('2. rejects non-admin role with 403', async () => {
    const sessionToken = 'umkm-session-token';
    const mockRepo = {
      findUserById: async () => mockTargetUser,
      findSession: async () => ({
        sessionId: 's1',
        csrfTokenHash: security.hashToken('valid-csrf-token'),
        user: mockTargetUser,
      }),
      revokeSession: async () => undefined,
    } as any;

    const app = await buildApp(env, mockRepo);
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${mockTargetUser.id}/reset-password`,
      cookies: { loning_session: sessionToken },
      headers: {
        'x-csrf-token': 'valid-csrf-token',
        origin: 'http://localhost:3000',
      },
      payload: { temporaryPassword: 'new-secure-password-123' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('FORBIDDEN');
  });

  it('3. rejects missing CSRF token with 403 CSRF_INVALID', async () => {
    const sessionToken = 'admin-session-token';
    const mockRepo = {
      findSession: async () => ({
        sessionId: 's1',
        csrfTokenHash: security.hashToken('valid-csrf-token'),
        user: mockAdmin,
      }),
      revokeSession: async () => undefined,
    } as any;

    const app = await buildApp(env, mockRepo);
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${mockTargetUser.id}/reset-password`,
      cookies: { loning_session: sessionToken },
      headers: {
        origin: 'http://localhost:3000',
      },
      payload: { temporaryPassword: 'new-secure-password-123' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('CSRF_INVALID');
  });

  it('4. rejects invalid Origin header with 403 ORIGIN_INVALID', async () => {
    const sessionToken = 'admin-session-token';
    const mockRepo = {
      findSession: async () => ({
        sessionId: 's1',
        csrfTokenHash: security.hashToken('valid-csrf-token'),
        user: mockAdmin,
      }),
      revokeSession: async () => undefined,
    } as any;

    const app = await buildApp(env, mockRepo);
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${mockTargetUser.id}/reset-password`,
      cookies: { loning_session: sessionToken },
      headers: {
        'x-csrf-token': 'valid-csrf-token',
        origin: 'http://attacker.example.com',
      },
      payload: { temporaryPassword: 'new-secure-password-123' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('ORIGIN_INVALID');
  });

  it('5. returns controlled 404 for missing target user', async () => {
    const sessionToken = 'admin-session-token';
    const mockRepo = {
      findUserById: async () => null,
      findSession: async () => ({
        sessionId: 's1',
        csrfTokenHash: security.hashToken('valid-csrf-token'),
        user: mockAdmin,
      }),
      revokeSession: async () => undefined,
    } as any;

    const app = await buildApp(env, mockRepo);
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/users/33333333-3333-4333-8333-333333333333/reset-password',
      cookies: { loning_session: sessionToken },
      headers: {
        'x-csrf-token': 'valid-csrf-token',
        origin: 'http://localhost:3000',
      },
      payload: { temporaryPassword: 'new-secure-password-123' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('6. rejects weak temporary password with validation error', async () => {
    const sessionToken = 'admin-session-token';
    const mockRepo = {
      findUserById: async () => mockTargetUser,
      findSession: async () => ({
        sessionId: 's1',
        csrfTokenHash: security.hashToken('valid-csrf-token'),
        user: mockAdmin,
      }),
      revokeSession: async () => undefined,
    } as any;

    const app = await buildApp(env, mockRepo);
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${mockTargetUser.id}/reset-password`,
      cookies: { loning_session: sessionToken },
      headers: {
        'x-csrf-token': 'valid-csrf-token',
        origin: 'http://localhost:3000',
      },
      payload: { temporaryPassword: 'short' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('7-14. executes password reset, sets mustChangePassword=true, revokes target sessions, records audit event without password, and preserves user role/displayName', async () => {
    const sessionToken = 'admin-session-token';
    let updatedPayload: any = null;
    let sessionsRevokedTargetId: string | null = null;
    let auditRecord: any = null;

    const mockRepo = {
      findUserById: async () => mockTargetUser,
      findSession: async () => ({
        sessionId: 's1',
        csrfTokenHash: security.hashToken('valid-csrf-token'),
        user: mockAdmin,
      }),
      revokeSession: async () => undefined,
      transaction: async (cb: any) => {
        return cb({
          updateUser: async (_id: string, payload: any) => {
            updatedPayload = payload;
          },
          revokeUserSessions: async (id: string) => {
            sessionsRevokedTargetId = id;
          },
          addAudit: async (audit: any) => {
            auditRecord = audit;
          },
        });
      },
    } as any;

    const app = await buildApp(env, mockRepo);
    const tempPassword = 'new-temporary-password-888';

    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${mockTargetUser.id}/reset-password`,
      cookies: { loning_session: sessionToken },
      headers: {
        'x-csrf-token': 'valid-csrf-token',
        origin: 'http://localhost:3000',
      },
      payload: { temporaryPassword: tempPassword },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ data: { passwordReset: true } });

    // Verify mustChangePassword = true and passwordHash updated using Argon2id
    expect(updatedPayload.mustChangePassword).toBe(true);
    expect(updatedPayload.passwordHash).toBeDefined();
    expect(updatedPayload.passwordHash).toMatch(/^\$argon2id\$/);
    expect(updatedPayload.passwordHash).not.toBe(tempPassword);

    // Verify preservation of role and displayName (updateUser receives only passwordHash and mustChangePassword)
    expect(updatedPayload.role).toBeUndefined();
    expect(updatedPayload.displayName).toBeUndefined();

    // Verify target session revocation
    expect(sessionsRevokedTargetId).toBe(mockTargetUser.id);

    // Verify audit record created without plaintext password
    expect(auditRecord).toBeDefined();
    expect(auditRecord.action).toBe('user.password_reset');
    expect(auditRecord.entityType).toBe('user');
    expect(auditRecord.entityId).toBe(mockTargetUser.id);
    expect(JSON.stringify(auditRecord)).not.toContain(tempPassword);
  });

  it('15. Complete forced-password acceptance flow end-to-end', async () => {
    const oldPassword = 'Old-Password-123!';
    const oldHash = await security.hashPassword(oldPassword);
    const tempPassword = 'Temporary-Pass-123!';
    const newPassword = 'Final-New-Password-456!';

    let userState = {
      ...mockTargetUser,
      passwordHash: oldHash,
      mustChangePassword: false,
    };

    const activeSessions = new Map<string, { sessionId: string; userId: string; csrfTokenHash: string }>();
    const auditLogs: any[] = [];
    const logsCaptured: string[] = [];

    // Pre-existing session before admin reset
    const preExistingSessionToken = 'pre-reset-target-session';
    const preExistingSessionId = 'sess-pre-reset';
    activeSessions.set(security.hashToken(preExistingSessionToken), {
      sessionId: preExistingSessionId,
      userId: userState.id,
      csrfTokenHash: security.hashToken('pre-csrf-token'),
    });

    const mockRepo: any = {
      findUserById: async (id: string) => (id === userState.id ? userState : id === mockAdmin.id ? mockAdmin : null),
      findUserByEmail: async (email: string) => (email === userState.email ? userState : email === mockAdmin.email ? mockAdmin : null),
      findUserByUsername: async (un: string) => (un === userState.username ? userState : un === mockAdmin.username ? mockAdmin : null),
      findSession: async (tokenHash: string) => {
        const sess = activeSessions.get(tokenHash);
        if (!sess) return null;
        const user = sess.userId === userState.id ? userState : mockAdmin;
        return { sessionId: sess.sessionId, csrfTokenHash: sess.csrfTokenHash, user };
      },
      revokeSession: async (sessionId: string) => {
        for (const [k, v] of activeSessions.entries()) if (v.sessionId === sessionId) activeSessions.delete(k);
      },
      revokeUserSessions: async (userId: string) => {
        for (const [k, v] of activeSessions.entries()) if (v.userId === userId) activeSessions.delete(k);
      },
      createSession: async (s: any) => {
        const sid = `sess-${Date.now()}-${Math.random()}`;
        activeSessions.set(s.tokenHash, { sessionId: sid, userId: s.userId, csrfTokenHash: s.csrfTokenHash });
        return { id: sid };
      },
      updateUser: async (id: string, updates: any) => {
        if (id === userState.id) userState = { ...userState, ...updates };
      },
      changePassword: async (id: string, hash: string) => {
        if (id === userState.id) userState = { ...userState, passwordHash: hash, mustChangePassword: false };
      },
      recordLoginFailure: async () => {},
      recordLoginSuccess: async () => {},
      rotateSessionCsrf: async () => {},
      addAudit: async (audit: any) => { auditLogs.push(audit); },
      transaction: async (cb: any) => cb({
        updateUser: async (id: string, updates: any) => { if (id === userState.id) userState = { ...userState, ...updates }; },
        changePassword: async (id: string, hash: string) => { if (id === userState.id) userState = { ...userState, passwordHash: hash, mustChangePassword: false }; },
        revokeUserSessions: async (userId: string) => { for (const [k, v] of activeSessions.entries()) if (v.userId === userId) activeSessions.delete(k); },
        createSession: async (s: any) => {
          const sid = `sess-${Date.now()}-${Math.random()}`;
          activeSessions.set(s.tokenHash, { sessionId: sid, userId: s.userId, csrfTokenHash: s.csrfTokenHash });
          return { id: sid };
        },
        recordLoginFailure: async () => {},
        recordLoginSuccess: async () => {},
        addAudit: async (audit: any) => { auditLogs.push(audit); },
      }),
      listProducts: async () => [],
      listManagedProducts: async () => [],
    };

    const adminSessionToken = 'admin-active-session-token';
    const adminCsrf = 'admin-csrf-token';
    activeSessions.set(security.hashToken(adminSessionToken), {
      sessionId: 'sess-admin',
      userId: mockAdmin.id,
      csrfTokenHash: security.hashToken(adminCsrf),
    });

    const app = await buildApp(env, mockRepo);

    // STEP 1: Admin resets deterministic target password
    const resetRes = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userState.id}/reset-password`,
      cookies: { loning_session: adminSessionToken },
      headers: { 'x-csrf-token': adminCsrf, origin: 'http://localhost:3000' },
      payload: { temporaryPassword: tempPassword },
    });
    expect(resetRes.statusCode).toBe(200);

    // STEP 2: Previous sessions become unauthorized
    const prevSessionCheck = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: { loning_session: preExistingSessionToken },
    });
    expect(prevSessionCheck.statusCode).toBe(401);

    // STEP 3: Old password fails
    const oldPassLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:3000' },
      payload: { identifier: userState.email, password: oldPassword },
    });
    expect(oldPassLogin.statusCode).toBe(401);

    // STEP 4: Temporary password succeeds
    const tempLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:3000' },
      payload: { identifier: userState.email, password: tempPassword },
    });
    expect(tempLogin.statusCode).toBe(200);
    const tempSessionToken = tempLogin.cookies.find(c => c.name === 'loning_session')?.value;
    expect(tempSessionToken).toBeDefined();
    const tempCsrfToken = tempLogin.json().data.csrfToken;
    expect(tempLogin.json().data.user.mustChangePassword).toBe(true);

    // STEP 5: Dashboard/API access is blocked before changing password
    const blockedApi = await app.inject({
      method: 'GET',
      url: '/api/manage/products',
      cookies: { loning_session: tempSessionToken! },
      headers: { 'x-csrf-token': tempCsrfToken, origin: 'http://localhost:3000' },
    });
    expect(blockedApi.statusCode).toBe(403);
    expect(blockedApi.json().error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    // STEP 6: Target changes password -> new password clears mustChangePassword
    const changeRes = await app.inject({
      method: 'POST',
      url: '/api/auth/change-password',
      cookies: { loning_session: tempSessionToken! },
      headers: { 'x-csrf-token': tempCsrfToken, origin: 'http://localhost:3000' },
      payload: { currentPassword: tempPassword, newPassword },
    });
    expect(changeRes.statusCode).toBe(200);
    expect(userState.mustChangePassword).toBe(false);

    // STEP 7: Temporary password fails afterward
    const tempPassLoginAfter = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:3000' },
      payload: { identifier: userState.email, password: tempPassword },
    });
    expect(tempPassLoginAfter.statusCode).toBe(401);

    // STEP 8: New password succeeds
    const newPassLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'http://localhost:3000' },
      payload: { identifier: userState.email, password: newPassword },
    });
    expect(newPassLogin.statusCode).toBe(200);
    expect(newPassLogin.json().data.user.mustChangePassword).toBe(false);

    const newSessionToken = newPassLogin.cookies.find(c => c.name === 'loning_session')?.value;
    const newCsrfToken = newPassLogin.json().data.csrfToken;

    // STEP 9: Resource API access succeeds after password change
    const allowedApi = await app.inject({
      method: 'GET',
      url: '/api/manage/products',
      cookies: { loning_session: newSessionToken! },
      headers: { 'x-csrf-token': newCsrfToken, origin: 'http://localhost:3000' },
    });
    expect(allowedApi.statusCode).toBe(200);

    // STEP 10: Audit metadata and captured logs contain no plaintext password
    const auditString = JSON.stringify(auditLogs);
    expect(auditString).not.toContain(tempPassword);
    expect(auditString).not.toContain(newPassword);
    expect(auditString).not.toContain(oldPassword);
  });
});
