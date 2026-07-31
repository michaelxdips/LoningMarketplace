import type { FastifyInstance } from 'fastify';
import type { Repository } from '../db/repository.js';
import type { AppEnv } from '../config/env.js';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function sitemapRoutes(app: FastifyInstance, repository: Repository, env: AppEnv) {
  const publicSiteUrl = (env.PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  app.get('/sitemap.xml', async (_request, reply) => {
    try {
      // repository.listUMKMs and listProducts return published items
      const umkms = await repository.listUMKMs({ limit: 1000 });
      const products = await repository.listProducts({ limit: 5000 });

      const urls: Array<{ loc: string }> = [
        { loc: `${publicSiteUrl}/` },
        { loc: `${publicSiteUrl}/faq` },
        { loc: `${publicSiteUrl}/tentang-desa` },
        { loc: `${publicSiteUrl}/peta-umkm` },
      ];

      for (const umkm of umkms) {
        if ('publicationStatus' in umkm && (umkm as { publicationStatus?: string }).publicationStatus !== 'published') continue;
        urls.push({
          loc: `${publicSiteUrl}/umkm/${encodeURIComponent(umkm.slug)}`,
        });
      }

      for (const product of products) {
        if ('publicationStatus' in product && (product as { publicationStatus?: string }).publicationStatus !== 'published') continue;
        urls.push({
          loc: `${publicSiteUrl}/produk/${encodeURIComponent(product.slug)}`,
        });
      }

      const xmlLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ];

      for (const item of urls) {
        xmlLines.push('  <url>');
        xmlLines.push(`    <loc>${escapeXml(item.loc)}</loc>`);
        xmlLines.push('  </url>');
      }

      xmlLines.push('</urlset>');

      reply.header('Content-Type', 'application/xml; charset=utf-8');
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return reply.send(xmlLines.join('\n'));
    } catch {
      reply.header('Content-Type', 'application/xml; charset=utf-8');
      return reply.code(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap generation failed</error>');
    }
  });

  app.get('/robots.txt', async (_request, reply) => {
    const sitemapUrl = `${publicSiteUrl}/sitemap.xml`;
    const robotsTxt = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /dashboard',
      'Disallow: /login',
      'Disallow: /api/',
      '',
      `Sitemap: ${sitemapUrl}`,
    ].join('\n');

    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Cache-Control', 'public, max-age=86400');
    return reply.send(robotsTxt);
  });
}
