import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AppEnv } from '../src/config/env.js';
import type { Repository, SessionUser } from '../src/db/repository.js';
import { security } from '../src/auth/security.js';

const env: AppEnv = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  PORT: 3001,
  HOST: '127.0.0.1',
  CORS_ORIGIN: 'http://localhost:3000',
  NODE_ENV: 'test',
  SESSION_TTL_HOURS: 168,
  SESSION_RETENTION_DAYS: 30,
  SESSION_COOKIE_NAME: 'loning_session',
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
  LOGIN_RATE_LIMIT_MAX: 10,
  LOGIN_RATE_LIMIT_WINDOW: '1 minute',
  RATE_LIMIT_MAX: 100,
  TRUST_PROXY: false,
  COOKIE_SECURE: false,
};

const mockSuperadmin: SessionUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'superadmin@loning.desa.id',
  username: 'superadmin',
  displayName: 'Administrator Utama',
  role: 'superadmin',
  roleLabel: 'Administrator Utama',
  isActive: true,
  mustChangePassword: false,
};

const mockRepository = {
  findSession: async (tokenHash: string, at: Date) => {
    if (tokenHash === security.hashToken('valid-admin-token')) {
      return {
        sessionId: 'sess-1',
        csrfTokenHash: 'csrf-hash',
        user: mockSuperadmin,
      };
    }
    return null;
  },
  inquiryAnalytics: async (from: Date, to: Date) => {
    return {
      totals: { umkm_view: 10, product_view: 20, inquiry_started: 5, message_copied: 3, whatsapp_opened: 4 },
      inquiryStartRate: 0.1667,
      whatsappOpenRate: 0.8,
    };
  },
  inquiryAnalyticsByTarget: async (from: Date, to: Date) => {
    return [
      { umkmId: 'u1', umkmName: 'Warung Nasi Loning', productId: 'p1', productName: 'Nasi Megono', eventType: 'product_view', count: 15 },
      { umkmId: 'u1', umkmName: 'Warung Nasi Loning', productId: null, productName: null, eventType: 'umkm_view', count: 10 },
    ];
  },
} as unknown as Repository;

describe('Inquiry Analytics Backend API', () => {
  it('rejects unauthenticated analytics requests with 401', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/inquiry-analytics?from=2026-07-01&to=2026-08-01',
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('accepts valid date range and returns formatted analytics envelope', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/inquiry-analytics?from=2026-07-01&to=2026-08-01',
      headers: { authorization: 'Bearer valid-admin-token' },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.data).toBeDefined();
    expect(json.data.from).toBe('2026-07-01T00:00:00.000Z');
    expect(json.data.to).toBe('2026-08-01T00:00:00.000Z');
    expect(json.data.totals.product_view).toBe(20);
    expect(json.data.breakdown).toHaveLength(2);
    expect(json.data.breakdown[0].productName).toBe('Nasi Megono');
    await app.close();
  });

  it('supports single-day / same-day date range (from === to)', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/inquiry-analytics?from=2026-08-05&to=2026-08-05',
      headers: { authorization: 'Bearer valid-admin-token' },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.data.from).toBe('2026-08-05T00:00:00.000Z');
    expect(json.data.to).toBe('2026-08-05T00:00:00.000Z');
    await app.close();
  });

  it('rejects reversed date range (to < from) with 400', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/inquiry-analytics?from=2026-08-05&to=2026-07-01',
      headers: { authorization: 'Bearer valid-admin-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_DATE_RANGE');
    await app.close();
  });

  it('rejects date range exceeding 366 days with 400', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/inquiry-analytics?from=2024-01-01&to=2025-06-01',
      headers: { authorization: 'Bearer valid-admin-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('DATE_RANGE_TOO_LARGE');
    await app.close();
  });

  it('handles non-iterable database result format safely without 500 error', async () => {
    const repoWithObjectResult = {
      ...mockRepository,
      inquiryAnalyticsByTarget: async () => {
        return {
          rows: [
            { umkmId: 'u1', umkmName: 'Warung Nasi Loning', productId: 'p1', productName: 'Nasi Megono', eventType: 'product_view', count: 5 },
          ],
          command: 'SELECT',
          rowCount: 1,
        } as any;
      },
    } as unknown as Repository;

    const app = await buildApp(env, repoWithObjectResult);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/inquiry-analytics?from=2026-07-01&to=2026-08-01',
      headers: { authorization: 'Bearer valid-admin-token' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.breakdown).toHaveLength(1);
    expect(res.json().data.breakdown[0].productName).toBe('Nasi Megono');
    await app.close();
  });
});
