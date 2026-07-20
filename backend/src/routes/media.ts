import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import { processImage, MediaProcessingError } from '../media/processor.js';
import type { MediaStorage } from '../media/storage.js';
import type { Repository } from './repository.js';
import type { ReturnTypeGuards } from './types.js';
import { error, uuid } from './validation.js';

const info = (r: FastifyRequest) => ({ ipAddress: r.ip, userAgent: typeof r.headers['user-agent'] === 'string' ? r.headers['user-agent'] : undefined });
const output = (asset: { id: string; cardStorageKey: string; thumbnailStorageKey: string; cardWidth: number; cardHeight: number; cardByteSize: number; altText: string | null }, storage: MediaStorage) => ({ id: asset.id, imageUrl: storage.getPublicUrl(asset.cardStorageKey), thumbnailUrl: storage.getPublicUrl(asset.thumbnailStorageKey), width: asset.cardWidth, height: asset.cardHeight, byteSize: asset.cardByteSize, altText: asset.altText });
const mimeMatches = (declared: string, actual: string) => declared === actual || (declared === 'image/jpg' && actual === 'image/jpeg');

export async function mediaRoutes(app: FastifyInstance, repository: Repository, guards: ReturnTypeGuards, storage: MediaStorage, env: AppEnv, id: () => string) {
  app.post('/manage/media/images', { preHandler: guards.secured }, async (request, reply) => {
    let file: { buffer: Buffer; filename: string; mimetype: string } | undefined; let altText: string | null = null; let invalid = false;
    try {
      for await (const part of request.parts({ limits: { fileSize: env.MEDIA_MAX_BYTES ?? 5 * 1024 * 1024, files: 1, fields: 1 } })) {
        if (part.type === 'file') { if (file) invalid = true; else file = { buffer: await part.toBuffer(), filename: part.filename, mimetype: part.mimetype }; }
        else if (part.fieldname === 'altText' && typeof part.value === 'string') altText = part.value.trim() || null; else invalid = true;
      }
    } catch (e) { if ((e as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') return reply.code(413).send(error('Image exceeds the upload size limit', 'MEDIA_TOO_LARGE')); return reply.code(400).send(error('Invalid multipart upload', 'MEDIA_UPLOAD_INVALID')); }
    if (invalid) return reply.code(400).send(error('Only one image file and optional altText are accepted', 'MEDIA_UPLOAD_INVALID'));
    if (!file) return reply.code(400).send(error('Image file is required', 'MEDIA_FILE_REQUIRED'));
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return reply.code(415).send(error('Only JPEG, PNG, and WebP images are supported', 'MEDIA_UNSUPPORTED'));
    let processed; try { processed = await processImage(file.buffer, { MEDIA_MAX_BYTES: env.MEDIA_MAX_BYTES ?? 5 * 1024 * 1024, MEDIA_MAX_WIDTH: env.MEDIA_MAX_WIDTH ?? 8_000, MEDIA_MAX_HEIGHT: env.MEDIA_MAX_HEIGHT ?? 8_000, MEDIA_MAX_PIXELS: env.MEDIA_MAX_PIXELS ?? 40_000_000 }); } catch (e) { if (e instanceof MediaProcessingError) return reply.code(e.statusCode).send(error(e.message, e.code)); throw e; }
    if (!mimeMatches(file.mimetype, processed.originalMimeType)) return reply.code(415).send(error('Declared MIME type does not match image content', 'MEDIA_UNSUPPORTED'));
    if (altText && altText.length > 500) return reply.code(400).send(error('altText is too long', 'VALIDATION_ERROR'));
    const assetId = id(), cardStorageKey = `media/${assetId}/card.webp`, thumbnailStorageKey = `media/${assetId}/thumbnail.webp`;
    try { await storage.putObject(cardStorageKey, { body: processed.card, contentType: processed.outputMimeType, cacheControl: 'public, max-age=31536000, immutable' }); await storage.putObject(thumbnailStorageKey, { body: processed.thumb, contentType: processed.outputMimeType, cacheControl: 'public, max-age=31536000, immutable' }); } catch { await storage.deleteObject(cardStorageKey).catch(() => undefined); await storage.deleteObject(thumbnailStorageKey).catch(() => undefined); return reply.code(503).send(error('Media storage unavailable', 'MEDIA_STORAGE_ERROR')); }
    try {
      const asset = await repository.transaction(async (tx) => { const created = await tx.createMediaAsset({ id: assetId, createdByUserId: request.auth!.user.id, originalFilename: file!.filename || null, originalMimeType: processed.originalMimeType, outputMimeType: processed.outputMimeType, checksumSha256: processed.checksum, cardStorageKey, thumbnailStorageKey, cardWidth: processed.cardWidth, cardHeight: processed.cardHeight, cardByteSize: processed.card.length, thumbnailWidth: processed.thumbWidth, thumbnailHeight: processed.thumbHeight, thumbnailByteSize: processed.thumb.length, altText }); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'media.uploaded', entityType: 'media_asset', entityId: assetId, metadata: { checksumSha256: processed.checksum }, ...info(request) }); return created; });
      return reply.code(201).send({ data: output(asset, storage) });
    } catch (e) { await storage.deleteObject(cardStorageKey).catch(() => undefined); await storage.deleteObject(thumbnailStorageKey).catch(() => undefined); throw e; }
  });
  app.get<{ Params: { id: string } }>('/manage/media/images/:id', { preHandler: guards.authenticate }, async (request, reply) => { if (!uuid.safeParse(request.params.id).success) return reply.code(400).send(error('Invalid UUID', 'VALIDATION_ERROR')); const asset = await repository.getMediaAsset(request.params.id); if (!asset) return reply.code(404).send(error('Media asset not found', 'NOT_FOUND')); if (request.auth!.user.role !== 'admin' && asset.createdByUserId !== request.auth!.user.id) return reply.code(403).send(error('Media ownership required', 'FORBIDDEN')); return { data: output(asset, storage) }; });
  app.patch<{ Params: { id: string } }>('/manage/media/images/:id', { preHandler: guards.secured }, async (request, reply) => { const parsed = z.strictObject({ altText: z.string().trim().max(500).nullable() }).safeParse(request.body); if (!parsed.success) return reply.code(400).send(error('Invalid media update', 'VALIDATION_ERROR')); const asset = await repository.getMediaAsset(request.params.id); if (!asset) return reply.code(404).send(error('Media asset not found', 'NOT_FOUND')); if (request.auth!.user.role !== 'admin' && asset.createdByUserId !== request.auth!.user.id) return reply.code(403).send(error('Media ownership required', 'FORBIDDEN')); const updated = await repository.transaction(async (tx) => { const value = await tx.updateMediaAltText(asset.id, parsed.data.altText); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'media.updated', entityType: 'media_asset', entityId: asset.id, ...info(request) }); return value; }); return { data: output(updated, storage) }; });
  app.delete<{ Params: { id: string } }>('/manage/media/images/:id', { preHandler: guards.secured }, async (request, reply) => { const asset = await repository.getMediaAsset(request.params.id); if (!asset) return reply.code(404).send(error('Media asset not found', 'NOT_FOUND')); if (request.auth!.user.role !== 'admin' && asset.createdByUserId !== request.auth!.user.id) return reply.code(403).send(error('Media ownership required', 'FORBIDDEN')); if (await repository.mediaReferenceCount(asset.id)) return reply.code(409).send(error('Media asset is still referenced', 'MEDIA_REFERENCED')); await repository.transaction(async (tx) => { await tx.deleteMediaAsset(asset.id); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'media.deleted', entityType: 'media_asset', entityId: asset.id, ...info(request) }); }); return { data: { deleted: true } }; });
}
