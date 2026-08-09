import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { AppEnv } from '../src/config/env.js';
import { categories, type PublicProduct, type PublicUMKM, type Repository } from '../src/db/repository.js';

const env: AppEnv = { DATABASE_URL: 'postgresql://test:test@localhost/test', PORT: 3001, HOST: '127.0.0.1', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'test', SESSION_TTL_HOURS: 168, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 5, LOGIN_LOCKOUT_MINUTES: 15, LOGIN_RATE_LIMIT_MAX: 10, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false };
const umkms: PublicUMKM[] = [
  { id: '00000000-0000-4000-8000-000000000001', slug: 'umkm-kuliner-desa', name: 'UMKM Kuliner Desa', owner: 'Owner A', description: 'Traditional food', phone: '62812', category: 'Kuliner', imageUrl: 'image-a', address: 'Loning', latitude: null, longitude: null },
  { id: '00000000-0000-4000-8000-000000000002', slug: 'mebel-kayu', name: 'Mebel Kayu', owner: 'Owner B', description: 'Furniture', phone: '62813', category: 'Jasa & Otomotif', imageUrl: 'image-b', address: 'Loning', workingHours: '08:00', latitude: null, longitude: null },
];
const products: PublicProduct[] = [
  { id: '10000000-0000-4000-8000-000000000001', slug: 'nasi-box', umkmId: umkms[0].id, umkmName: umkms[0].name, name: 'Nasi Box', price: null, description: 'Food', category: 'Kuliner', imageUrl: 'image-a', isAvailable: true },
  { id: '10000000-0000-4000-8000-000000000002', slug: 'kursi', umkmId: umkms[1].id, umkmName: umkms[1].name, name: 'Kursi', price: 100, description: 'Wood', category: 'Jasa & Otomotif', imageUrl: 'image-b', isAvailable: true, unit: 'Unit' },
];
const includes = (values: string[], q?: string) => !q || values.some((value) => value.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
const repository = {
  listUMKMs: async ({ category, q, limit }: { category?: typeof categories[number]; q?: string; limit: number }) => umkms.filter((item) => (!category || item.category === category) && includes([item.name, item.owner, item.description, item.category, item.address], q)).slice(0, limit),
  getUMKM: async (identifier: string) => umkms.find((item) => item.id === identifier || item.slug === identifier),
  listProducts: async ({ category, q, umkmId, limit }: { category?: typeof categories[number]; q?: string; umkmId?: string; limit: number }) => products.filter((item) => (!category || item.category === category) && (!umkmId || item.umkmId === umkmId) && includes([item.name, item.description, item.category, item.umkmName], q)).slice(0, limit),
  listRelatedProducts: async (identifier: string, limit: number) => { const current = products.find((item) => item.id === identifier || item.slug === identifier); return current ? products.filter((item) => item.id !== current.id).sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category) || Number(b.umkmId === current.umkmId) - Number(a.umkmId === current.umkmId)).slice(0, limit) : undefined; },
  getProduct: async (identifier: string) => { const product = products.find((item) => item.id === identifier || item.slug === identifier); return product && { product, umkm: { id: umkms.find((item) => item.id === product.umkmId)!.id, slug: umkms.find((item) => item.id === product.umkmId)!.slug, name: product.umkmName, phone: '62812' } }; },
} as unknown as Repository;

