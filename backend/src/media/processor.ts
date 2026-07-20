import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { Metadata } from 'sharp';
import type { MediaConfig } from '../config/env.js';

export class MediaProcessingError extends Error { constructor(message: string, readonly code: string, readonly statusCode = 400) { super(message); } }
export type ProcessedImage = { card: Buffer; thumb: Buffer; width: number; height: number; cardWidth: number; cardHeight: number; thumbWidth: number; thumbHeight: number; checksum: string; sourceBytes: number; originalMimeType: string; outputMimeType: 'image/webp' };

export async function processImage(input: Buffer, config: Pick<MediaConfig, 'MEDIA_MAX_BYTES' | 'MEDIA_MAX_WIDTH' | 'MEDIA_MAX_HEIGHT' | 'MEDIA_MAX_PIXELS'>): Promise<ProcessedImage> {
  if (!input.length || input.length > config.MEDIA_MAX_BYTES) throw new MediaProcessingError('Image exceeds the upload size limit', 'MEDIA_TOO_LARGE', 413);
  if (/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s/>]/i.test(input.toString('utf8', 0, Math.min(input.length, 512)))) throw new MediaProcessingError('Only JPEG, PNG, and WebP images are supported', 'MEDIA_UNSUPPORTED');
  let metadata: Metadata;
  try { metadata = await sharp(input, { animated: true, failOn: 'error', limitInputPixels: config.MEDIA_MAX_PIXELS }).metadata(); } catch { throw new MediaProcessingError('Image is corrupt or unsupported', 'MEDIA_INVALID'); }
  if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) throw new MediaProcessingError('Only JPEG, PNG, and WebP images are supported', 'MEDIA_UNSUPPORTED');
  if ((metadata.pages ?? 1) > 1) throw new MediaProcessingError('Animated images are not supported', 'MEDIA_ANIMATED');
  if (!metadata.width || !metadata.height || metadata.width > config.MEDIA_MAX_WIDTH || metadata.height > config.MEDIA_MAX_HEIGHT || metadata.width * metadata.height > config.MEDIA_MAX_PIXELS) throw new MediaProcessingError('Image dimensions exceed the configured limit', 'MEDIA_DIMENSIONS');
  try {
    const oriented = sharp(input, { failOn: 'error', limitInputPixels: config.MEDIA_MAX_PIXELS }).autoOrient();
    const cardInfo = await oriented.clone().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const thumbInfo = await oriented.clone().resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
    return { card: cardInfo.data, thumb: thumbInfo.data, width: metadata.width, height: metadata.height, cardWidth: cardInfo.info.width, cardHeight: cardInfo.info.height, thumbWidth: thumbInfo.info.width, thumbHeight: thumbInfo.info.height, checksum: createHash('sha256').update(input).digest('hex'), sourceBytes: input.length, originalMimeType: `image/${metadata.format === 'jpeg' ? 'jpeg' : metadata.format}`, outputMimeType: 'image/webp' };
  } catch { throw new MediaProcessingError('Image is corrupt or unsupported', 'MEDIA_INVALID'); }
}
