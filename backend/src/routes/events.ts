import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Repository } from '../db/repository.js';
import { error, uuid } from './validation.js';

const eventTypes = ['umkm_view', 'product_view', 'inquiry_started', 'message_copied', 'whatsapp_opened'] as const;
const sources = ['homepage_featured', 'homepage_catalog', 'umkm_detail', 'product_detail', 'search_results'] as const;
const eventInput = z.strictObject({ eventType: z.enum(eventTypes), source: z.enum(sources), anonymousSessionId: uuid, umkmId: uuid.optional(), productId: uuid.optional() });

export async function eventRoutes(app: FastifyInstance, repository: Repository, now: () => Date) {
  app.post('/events', { bodyLimit: 2_048, config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
    const parsed = eventInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(error('Invalid event payload', 'VALIDATION_ERROR'));
    const value = parsed.data;
    if (value.eventType === 'umkm_view' && (!value.umkmId || value.productId)) return reply.code(400).send(error('Invalid event target', 'TARGET_INVALID'));
    if (value.eventType === 'product_view' && !value.productId) return reply.code(400).send(error('Invalid event target', 'TARGET_INVALID'));
    if (!value.umkmId && !value.productId) return reply.code(400).send(error('Event target is required', 'TARGET_INVALID'));

    let umkmId = value.umkmId;
    if (value.productId) {
      const target = await repository.getProduct(value.productId);
      if (!target) return reply.code(404).send(error('Public event target not found', 'TARGET_NOT_PUBLIC'));
      if (umkmId && umkmId !== target.product.umkmId) return reply.code(400).send(error('Product does not belong to UMKM', 'TARGET_MISMATCH'));
      umkmId = target.product.umkmId;
    } else {
      if (!umkmId || !(await repository.getUMKM(umkmId))) return reply.code(404).send(error('Public event target not found', 'TARGET_NOT_PUBLIC'));
    }
    await repository.insertPublicEvent({ eventType: value.eventType, source: value.source, anonymousSessionId: value.anonymousSessionId, umkmId, productId: value.productId ?? null, eventVersion: 1 }, now());
    return reply.code(202).send({ data: { accepted: true } });
  });
}