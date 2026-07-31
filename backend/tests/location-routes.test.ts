import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { Security } from '../src/auth/security.js';
import type { AppEnv } from '../src/config/env.js';
import type { Repository, SessionUser } from '../src/db/repository.js';

const at = new Date('2026-07-31T12:00:00.000Z');
const ownerId = '00000000-0000-4000-8000-000000000011', adminId = '00000000-0000-4000-8000-000000000012', umkmId = '00000000-0000-4000-8000-000000000013';
const owner: SessionUser = { id: ownerId, username: 'owner', displayName: 'Owner', role: 'pelaku_umkm', isActive: true, mustChangePassword: false };
const admin: SessionUser = { id: adminId, username: 'admin', displayName: 'Admin', role: 'admin', isActive: true, mustChangePassword: false };
const env: AppEnv = { DATABASE_URL: '', PORT: 3001, HOST: 'localhost', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'test', SESSION_TTL_HOURS: 2, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCKOUT_MINUTES: 10, LOGIN_RATE_LIMIT_MAX: 10, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false };
function security() { return { hashPassword: async (p: string) => `hash:${p}`, verifyPassword: async () => false, token: () => 'token', hashToken: (t: string) => `hash:${t}` } satisfies Security; }

function state() {
  const audits: Array<{ action: string; metadata?: object }> = [];
  const saved: Array<{ latitude: number; longitude: number } | 'cleared'> = [];
  let umkmOwner: string | null = ownerId;
  let location: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
  const business = () => ({ id: umkmId, ownerUserId: umkmOwner, publicationStatus: 'published', name: 'UMKM', address: 'Loning', ...location, catalogUpdatedAt: at });
  const sessions = new Map([
    ['hash:owner-session', { sessionId: 's1', csrfTokenHash: 'hash:owner-csrf', user: owner }],
    ['hash:admin-session', { sessionId: 's2', csrfTokenHash: 'hash:admin-csrf', user: admin }],
  ]);
  const repository = {
    findSession: async (h: string) => sessions.get(h),
    getManagedUMKM: async (id: string) => id === umkmId ? business() : undefined,
    updateUMKMLocation: async (_id: string, c: { latitude: number; longitude: number }) => { saved.push(c); location = { ...c }; return business(); },
    clearUMKMLocation: async () => { saved.push('cleared'); location = { latitude: null, longitude: null }; return business(); },
    addAudit: async (v: { action: string; metadata?: object }) => { audits.push(v); },
    transaction: async (operation: (tx: Repository) => Promise<unknown>) => operation(repository),
  } as unknown as Repository;
  return { repository, audits, saved, setUmkmOwner: (value: string | null) => { umkmOwner = value; } };
}
const headers = (role: 'owner' | 'admin') => ({ cookie: `loning_session=${role}-session`, origin: env.CORS_ORIGIN, 'x-csrf-token': `${role}-csrf` });

describe('location routes', () => {
  it('admin can save normalized coordinates', async () => {
    const s = state(); const app = await buildApp(env, s.repository, { security: security(), now: () => at });
    const r = await app.inject({ method: 'PATCH', url: `/api/manage/umkms/${umkmId}/location`, headers: headers('admin'), payload: { latitude: -6.8912346, longitude: 109.3821454 } });
    expect(r.statusCode).toBe(200);
    expect(r.json().data).toMatchObject({ latitude: -6.891235, longitude: 109.382145 });
    expect(s.saved[0]).toEqual({ latitude: -6.891235, longitude: 109.382145 });
    expect(s.audits.at(-1)?.action).toBe('umkm.location_updated');
    await app.close();
  });

  it('owner can save and clear own UMKM location', async () => {
    const s = state(); const app = await buildApp(env, s.repository, { security: security(), now: () => at });
    const saved = await app.inject({ method: 'PATCH', url: `/api/manage/umkms/${umkmId}/location`, headers: headers('owner'), payload: { latitude: -0, longitude: 0 } });
    expect(saved.statusCode).toBe(200);
    expect(saved.json().data).toMatchObject({ latitude: 0, longitude: 0 });
    expect(Object.is(saved.json().data.latitude, -0)).toBe(false);
    const cleared = await app.inject({ method: 'DELETE', url: `/api/manage/umkms/${umkmId}/location`, headers: headers('owner') });
    expect(cleared.statusCode).toBe(200);
    expect(cleared.json().data).toMatchObject({ latitude: null, longitude: null });
    expect(s.audits.at(-1)?.action).toBe('umkm.location_cleared');
    await app.close();
  });

  it('wrong owner receives the active 403 contract and anonymous 401', async () => {
    const s = state(); s.setUmkmOwner('someone-else'); const app = await buildApp(env, s.repository, { security: security(), now: () => at });
    const wrong = await app.inject({ method: 'PATCH', url: `/api/manage/umkms/${umkmId}/location`, headers: headers('owner'), payload: { latitude: 0, longitude: 0 } });
    expect(wrong.statusCode).toBe(403);
    expect(wrong.json().error.code).toBe('FORBIDDEN');
    const anonymous = await app.inject({ method: 'PATCH', url: `/api/manage/umkms/${umkmId}/location`, headers: { origin: env.CORS_ORIGIN, 'x-csrf-token': 'owner-csrf' }, payload: { latitude: 0, longitude: 0 } });
    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.json().error.code).toBe('UNAUTHENTICATED');
    await app.close();
  });

  it.each([
    ['partial latitude only', { latitude: -6.8 }],
    ['partial longitude only', { longitude: 109.3 }],
    ['unknown field', { latitude: -6.8, longitude: 109.3, zoom: 15 }],
    ['mapsUrl field', { latitude: -6.8, longitude: 109.3, mapsUrl: 'https://maps.google.com/x' }],
    ['maps_url field', { latitude: -6.8, longitude: 109.3, maps_url: 'https://maps.google.com/x' }],
    ['string coordinates', { latitude: '-6.8', longitude: '109.3' }],
    ['latitude above range', { latitude: 90.000001, longitude: 0 }],
    ['latitude below range', { latitude: -90.000001, longitude: 0 }],
    ['longitude above range', { latitude: 0, longitude: 180.000001 }],
    ['longitude below range', { latitude: 0, longitude: -180.000001 }],
    ['NaN latitude', { latitude: Number.NaN, longitude: 0 }],
  ])('rejects %s', async (_label, payload) => {
    const s = state(); const app = await buildApp(env, s.repository, { security: security(), now: () => at });
    const r = await app.inject({ method: 'PATCH', url: `/api/manage/umkms/${umkmId}/location`, headers: headers('admin'), payload: payload as { latitude: number; longitude: number } });
    expect(r.statusCode).toBe(400);
    expect(r.json().error.code).toBe('VALIDATION_ERROR');
    expect(s.saved).toEqual([]);
    await app.close();
  });

  it('serializes numeric coordinates as JSON numbers and keeps null location valid', async () => {
    const s = state(); const app = await buildApp(env, s.repository, { security: security(), now: () => at });
    const before = await app.inject({ url: `/api/manage/umkms/${umkmId}`, headers: { cookie: 'loning_session=owner-session' } });
    expect(before.statusCode).toBe(200);
    expect(before.json().data.latitude).toBeNull();
    expect(before.json().data.longitude).toBeNull();
    const r = await app.inject({ method: 'PATCH', url: `/api/manage/umkms/${umkmId}/location`, headers: headers('owner'), payload: { latitude: -6.5, longitude: 109.5 } });
    expect(typeof r.json().data.latitude).toBe('number');
    expect(typeof r.json().data.longitude).toBe('number');
    await app.close();
  });
});
