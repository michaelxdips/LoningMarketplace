import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AppEnv } from '../src/config/env.js';
import { categories, type PublicProduct, type PublicUMKM, type Repository } from '../src/db/repository.js';

const env: AppEnv = { DATABASE_URL: 'postgresql://test:test@localhost/test', PORT: 3001, HOST: '127.0.0.1', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'test', SESSION_TTL_HOURS: 168, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 5, LOGIN_LOCKOUT_MINUTES: 15, LOGIN_RATE_LIMIT_MAX: 10, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false };
const umkms: PublicUMKM[] = [
  { id: '00000000-0000-4000-8000-000000000001', slug: 'umkm-kuliner-desa', name: 'UMKM Kuliner Desa', owner: 'Owner A', description: 'Traditional food', phone: '62812', category: 'Kuliner', imageUrl: 'image-a', address: 'Loning' },
  { id: '00000000-0000-4000-8000-000000000002', slug: 'mebel-kayu', name: 'Mebel Kayu', owner: 'Owner B', description: 'Furniture', phone: '62813', category: 'Jasa', imageUrl: 'image-b', address: 'Loning', workingHours: '08:00' },
];
const products: PublicProduct[] = [
  { id: '10000000-0000-4000-8000-000000000001', slug: 'nasi-box', umkmId: umkms[0].id, umkmName: umkms[0].name, name: 'Nasi Box', price: null, description: 'Food', category: 'Kuliner', imageUrl: 'image-a', isAvailable: true },
  { id: '10000000-0000-4000-8000-000000000002', slug: 'kursi', umkmId: umkms[1].id, umkmName: umkms[1].name, name: 'Kursi', price: 100, description: 'Wood', category: 'Jasa', imageUrl: 'image-b', isAvailable: true, unit: 'Unit' },
];
const includes = (values: string[], q?: string) => !q || values.some((value) => value.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
const repository = {
  listUMKMs: async ({ category, q, limit }: { category?: typeof categories[number]; q?: string; limit: number }) => umkms.filter((item) => (!category || item.category === category) && includes([item.name, item.owner, item.description, item.category, item.address], q)).slice(0, limit),
  getUMKM: async (identifier: string) => umkms.find((item) => item.id === identifier || item.slug === identifier),
  listProducts: async ({ category, q, umkmId, limit }: { category?: typeof categories[number]; q?: string; umkmId?: string; limit: number }) => products.filter((item) => (!category || item.category === category) && (!umkmId || item.umkmId === umkmId) && includes([item.name, item.description, item.umkmName], q)).slice(0, limit),
  getProduct: async (identifier: string) => { const product = products.find((item) => item.id === identifier || item.slug === identifier); return product && { product, umkm: { id: umkms.find((item) => item.id === product.umkmId)!.id, slug: umkms.find((item) => item.id === product.umkmId)!.slug, name: product.umkmName, phone: '62812' } }; },
} as unknown as Repository;

describe('public API routes', () => {
  it('returns health, list envelopes, joined names, and stable order', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/health')).json()).toEqual({ status: 'ok' }); expect((await app.inject('/api/umkms')).json().data.map((item: PublicUMKM) => item.id)).toEqual(umkms.map((item) => item.id)); expect((await app.inject('/api/products')).json().data[0].umkmName).toBe('UMKM Kuliner Desa'); await app.close(); });
  it.each(categories)('accepts the %s category', async (category) => { const app = await buildApp(env, repository); expect((await app.inject(`/api/umkms?category=${category}`)).statusCode).toBe(200); expect((await app.inject(`/api/products?category=${category}`)).statusCode).toBe(200); await app.close(); });
  it('rejects invalid category and limit values', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/umkms?category=Nope')).statusCode).toBe(400); expect((await app.inject('/api/products?limit=0')).json().error.code).toBe('VALIDATION_ERROR'); await app.close(); });
  it('trims and performs case-insensitive searches including joined UMKM names', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/umkms?q=%20kULINER%20')).json().data).toHaveLength(1); expect((await app.inject('/api/products?q=mEbEl')).json().data[0].name).toBe('Kursi'); await app.close(); });
  it('filters products by UMKM UUID', async () => { const app = await buildApp(env, repository); const response = await app.inject(`/api/products?umkmId=${umkms[1].id}`); expect(response.json().data.map((item: PublicProduct) => item.name)).toEqual(['Kursi']); await app.close(); });
  it('resolves canonical slugs and legacy UUIDs', async () => { const app = await buildApp(env, repository); expect((await app.inject(`/api/umkms/${umkms[0].slug}`)).json().data.id).toBe(umkms[0].id); expect((await app.inject(`/api/umkms/${umkms[0].id}`)).json().data.slug).toBe(umkms[0].slug); expect((await app.inject(`/api/products/${products[0].slug}`)).json().data.id).toBe(products[0].id); expect((await app.inject(`/api/products/${products[0].id}`)).json().data.slug).toBe(products[0].slug); await app.close(); });
  it('rejects oversized identifiers and safely handles encoded slash, traversal, null byte, and malformed encoding', async () => { const app = await buildApp(env, repository); expect((await app.inject(`/api/umkms/${'a'.repeat(129)}`)).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/products/a%2Fb')).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/umkms/%2E%2E%2Fadmin')).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/products/bad%00slug')).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/umkms/%E0%A4%A')).statusCode).toBeGreaterThanOrEqual(400); await app.close(); });
  it('keeps nullable prices explicit and omits other optional fields', async () => { const app = await buildApp(env, repository); const business = (await app.inject('/api/umkms?limit=1')).json().data[0]; const product = (await app.inject('/api/products?limit=1')).json().data[0]; expect(business).not.toHaveProperty('workingHours'); expect(product).toHaveProperty('price', null); expect(product).not.toHaveProperty('unit'); await app.close(); });
  it('uses the error envelope for unknown routes', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/nope')).json()).toEqual({ error: { message: 'Route not found', code: 'NOT_FOUND' } }); await app.close(); });
});
