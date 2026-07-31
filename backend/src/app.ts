import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import type { AppEnv } from './config/env.js';
import { mediaConfig } from './config/env.js';
import type { Repository } from './db/repository.js';
import { security, type Security } from './auth/security.js';
import { createGuards } from './auth/guards.js';
import { createMediaStorage, FilesystemMediaStorage, type MediaStorage } from './media/storage.js';
import { healthRoutes } from './routes/health.js';
import { productRoutes } from './routes/products.js';
import { umkmRoutes } from './routes/umkms.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { manageRoutes } from './routes/manage.js';
import { mediaRoutes } from './routes/media.js';
import { eventRoutes } from './routes/events.js';
import { analyticsRoutes } from './routes/analytics.js';
import { SlugConflictError } from './errors/domain.js';

const errorEnvelope = (message: string, code: string) => ({ error: { message, code } });
export type AppDependencies = { security?: Security; now?: () => Date; id?: () => string; storage?: MediaStorage };
export async function buildApp(env: AppEnv, repository: Repository, dependencies: AppDependencies = {}) {
  if (env.NODE_ENV === 'production' && (!env.COOKIE_SECURE || env.CORS_ORIGIN === '*' || env.CORS_ORIGIN.includes(','))) throw new Error('Unsafe production security configuration');
  const app = Fastify({ logger: env.NODE_ENV !== 'test', trustProxy: env.TRUST_PROXY });
  const crypto = dependencies.security ?? security; const now = dependencies.now ?? (() => new Date()); const id = dependencies.id ?? randomUUID;
  const guards = createGuards(repository, crypto, env, now); const media = dependencies.storage ?? createMediaStorage(mediaConfig(env));
  await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } });
  await app.register(cookie);
  await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: '1 minute' });
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true, methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] });
  await app.register(multipart, { limits: { fileSize: env.MEDIA_MAX_BYTES ?? 10_000_000, files: 1 } });
  if (env.NODE_ENV !== 'production' && media instanceof FilesystemMediaStorage) { await mkdir(media.root, { recursive: true }); await app.register(fastifyStatic, { root: media.root, prefix: '/media/', decorateReply: false, dotfiles: 'ignore', list: false, setHeaders: (reply) => { reply.header('Access-Control-Allow-Origin', env.CORS_ORIGIN); reply.header('Cross-Origin-Resource-Policy', 'cross-origin'); reply.header('Cache-Control', 'public, max-age=3600'); } }); }
  app.setErrorHandler((error, _request, reply) => { app.log.error(error); if (error instanceof SlugConflictError) return reply.code(error.statusCode).send(errorEnvelope(error.message, error.code)); const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; const message = error instanceof Error ? error.message : 'Request failed'; return reply.code(statusCode < 500 ? statusCode : 500).send(errorEnvelope(statusCode < 500 ? message : 'Internal server error', statusCode < 500 ? 'REQUEST_ERROR' : 'INTERNAL_ERROR')); });
  await app.register(async (api) => { await healthRoutes(api, repository); await umkmRoutes(api, repository); await productRoutes(api, repository); await eventRoutes(api, repository, now); await authRoutes(api, repository, guards, crypto, env, now); await adminRoutes(api, repository, guards, crypto, now); await analyticsRoutes(api, repository, guards); await manageRoutes(api, repository, guards, now, id); await mediaRoutes(api, repository, guards, media, env, id); }, { prefix: '/api' });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send(errorEnvelope('Route not found', 'NOT_FOUND')));
  return app;
}