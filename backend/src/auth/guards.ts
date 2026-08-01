import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppEnv } from '../config/env.js';
import type { Repository, SessionUser } from '../db/repository.js';
import { hasCapability, isSupportedUserRole } from './policy.js';
import { safeEqual, type Security } from './security.js';

export type AuthContext = { user: SessionUser; sessionId: string; csrfTokenHash: string };
declare module 'fastify' { interface FastifyRequest { auth?: AuthContext } }
const fail = (reply: FastifyReply, status: number, message: string, code: string) => reply.code(status).send({ error: { message, code } });

export function isOriginAllowed(origin: string | undefined, corsOrigin: string): boolean {
  if (!origin) return false;
  const allowed = (corsOrigin || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.includes(origin) || allowed.includes('*')) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

export function createGuards(repository: Repository, crypto: Security, env: AppEnv, now: () => Date) {
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    let token = request.cookies[env.SESSION_COOKIE_NAME];
    if (!token && typeof request.headers.authorization === 'string' && request.headers.authorization.startsWith('Bearer ')) {
      token = request.headers.authorization.slice(7).trim();
    }
    if (!token) return fail(reply, 401, 'Authentication required', 'UNAUTHENTICATED');
    const at = now();
    const session = await repository.findSession(crypto.hashToken(token), at);
    if (!session) return fail(reply, 401, 'Session is invalid or expired', 'UNAUTHENTICATED');
    if (!session.user.isActive || !isSupportedUserRole(session.user.role)) {
      await repository.revokeSession(session.sessionId, at);
      reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', sameSite: env.COOKIE_SAMESITE ?? 'lax', secure: env.COOKIE_SECURE });
      return fail(reply, 403, 'Akun Anda tidak memiliki akses yang valid ke dashboard.', 'ROLE_INVALID');
    }
    if (session.user.mustChangePassword && !request.url.startsWith('/api/auth/')) {
      return fail(reply, 403, 'Must change password before accessing dashboard resources.', 'PASSWORD_CHANGE_REQUIRED');
    }
    request.auth = session;
  };
  const origin = async (request: FastifyRequest, reply: FastifyReply) => {
    const reqOrigin = request.headers.origin;
    if (!isOriginAllowed(reqOrigin, env.CORS_ORIGIN)) return fail(reply, 403, 'Invalid request origin', 'ORIGIN_INVALID');
  };
  const csrf = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers['x-csrf-token'];
    if (!request.auth || typeof token !== 'string' || !safeEqual(crypto.hashToken(token), request.auth.csrfTokenHash)) return fail(reply, 403, 'Invalid CSRF token', 'CSRF_INVALID');
  };
  const admin = async (request: FastifyRequest, reply: FastifyReply) => { if (!request.auth || !hasCapability(request.auth.user.role, 'manageUsers')) return fail(reply, 403, 'Admin access required', 'FORBIDDEN'); };
  const manager = async (request: FastifyRequest, reply: FastifyReply) => { if (!request.auth || (!hasCapability(request.auth.user.role, 'manageOwnUmkms') && !hasCapability(request.auth.user.role, 'manageAllUmkms'))) return fail(reply, 403, 'Management access is not assigned to this role', 'FORBIDDEN'); };
  return { authenticate, origin, csrf, admin, manager, secured: [authenticate, origin, csrf], managerSecured: [authenticate, origin, csrf, manager], adminSecured: [authenticate, origin, csrf, admin] };
}
