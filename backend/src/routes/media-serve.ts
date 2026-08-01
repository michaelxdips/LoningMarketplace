import type { FastifyInstance } from 'fastify';
import type { MediaStorage } from '../media/storage.js';

// Uploads are normalized to WebP/AVIF, but keep a small map for legacy assets.
const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon',
};

// Serves media objects at GET /media/* in every environment (filesystem + S3).
// Key = wildcard minus the leading '/'. Object keys are namespaced as media/{uuid}/...,
// so the public URL is /media/media/{uuid}/... — deterministic and identical for local
// filesystem and production S3. Buckets stay private; this route is the only read path.
export async function mediaServeRoutes(app: FastifyInstance, storage: MediaStorage, corsOrigin: string) {
  app.get<{ Params: { '*': string } }>('/media/*', async (request, reply) => {
    const key = (request.params['*'] ?? '').replace(/^\/+/, '');
    if (!key || !/^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/.test(key) || key.includes('..')) return reply.code(404).send({ error: { message: 'Media not found', code: 'NOT_FOUND' } });
    let object;
    try { object = await storage.stream(key); }
    catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') return reply.code(404).send({ error: { message: 'Media not found', code: 'NOT_FOUND' } });
      throw error;
    }
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    return reply
      .header('Content-Type', object.contentType ?? MIME_BY_EXT[ext] ?? 'application/octet-stream')
      .header('Cache-Control', object.cacheControl ?? 'public, max-age=3600')
      .header('Access-Control-Allow-Origin', corsOrigin)
      .header('Cross-Origin-Resource-Policy', 'cross-origin')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Content-Disposition', 'inline')
      .send(object.stream);
  });
}
