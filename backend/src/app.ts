import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import compress from '@fastify/compress';
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
import { mediaServeRoutes } from './routes/media-serve.js';
import { eventRoutes } from './routes/events.js';
import { analyticsRoutes } from './routes/analytics.js';
import { sitemapRoutes } from './routes/sitemap.js';
import { SlugConflictError } from './errors/domain.js';

const errorEnvelope = (message: string, code: string) => ({ error: { message, code } });

const FRONTEND_DIST_CANDIDATES = [
  // Render same-origin: backend dist is backend/dist, frontend dist is frontend/dist
  resolve(process.cwd(), '..', 'frontend', 'dist'),
  // Local monorepo run from backend/
  resolve(process.cwd(), 'frontend', 'dist'),
  // Compiled backend dist/src -> ../../frontend/dist
  (() => { try { return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'frontend', 'dist'); } catch { return ''; } })(),
].filter(Boolean);

function resolveFrontendDist(): string | null {
  for (const candidate of FRONTEND_DIST_CANDIDATES) if (candidate && existsSync(join(candidate, 'index.html'))) return candidate;
  return null;
}

export type AppDependencies = { security?: Security; now?: () => Date; id?: () => string; storage?: MediaStorage };
export async function buildApp(env: AppEnv, repository: Repository, dependencies: AppDependencies = {}) {
  if (env.NODE_ENV === 'production' && (!env.COOKIE_SECURE || !env.CORS_ORIGIN)) throw new Error('Unsafe production security configuration');
  const app = Fastify({ logger: env.NODE_ENV !== 'test', trustProxy: env.TRUST_PROXY });
  const crypto = dependencies.security ?? security; const now = dependencies.now ?? (() => new Date()); const id = dependencies.id ?? randomUUID;
  const guards = createGuards(repository, crypto, env, now); const media = dependencies.storage ?? createMediaStorage(mediaConfig(env));
  await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: { directives: { imgSrc: ["'self'", 'data:', 'https:'], frameSrc: ["'self'", 'https://www.openstreetmap.org'] } } });
  await app.register(compress, { threshold: 1024 });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Silakan coba kembali.' },
      retryAfter: context.after,
    }),
  });
  const allowedOrigins = (env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/i.test(origin)) return true;
    if (/^https:\/\/(www\.)?loningmaju\.my\.id$/i.test(origin)) return true;
    return false;
  };
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || isOriginAllowed(origin)) cb(null, true);
      else cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'x-csrf-token', 'authorization'],
  });
  await app.register(multipart, { limits: { fileSize: env.MEDIA_MAX_BYTES ?? 10_000_000, files: 1 } });
  // Serve media objects at /media/* in every environment via streaming (filesystem + S3).
  // Deterministic: no startup-time filesystem probing; bucket stays private.
  if (media instanceof FilesystemMediaStorage) await mkdir(media.root, { recursive: true });
  await mediaServeRoutes(app, media, env.CORS_ORIGIN);
  app.setErrorHandler((error, _request, reply) => { app.log.error(error); if (error instanceof SlugConflictError) return reply.code(error.statusCode).send(errorEnvelope(error.message, error.code)); const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500; const message = error instanceof Error ? error.message : 'Request failed'; return reply.code(statusCode < 500 ? statusCode : 500).send(errorEnvelope(statusCode < 500 ? message : 'Internal server error', statusCode < 500 ? 'REQUEST_ERROR' : 'INTERNAL_ERROR')); });
  await app.register(async (api) => { await healthRoutes(api, repository); await umkmRoutes(api, repository); await productRoutes(api, repository); await eventRoutes(api, repository, now); await authRoutes(api, repository, guards, crypto, env, now); await adminRoutes(api, repository, guards, crypto, now); await analyticsRoutes(api, repository, guards); await manageRoutes(api, repository, guards, now, id); await mediaRoutes(api, repository, guards, media, env, id); }, { prefix: '/api' });
  await sitemapRoutes(app, repository, env);
  // Same-origin static frontend serving (production only). Serves hashed assets and SPA fallback.
  // NEVER intercepts /api/* (registered above with prefix). API 404 stays JSON.
  if (env.NODE_ENV === 'production') {
    const frontendDist = resolveFrontendDist();
    if (frontendDist) {
      await app.register(fastifyStatic, { root: frontendDist, prefix: '/', decorateReply: false, dotfiles: 'ignore', list: false, cacheControl: true, maxAge: '1y', immutable: true, extensions: [] });
      // SPA fallback: serve index.html for non-asset, non-api GET paths (deep links).
      let indexHtml: Buffer | null = null;
      try { indexHtml = await readFile(join(frontendDist, 'index.html')); } catch { indexHtml = null; }
      const spaHtml = indexHtml;
      app.setNotFoundHandler((request, reply) => {
        if (spaHtml && request.method === 'GET' && !request.url.startsWith('/api/') && !request.url.startsWith('/media/') && !/\.[a-zA-Z0-9]{1,8}$/.test(request.url.split('?')[0])) {
          return reply.header('Content-Type', 'text/html; charset=utf-8').send(spaHtml);
        }
        return reply.code(404).send(errorEnvelope('Route not found', 'NOT_FOUND'));
      });
    } else {
      app.setNotFoundHandler((_request, reply) => reply.code(404).send(errorEnvelope('Route not found', 'NOT_FOUND')));
    }
  } else {
    app.setNotFoundHandler((_request, reply) => reply.code(404).send(errorEnvelope('Route not found', 'NOT_FOUND')));
  }
  return app;
}