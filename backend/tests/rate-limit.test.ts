import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AppEnv } from '../src/config/env.js';
import type { Repository } from '../src/db/repository.js';

const env: AppEnv = { DATABASE_URL: 'postgresql://test:test@localhost/test', PORT: 3001, HOST: '127.0.0.1', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'test', SESSION_TTL_HOURS: 2, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCKOUT_MINUTES: 10, LOGIN_RATE_LIMIT_MAX: 3, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false };

describe('Rate limiting', () => {
  it('limits the login route rather than using health as a proxy', async () => {
    const audits: unknown[] = [];
    const repository = { findUserByEmail: async () => undefined, findUserByUsername: async () => undefined, addAudit: async (entry: unknown) => { audits.push(entry); }, transaction: async (operation: (tx: Repository) => Promise<unknown>) => operation(repository as unknown as Repository) } as unknown as Repository;
    const app = await buildApp(env, repository);
    try {
      for (let i = 0; i < env.LOGIN_RATE_LIMIT_MAX; i++) {
        const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: env.CORS_ORIGIN }, payload: { identifier: `missing-${i}@example.test`, password: 'too-short' } });
        expect(response.statusCode).toBe(401);
      }
      const exceeded = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin: env.CORS_ORIGIN }, payload: { identifier: 'missing-final@example.test', password: 'too-short' } });
      expect(exceeded.statusCode).toBe(429);
    } finally {
      await app.close();
    }
  });
});

