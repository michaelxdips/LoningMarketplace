import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/config/env.js';
import type { Repository } from '../src/db/repository.js';

describe('sitemap and robots.txt routes & public-origin routing proof', () => {
  const env = parseEnv({
    NODE_ENV: 'test',
    PUBLIC_SITE_URL: 'https://loningmaju.desa.id',
    MEDIA_PUBLIC_BASE_URL: 'https://media.loningmaju.desa.id/media',
    CORS_ORIGIN: 'https://loningmaju.desa.id',
  }, false);

  const mockRepository = {
    listUMKMs: async () => [
      { id: 'u1', name: 'Dapur Sri', slug: 'dapur-sri', publicationStatus: 'published', updatedAt: new Date('2026-01-01') },
      { id: 'u2', name: 'Draft UMKM', slug: 'draft-umkm', publicationStatus: 'draft', updatedAt: new Date('2026-01-01') },
    ],
    listProducts: async () => [
      { id: 'p1', name: 'Keripik Pisang', slug: 'keripik-pisang', publicationStatus: 'published', updatedAt: new Date('2026-01-02') },
      { id: 'p2', name: 'Archived Product', slug: 'archived-product', publicationStatus: 'archived', updatedAt: new Date('2026-01-02') },
    ],
  } as unknown as Repository;

  it('serves valid sitemap.xml with PUBLIC_SITE_URL and excludes media CDN origin and non-published items', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/sitemap.xml',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/xml');
    expect(res.payload).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/</loc>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/faq</loc>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/tentang-desa</loc>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/peta-umkm</loc>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/umkm/dapur-sri</loc>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/produk/keripik-pisang</loc>');
    expect(res.payload).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>');

    // Must NOT contain media CDN domain
    expect(res.payload).not.toContain('media.loningmaju.desa.id');

    // Excludes non-published items
    expect(res.payload).not.toContain('draft-umkm');
    expect(res.payload).not.toContain('archived-product');
  });

  it('handles >100 items without truncation and includes record past index 100', async () => {
    const umkms120 = Array.from({ length: 120 }, (_, i) => ({
      slug: `umkm-ke-${i + 1}`,
      publicationStatus: 'published',
      updatedAt: new Date('2026-01-01'),
    }));
    const products105 = Array.from({ length: 105 }, (_, i) => ({
      slug: `produk-ke-${i + 1}`,
      publicationStatus: 'published',
      updatedAt: new Date('2026-01-01'),
    }));

    const repo = {
      getSitemapUMKMs: async () => umkms120,
      getSitemapProducts: async () => products105,
    } as unknown as Repository;

    const app = await buildApp(env, repo);
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    expect(res.statusCode).toBe(200);
    expect(res.payload).toContain('/umkm/umkm-ke-101');
    expect(res.payload).toContain('/umkm/umkm-ke-120');
    expect(res.payload).toContain('/produk/produk-ke-101');
    expect(res.payload).toContain('/produk/produk-ke-105');
  });

  it('handles timestamp fallback priority, invalid dates, and XML escaping', async () => {
    const repo = {
      getSitemapUMKMs: async () => [
        { slug: 'umkm-updated', publicationStatus: 'published', updatedAt: new Date('2026-03-01'), publishedAt: new Date('2026-02-01'), createdAt: new Date('2026-01-01') },
        { slug: 'umkm-published', publicationStatus: 'published', updatedAt: null, publishedAt: new Date('2026-02-01'), createdAt: new Date('2026-01-01') },
        { slug: 'umkm-created', publicationStatus: 'published', updatedAt: null, publishedAt: null, createdAt: new Date('2026-01-01') },
        { slug: 'umkm-no-date', publicationStatus: 'published', updatedAt: null, publishedAt: null, createdAt: null },
        { slug: 'umkm-invalid-date', publicationStatus: 'published', updatedAt: 'invalid-date-string' },
        { slug: 'umkm&special<tag>', publicationStatus: 'published', updatedAt: new Date('2026-01-01') },
      ],
      getSitemapProducts: async () => [],
    } as unknown as Repository;

    const app = await buildApp(env, repo);
    const res = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    expect(res.statusCode).toBe(200);
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/umkm/umkm-updated</loc>');
    expect(res.payload).toContain('<lastmod>2026-03-01T00:00:00.000Z</lastmod>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/umkm/umkm-published</loc>');
    expect(res.payload).toContain('<lastmod>2026-02-01T00:00:00.000Z</lastmod>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/umkm/umkm-created</loc>');
    expect(res.payload).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/umkm/umkm-no-date</loc>');
    expect(res.payload).toContain('<loc>https://loningmaju.desa.id/umkm/umkm-invalid-date</loc>');
    expect(res.payload).toContain('umkm%26special%3Ctag%3E');
  });

  it('serves valid robots.txt pointing to absolute sitemap URL and disallowing internal routes', async () => {
    const app = await buildApp(env, mockRepository);
    const res = await app.inject({
      method: 'GET',
      url: '/robots.txt',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.payload).toContain('User-agent: *');
    expect(res.payload).toContain('Allow: /');
    expect(res.payload).toContain('Disallow: /dashboard');
    expect(res.payload).toContain('Disallow: /login');
    expect(res.payload).toContain('Disallow: /api/');
    expect(res.payload).toContain('Sitemap: https://loningmaju.desa.id/sitemap.xml');
  });

  it('Public-origin routing proof - directly serves /sitemap.xml and /robots.txt over real HTTP and ignores spoofed Host / X-Forwarded-Host headers', async () => {
    const app = await buildApp(env, mockRepository);
    const address = await app.listen({ port: 0, host: '127.0.0.1' });

    try {
      // 1. Request /sitemap.xml over real HTTP through public origin listener with untrusted host/forwarded headers
      const sitemapRes = await fetch(`${address}/sitemap.xml`, {
        headers: {
          Host: 'untrusted-proxy.internal',
          'X-Forwarded-Host': 'spoofed-domain.attacker.test',
          'X-Forwarded-Proto': 'http',
        },
      });

      expect(sitemapRes.status).toBe(200);
      expect(sitemapRes.headers.get('content-type')).toContain('application/xml');
      const sitemapText = await sitemapRes.text();
      expect(sitemapText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapText).toContain('<loc>https://loningmaju.desa.id/</loc>');
      expect(sitemapText).toContain('<loc>https://loningmaju.desa.id/produk/keripik-pisang</loc>');
      expect(sitemapText).not.toContain('untrusted-proxy.internal');
      expect(sitemapText).not.toContain('spoofed-domain.attacker.test');
      expect(sitemapText).not.toContain('draft-umkm');
      expect(sitemapText).not.toContain('archived-product');

      // 2. Request /robots.txt over real HTTP through public origin listener with untrusted host/forwarded headers
      const robotsRes = await fetch(`${address}/robots.txt`, {
        headers: {
          Host: 'untrusted-proxy.internal',
          'X-Forwarded-Host': 'spoofed-domain.attacker.test',
          'X-Forwarded-Proto': 'http',
        },
      });

      expect(robotsRes.status).toBe(200);
      expect(robotsRes.headers.get('content-type')).toContain('text/plain');
      const robotsText = await robotsRes.text();
      expect(robotsText).toContain('User-agent: *');
      expect(robotsText).toContain('Allow: /');
      expect(robotsText).toContain('Disallow: /dashboard');
      expect(robotsText).toContain('Sitemap: https://loningmaju.desa.id/sitemap.xml');
      expect(robotsText).not.toContain('untrusted-proxy.internal');
      expect(robotsText).not.toContain('spoofed-domain.attacker.test');
    } finally {
      await app.close();
    }
  });
});