describe('public API routes', () => {
  it('allows secure external images while restricting frames to self and OpenStreetMap', async () => { const app = await buildApp(env, repository); const response = await app.inject('/api/health'); const csp = response.headers['content-security-policy']; expect(csp).toContain("img-src 'self' data: https:"); expect(csp).toContain("frame-src 'self' https://www.openstreetmap.org"); expect(csp).not.toMatch(/frame-src https:|frame-src \*/); expect(csp).not.toContain('google.com'); await app.close(); });
  it('returns health, list envelopes, joined names, and stable order', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/health')).json()).toEqual({ status: 'ok' }); expect((await app.inject('/api/umkms')).json().data.map((item: PublicUMKM) => item.id)).toEqual(umkms.map((item) => item.id)); expect((await app.inject('/api/products')).json().data[0].umkmName).toBe('UMKM Kuliner Desa'); await app.close(); });
  it.each(categories)('accepts the %s category', async (category) => { const app = await buildApp(env, repository); const encoded = encodeURIComponent(category); expect((await app.inject(`/api/umkms?category=${encoded}`)).statusCode).toBe(200); expect((await app.inject(`/api/products?category=${encoded}`)).statusCode).toBe(200); await app.close(); });
  it('rejects invalid category and limit values', async () => { const app = await buildApp(env, repository); for (const path of ['/api/umkms?category=Nope', '/api/products?category=Nope', '/api/umkms?limit=0', '/api/products?limit=0', '/api/umkms?limit=101', '/api/products?limit=101', '/api/umkms?limit=1.5', '/api/products?limit=-1']) { const response = await app.inject(path); expect(response.statusCode).toBe(400); expect(response.json().error.code).toBe('VALIDATION_ERROR'); } await app.close(); });
  it('accepts public filter bounds and treats a whitespace-only q as no filter', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/products?limit=1')).statusCode).toBe(200); expect((await app.inject('/api/umkms?limit=100')).statusCode).toBe(200); const maxQuery = 'a'.repeat(80); expect((await app.inject(`/api/products?q=${maxQuery}`)).statusCode).toBe(200); expect((await app.inject(`/api/umkms?q=${maxQuery}`)).statusCode).toBe(200); expect((await app.inject('/api/products?q=%20%20')).json().data).toHaveLength(products.length); expect((await app.inject('/api/umkms?q=%20%20')).json().data).toHaveLength(umkms.length); await app.close(); });
  it('trims and performs case-insensitive searches including category and joined UMKM names', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/umkms?q=%20kULINER%20')).json().data).toHaveLength(1); expect((await app.inject('/api/products?q=mEbEl')).json().data[0].name).toBe('Kursi'); expect((await app.inject('/api/products?q=Jasa')).json().data[0].name).toBe('Kursi'); await app.close(); });
  it('rejects oversized public search queries', async () => { const app = await buildApp(env, repository); const query = 'a'.repeat(81); for (const path of [`/api/products?q=${query}`, `/api/umkms?q=${query}`]) { const response = await app.inject(path); expect(response.statusCode).toBe(400); expect(response.json().error.code).toBe('VALIDATION_ERROR'); } await app.close(); });
  it('returns bounded related products without the current product', async () => { const app = await buildApp(env, repository); const response = await app.inject(`/api/products/${products[0].slug}/related?limit=1`); expect(response.statusCode).toBe(200); expect(response.json().data).toHaveLength(1); expect(response.json().data[0].id).not.toBe(products[0].id); await app.close(); });
  it('returns not found when the related-product source is not public', async () => { const app = await buildApp(env, repository); const response = await app.inject('/api/products/missing-product/related'); expect(response.statusCode).toBe(404); expect(response.json().error.code).toBe('NOT_FOUND'); await app.close(); });
  it('rejects invalid related result limits', async () => { const app = await buildApp(env, repository); for (const limit of [0, 5]) { const response = await app.inject(`/api/products/${products[0].slug}/related?limit=${limit}`); expect(response.statusCode).toBe(400); expect(response.json().error.code).toBe('VALIDATION_ERROR'); } await app.close(); });
  it('filters products by UMKM UUID', async () => { const app = await buildApp(env, repository); const response = await app.inject(`/api/products?umkmId=${umkms[1].id}`); expect(response.json().data.map((item: PublicProduct) => item.name)).toEqual(['Kursi']); await app.close(); });
  it('resolves canonical slugs and legacy UUIDs', async () => { const app = await buildApp(env, repository); expect((await app.inject(`/api/umkms/${umkms[0].slug}`)).json().data.id).toBe(umkms[0].id); expect((await app.inject(`/api/umkms/${umkms[0].id}`)).json().data.slug).toBe(umkms[0].slug); expect((await app.inject(`/api/products/${products[0].slug}`)).json().data.id).toBe(products[0].id); expect((await app.inject(`/api/products/${products[0].id}`)).json().data.slug).toBe(products[0].slug); await app.close(); });
  it('rejects oversized identifiers and safely handles encoded slash, traversal, null byte, and malformed encoding', async () => { const app = await buildApp(env, repository); expect((await app.inject(`/api/umkms/${'a'.repeat(129)}`)).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/products/a%2Fb')).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/umkms/%2E%2E%2Fadmin')).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/products/bad%00slug')).statusCode).toBeGreaterThanOrEqual(400); expect((await app.inject('/api/umkms/%E0%A4%A')).statusCode).toBeGreaterThanOrEqual(400); await app.close(); });
  it('returns structured operating hours when present and omits them when absent', async () => { const app = await buildApp(env, repository); const businesses = (await app.inject('/api/umkms?limit=2')).json().data; expect(businesses[0]).not.toHaveProperty('openingTime'); expect(businesses[0]).not.toHaveProperty('closingTime'); expect(businesses[1]).toHaveProperty('workingHours', '08:00'); await app.close(); });
  it('uses the error envelope for unknown routes', async () => { const app = await buildApp(env, repository); expect((await app.inject('/api/nope')).json()).toEqual({ error: { message: 'Route not found', code: 'NOT_FOUND' } }); await app.close(); });
  it('compresses response larger than threshold with gzip when Accept-Encoding gzip header is present', async () => {
    const app = await buildApp(env, {
      ...repository,
      listProducts: async () => Array.from({ length: 20 }, (_, i) => ({
        id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        slug: `product-${i}`,
        umkmId: umkms[0].id,
        umkmName: umkms[0].name,
        name: `Product ${i} with long description text for compression test`,
        price: 10000,
        description: 'Detailed description text meant to exceed compression threshold of 1024 bytes easily.',
        category: 'Kuliner',
        imageUrl: 'https://example.com/image.jpg',
        isAvailable: true,
      })),
    } as unknown as Repository);
    const response = await app.inject({
      method: 'GET',
      url: '/api/products?limit=100',
      headers: { 'accept-encoding': 'gzip' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.headers['vary']?.toLowerCase()).toContain('accept-encoding');

    // Small response under threshold (health check) does not get gzip compressed
    const smallRes = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { 'accept-encoding': 'gzip' },
    });
    expect(smallRes.statusCode).toBe(200);
    expect(smallRes.headers['content-encoding']).toBeUndefined();

    // Request without accept-encoding header does not get gzip compressed
    const noHeaderRes = await app.inject({
      method: 'GET',
      url: '/api/products?limit=100',
    });
    expect(noHeaderRes.statusCode).toBe(200);
    expect(noHeaderRes.headers['content-encoding']).toBeUndefined();

    await app.close();
  });
});
