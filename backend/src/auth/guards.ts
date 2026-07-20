import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppEnv } from '../config/env.js';
import type { Repository, SessionUser } from '../routes/repository.js';
import { safeEqual, type Security } from './security.js';

export type AuthContext = { user: SessionUser; sessionId: string; csrfTokenHash: string };
declare module 'fastify' { interface FastifyRequest { auth?: AuthContext } }
const fail = (reply: FastifyReply, status: number, message: string, code: string) => reply.code(status).send({ error: { message, code } });

export function createGuards(repository: Repository, crypto: Security, env: AppEnv, now: () => Date) {
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[env.SESSION_COOKIE_NAME];
    if (!token) return fail(reply, 401, 'Authentication required', 'UNAUTHENTICATED');
    const session = await repository.findSession(crypto.hashToken(token), now());
    if (!session || !session.user.isActive) return fail(reply, 401, 'Session is invalid or expired', 'UNAUTHENTICATED');
    request.auth = session;
  };
  const origin = async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;
    if (origin !== env.CORS_ORIGIN) return fail(reply, 403, 'Invalid request origin', 'ORIGIN_INVALID');
  };
  const csrf = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers['x-csrf-token'];
    if (!request.auth || typeof token !== 'string' || !safeEqual(crypto.hashToken(token), request.auth.csrfTokenHash)) return fail(reply, 403, 'Invalid CSRF token', 'CSRF_INVALID');
  };
  const admin = async (request: FastifyRequest, reply: FastifyReply) => { if (request.auth?.user.role !== 'admin') return fail(reply, 403, 'Admin access required', 'FORBIDDEN'); };
  return { authenticate, origin, csrf, admin, secured: [authenticate, origin, csrf], adminSecured: [authenticate, origin, csrf, admin] };
}
