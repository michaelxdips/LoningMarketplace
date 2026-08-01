import type { FastifyInstance } from 'fastify';
import type { MediaStorage } from '../media/storage.js';

// Uploads are normalized to WebP/AVIF, but keep a small map for legacy assets.
const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon',
};

// Serves private storage objects through GET /media/* in every environment.
// Canonical /media/{uuid}/... maps to storage key media/{uuid}/.... Existing
// /media/media/{uuid}/... URLs and legacy unprefixed keys remain readable.
export async function mediaServeRoutes(app: FastifyInstance, storage: MediaStorage, corsOrigin: string) {
  app.get<{ Params: { '*': string } }>('/media/*', async (request, reply) => {
    const rawPath = (request.raw.url ?? '').split('?', 1)[0];
    const key = (request.params['*'] ?? '').replace(/^\/+/, '');
    if (/%(?:2f|5c|00)/i.test(rawPath) || key.length > 512 || !key || !/^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/.test(key) || key.includes('..')) {
      return reply.code(404).send({ error: { message: 'Media not found', code: 'NOT_FOUND' } });
    }

    const candidates = key.startsWith('media/') ? [key] : [`media/${key}`, key];
    let object;
    let servedKey = key;
    for (const candidate of candidates) {
      try {
        object = await storage.stream(candidate);
        servedKey = candidate;
        break;
      } catch (error) {
        if ((error as { code?: string }).code !== 'ENOENT') throw error;
      }
    }
    if (!object) return reply.code(404).send({ error: { message: 'Media not found', code: 'NOT_FOUND' } });

    const ext = servedKey.split('.').pop()?.toLowerCase() ?? '';
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
