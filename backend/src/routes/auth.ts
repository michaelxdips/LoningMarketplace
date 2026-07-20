import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import type { Security } from '../auth/security.js';
import type { Repository } from './repository.js';
import type { ReturnTypeGuards } from './types.js';
import { error } from './validation.js';

const DUMMY_HASH = '$argon2id$v=19$m=19456,p=1,t=2$ygVCLTWvAz9t77qEMFuQCA$ZsKqvYOGJVaA3oaHempHxvkTB/piwZZixkbIlyirDK0';
const password = z.string().min(12).max(128);
const credentials = z.object({ email: z.string().trim().toLowerCase().email(), password });
const info = (request: { ip: string; headers: Record<string, unknown> }) => ({ ipAddress: request.ip, userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined });
export async function authRoutes(app: FastifyInstance, repository: Repository, guards: ReturnTypeGuards, crypto: Security, env: AppEnv, now: () => Date) {
  app.post('/auth/login', { config: { rateLimit: { max: env.LOGIN_RATE_LIMIT_MAX, timeWindow: env.LOGIN_RATE_LIMIT_WINDOW } }, preHandler: [guards.origin] }, async (request, reply) => {
    const parsed = credentials.safeParse(request.body); if (!parsed.success) return reply.code(400).send(error('Invalid login payload', 'VALIDATION_ERROR'));
    const at = now(); const found = await repository.findUserByEmail(parsed.data.email); const verified = await crypto.verifyPassword(found?.passwordHash ?? DUMMY_HASH, parsed.data.password);
    if (!found || !found.isActive || (found.lockedUntil && found.lockedUntil > at) || !verified) {
      await repository.transaction(async (tx) => { if (found && found.isActive && (!found.lockedUntil || found.lockedUntil <= at)) { const count = found.lockedUntil ? 1 : found.failedLoginCount + 1; await tx.recordLoginFailure(found.id, count, count >= env.LOGIN_MAX_ATTEMPTS ? new Date(at.getTime() + env.LOGIN_LOCKOUT_MINUTES * 60_000) : null, at); } await tx.addAudit({ actorUserId: found?.id ?? null, action: 'auth.login_failed', entityType: 'auth', metadata: {}, ...info(request) }); });
      return reply.code(401).send(error('Invalid email or password', 'INVALID_CREDENTIALS'));
    }
    const sessionToken = crypto.token(), csrfToken = crypto.token(), expiresAt = new Date(at.getTime() + env.SESSION_TTL_HOURS * 3_600_000);
    await repository.transaction(async (tx) => { await tx.recordLoginSuccess(found.id, at); const session = await tx.createSession({ userId: found.id, tokenHash: crypto.hashToken(sessionToken), csrfTokenHash: crypto.hashToken(csrfToken), expiresAt, ...info(request) }); await tx.addAudit({ actorUserId: found.id, action: 'auth.login_succeeded', entityType: 'session', entityId: session.id, ...info(request) }); });
    reply.setCookie(env.SESSION_COOKIE_NAME, sessionToken, { path: '/', httpOnly: true, sameSite: 'lax', secure: env.COOKIE_SECURE, expires: expiresAt });
    return { data: { user: { id: found.id, email: found.email, displayName: found.displayName, role: found.role, isActive: found.isActive, mustChangePassword: found.mustChangePassword }, csrfToken, expiresAt: expiresAt.toISOString() } };
  });
  app.get('/auth/session', { preHandler: [guards.authenticate] }, async (request) => { const csrfToken = crypto.token(); await repository.rotateSessionCsrf(request.auth!.sessionId, crypto.hashToken(csrfToken), now()); return { data: { user: request.auth!.user, csrfToken } }; });
  app.post('/auth/logout', { preHandler: guards.secured }, async (request, reply) => { const at = now(); await repository.transaction(async (tx) => { await tx.revokeSession(request.auth!.sessionId, at); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'auth.logout', entityType: 'session', entityId: request.auth!.sessionId, ...info(request) }); }); reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', sameSite: 'lax', secure: env.COOKIE_SECURE }); return { data: { loggedOut: true } }; });
  app.post('/auth/change-password', { preHandler: guards.secured }, async (request, reply) => { const parsed = z.object({ currentPassword: password, newPassword: password }).safeParse(request.body); if (!parsed.success) return reply.code(400).send(error('Invalid password payload', 'VALIDATION_ERROR')); const found = await repository.findUserByEmail(request.auth!.user.email); if (!found || !(await crypto.verifyPassword(found.passwordHash, parsed.data.currentPassword))) return reply.code(400).send(error('Current password is incorrect', 'INVALID_PASSWORD')); if (await crypto.verifyPassword(found.passwordHash, parsed.data.newPassword)) return reply.code(400).send(error('New password must be different', 'PASSWORD_REUSED')); const at = now(), hash = await crypto.hashPassword(parsed.data.newPassword); await repository.transaction(async (tx) => { await tx.changePassword(found.id, hash, at); await tx.revokeUserSessions(found.id, at); await tx.addAudit({ actorUserId: found.id, action: 'auth.password_changed', entityType: 'user', entityId: found.id, ...info(request) }); }); reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', sameSite: 'lax', secure: env.COOKIE_SECURE }); return { data: { passwordChanged: true } }; });
}
