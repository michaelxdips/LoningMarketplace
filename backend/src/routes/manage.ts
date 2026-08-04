import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { canArchiveProduct, canManageMedia, canManageUMKMLocation, canRestoreProduct, canUpdateProduct, canUpdateUMKM, canViewProduct, canViewUMKM, hasCapability } from '../auth/policy.js';
import type { PublicationStatus, Repository } from '../db/repository.js';
import type { ReturnTypeGuards } from './types.js';
import { error, hasOneImageSource, productInput, umkmInput, uuid } from './validation.js';
import { isValidIndonesianWhatsAppNumber } from '../domain/phone.js';
import { normalizeCoordinates } from '../domain/location.js';

const locationInput = z.strictObject({ latitude: z.number(), longitude: z.number() });
const query = z.object({ q: z.string().trim().optional(), category: z.enum(['Kuliner', 'Kerajinan', 'Jasa', 'Sembako', 'Pertanian']).optional(), publicationStatus: z.enum(['draft', 'published', 'archived']).optional(), ownerUserId: uuid.optional(), umkmId: uuid.optional(), isAvailable: z.enum(['true', 'false']).transform((value) => value === 'true').optional(), limit: z.coerce.number().int().positive().max(100).default(100) });
const info = (request: { ip: string; headers: Record<string, unknown> }) => ({ ipAddress: request.ip, userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined });

export async function manageRoutes(app: FastifyInstance, repository: Repository, guards: ReturnTypeGuards, now: () => Date, id: () => string) {
  const valid = (value: string, reply: FastifyReply) => {
    if (!uuid.safeParse(value).success) {
      reply.code(400).send(error('Invalid UUID', 'VALIDATION_ERROR'));
      return false;
    }
    return true;
  };
  const loadUMKM = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!valid(request.params.id, reply)) return;
    const item = await repository.getManagedUMKM(request.params.id);
    if (!item) return reply.code(404).send(error('UMKM not found', 'NOT_FOUND'));
    return item;
  };
  const loadProduct = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!valid(request.params.id, reply)) return;
    const item = await repository.getManagedProduct(request.params.id);
    if (!item) return reply.code(404).send(error('Product not found', 'NOT_FOUND'));
    return item;
  };
  const denyOwnership = (reply: FastifyReply, resource: 'UMKM' | 'Product') => reply.code(403).send(error(`${resource} ownership required`, 'FORBIDDEN'));
  const validateImage = async (request: FastifyRequest, value: { imageUrl?: string | null; imageAssetId?: string | null }, required: boolean) => {
    if (required && !hasOneImageSource(value)) return 'Exactly one imageUrl or imageAssetId is required';
    if (!required && (value.imageUrl !== undefined || value.imageAssetId !== undefined) && !hasOneImageSource(value)) return 'At least one imageUrl or imageAssetId must be provided';
    if (value.imageAssetId) {
      const asset = await repository.getMediaAsset(value.imageAssetId);
      if (!asset) return 'Media asset not found';
      if (!canManageMedia(request.auth!.user.role, request.auth!.user.id, asset.createdByUserId)) return 'Media asset ownership required';
    }
    return undefined;
  };

  app.get('/manage/umkms', { preHandler: [guards.authenticate, guards.requireAnyCapability(['umkms:view-all', 'umkms:view-own'])] }, async (request, reply) => {
    const parsed = query.pick({ q: true, category: true, publicationStatus: true, ownerUserId: true, limit: true }).safeParse(request.query);
    if (!parsed.success || (parsed.data.ownerUserId && !hasCapability(request.auth!.user.role, 'umkms:view-all'))) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR'));
    return { data: await repository.listManagedUMKMs(request.auth!.user, parsed.data) };
  });
  app.get<{ Params: { id: string } }>('/manage/umkms/:id', { preHandler: [guards.authenticate, guards.requireAnyCapability(['umkms:view-all', 'umkms:view-own'])] }, async (request, reply) => {
    const item = await loadUMKM(request, reply);
    if (!item || reply.sent) return;
    if (!canViewUMKM(request.auth!.user.role, request.auth!.user.id, item.ownerUserId)) return denyOwnership(reply, 'UMKM');
    return { data: item };
  });
  app.post('/manage/umkms', { preHandler: [guards.authenticate, guards.origin, guards.csrf, guards.requireCapability('umkms:create')] }, async (request, reply) => {
    const parsed = umkmInput.extend({ ownerUserId: uuid.nullable().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(error('Invalid UMKM payload', 'VALIDATION_ERROR'));
    const { ownerUserId = null, ...value } = parsed.data;
    if (ownerUserId && !hasCapability(request.auth!.user.role, 'umkms:assign-owner')) return reply.code(403).send(error('Owner assignment is not assigned', 'FORBIDDEN'));
    const imageError = await validateImage(request, value, true);
    if (imageError) return reply.code(400).send(error(imageError, 'MEDIA_SOURCE_INVALID'));
    if (ownerUserId) {
      const owner = await repository.findUserById(ownerUserId);
      if (!owner || owner.role !== 'pelaku_umkm' || !owner.isActive) return reply.code(400).send(error('Invalid owner assignment', 'VALIDATION_ERROR'));
    }
    const item = await repository.transaction(async (transaction) => {
      const created = await transaction.createUMKM(id(), value, ownerUserId);
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'umkm.created', entityType: 'umkm', entityId: created.id, ...info(request) });
      return created;
    });
    return reply.code(201).send({ data: item });
  });
  app.patch<{ Params: { id: string } }>('/manage/umkms/:id', { preHandler: guards.secured }, async (request, reply) => {
    const existing = await loadUMKM(request, reply);
    if (!existing || reply.sent) return;
    if (!canUpdateUMKM(request.auth!.user.role, request.auth!.user.id, existing.ownerUserId)) return denyOwnership(reply, 'UMKM');
    const parsed = umkmInput.partial().extend({ ownerUserId: uuid.nullable().optional() }).safeParse(request.body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) return reply.code(400).send(error('Invalid UMKM update', 'VALIDATION_ERROR'));
    if (parsed.data.ownerUserId !== undefined && !hasCapability(request.auth!.user.role, 'umkms:assign-owner')) return reply.code(403).send(error('Owner assignment is not assigned', 'FORBIDDEN'));
    const imageError = await validateImage(request, parsed.data, false);
    if (imageError) return reply.code(400).send(error(imageError, 'MEDIA_SOURCE_INVALID'));
    const ownerUserId = parsed.data.ownerUserId;
    if (ownerUserId) {
      const owner = await repository.findUserById(ownerUserId);
      if (!owner || owner.role !== 'pelaku_umkm' || !owner.isActive) return reply.code(400).send(error('Invalid owner assignment', 'VALIDATION_ERROR'));
    }
    const { ownerUserId: _ownerUserId, ...values } = parsed.data;
    return repository.transaction(async (transaction) => {
      const item = await transaction.updateUMKM(request.params.id, values);
      if (ownerUserId !== undefined) await transaction.assignUMKMOwner(request.params.id, ownerUserId);
      await transaction.refreshMediaOrphans([existing.imageAssetId, item.imageAssetId], now());
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'umkm.updated', entityType: 'umkm', entityId: item.id, ...info(request) });
      return { data: { ...item, ...(ownerUserId !== undefined ? { ownerUserId } : {}) } };
    });
  });
  app.post<{ Params: { id: string } }>('/manage/umkms/:id/verify-contact', { preHandler: guards.secured }, async (request, reply) => {
    const existing = await loadUMKM(request, reply);
    if (!existing || reply.sent) return;
    if (!canUpdateUMKM(request.auth!.user.role, request.auth!.user.id, existing.ownerUserId)) return denyOwnership(reply, 'UMKM');
    if (!isValidIndonesianWhatsAppNumber(existing.phone)) return reply.code(409).send(error('Cannot verify an invalid contact', 'CONTACT_INVALID'));
    return repository.transaction(async (transaction) => {
      const item = await transaction.verifyUMKMContact(request.params.id, now());
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'umkm.contact_verified', entityType: 'umkm', entityId: item.id, ...info(request) });
      return { data: item };
    });
  });
  for (const [path, status, capability, action] of [['publish', 'published', 'umkms:publish', 'umkm.published'], ['unpublish', 'draft', 'umkms:publish', 'umkm.unpublished'], ['archive', 'archived', 'umkms:archive', 'umkm.archived'], ['restore', 'draft', 'umkms:restore', 'umkm.restored']] as const) {
    app.post<{ Params: { id: string } }>(`/manage/umkms/:id/${path}`, { preHandler: guards.secured }, async (request, reply) => {
      if (!hasCapability(request.auth!.user.role, capability)) return reply.code(403).send(error('Capability is not assigned to this role', 'FORBIDDEN'));
      const existing = await loadUMKM(request, reply);
      if (!existing || reply.sent) return;
      if (!canViewUMKM(request.auth!.user.role, request.auth!.user.id, existing.ownerUserId)) return denyOwnership(reply, 'UMKM');
      if (status === 'published' && !isValidIndonesianWhatsAppNumber(existing.phone)) return reply.code(409).send(error('UMKM requires a valid WhatsApp contact before publication', 'CONTACT_INVALID'));
      return repository.transaction(async (transaction) => {
        const item = await transaction.setUMKMPublication(request.params.id, status, now());
        await transaction.addAudit({ actorUserId: request.auth!.user.id, action, entityType: 'umkm', entityId: item.id, ...info(request) });
        return { data: item };
      });
    });
  }
  app.delete<{ Params: { id: string } }>('/manage/umkms/:id', { preHandler: guards.secured }, async (request, reply) => {
    if (!hasCapability(request.auth!.user.role, 'umkms:archive')) return reply.code(403).send(error('Capability is not assigned to this role', 'FORBIDDEN'));
    const existing = await loadUMKM(request, reply);
    if (!existing || reply.sent) return;
    if (!canViewUMKM(request.auth!.user.role, request.auth!.user.id, existing.ownerUserId)) return denyOwnership(reply, 'UMKM');
    return repository.transaction(async (transaction) => {
      const item = await transaction.setUMKMPublication(request.params.id, 'archived', now());
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'umkm.archived', entityType: 'umkm', entityId: item.id, ...info(request) });
      return { data: item };
    });
  });
  for (const [method, action] of [['patch', 'umkm.location_updated'], ['delete', 'umkm.location_cleared']] as const) {
    app[method]<{ Params: { id: string } }>('/manage/umkms/:id/location', { preHandler: guards.secured }, async (request, reply) => {
      const existing = await loadUMKM(request, reply);
      if (!existing || reply.sent) return;
      if (!canManageUMKMLocation(request.auth!.user.role, request.auth!.user.id, existing.ownerUserId)) return denyOwnership(reply, 'UMKM');
      const at = now();
      if (method === 'patch') {
        const parsed = locationInput.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send(error('Invalid location payload', 'VALIDATION_ERROR'));
        const coordinates = normalizeCoordinates(parsed.data.latitude, parsed.data.longitude);
        if (!coordinates) return reply.code(400).send(error('Coordinates are out of range', 'VALIDATION_ERROR'));
        return repository.transaction(async (transaction) => {
          const item = await transaction.updateUMKMLocation(request.params.id, coordinates, at);
          await transaction.addAudit({ actorUserId: request.auth!.user.id, action, entityType: 'umkm', entityId: request.params.id, ...info(request) });
          return { data: item };
        });
      }
      return repository.transaction(async (transaction) => {
        const item = await transaction.clearUMKMLocation(request.params.id, at);
        await transaction.addAudit({ actorUserId: request.auth!.user.id, action, entityType: 'umkm', entityId: request.params.id, ...info(request) });
        return { data: item };
      });
    });
  }

  app.get('/manage/products', { preHandler: [guards.authenticate, guards.requireAnyCapability(['products:view-all', 'products:view-own'])] }, async (request, reply) => {
    const parsed = query.pick({ q: true, category: true, publicationStatus: true, umkmId: true, isAvailable: true, limit: true }).safeParse(request.query);
    if (!parsed.success) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR'));
    return { data: await repository.listManagedProducts(request.auth!.user, parsed.data) };
  });
  app.get<{ Params: { id: string } }>('/manage/products/:id', { preHandler: [guards.authenticate, guards.requireAnyCapability(['products:view-all', 'products:view-own'])] }, async (request, reply) => {
    const item = await loadProduct(request, reply);
    if (!item || reply.sent) return;
    if (!canViewProduct(request.auth!.user.role, request.auth!.user.id, item.umkm.ownerUserId)) return denyOwnership(reply, 'Product');
    return { data: { ...item.product, umkmName: item.umkm.name } };
  });
  app.post('/manage/products', { preHandler: [guards.authenticate, guards.origin, guards.csrf, guards.requireCapability('products:create')] }, async (request, reply) => {
    const parsed = productInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(error('Invalid product payload', 'VALIDATION_ERROR'));
    const imageError = await validateImage(request, parsed.data, true);
    if (imageError) return reply.code(400).send(error(imageError, 'MEDIA_SOURCE_INVALID'));
    const parent = await repository.getManagedUMKM(parsed.data.umkmId);
    if (!parent) return reply.code(404).send(error('UMKM not found', 'NOT_FOUND'));
    if (!canViewUMKM(request.auth!.user.role, request.auth!.user.id, parent.ownerUserId)) return denyOwnership(reply, 'UMKM');
    if (parent.publicationStatus === 'archived') return reply.code(409).send(error('Cannot create a product under an archived UMKM', 'PARENT_ARCHIVED'));
    const item = await repository.transaction(async (transaction) => {
      const created = await transaction.createProduct(id(), parsed.data);
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'product.created', entityType: 'product', entityId: created.id, ...info(request) });
      return created;
    });
    return reply.code(201).send({ data: item });
  });
  app.patch<{ Params: { id: string } }>('/manage/products/:id', { preHandler: guards.secured }, async (request, reply) => {
    const existing = await loadProduct(request, reply);
    if (!existing || reply.sent) return;
    if (!canUpdateProduct(request.auth!.user.role, request.auth!.user.id, existing.umkm.ownerUserId)) return denyOwnership(reply, 'Product');
    const parsed = productInput.partial().safeParse(request.body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) return reply.code(400).send(error('Invalid product update', 'VALIDATION_ERROR'));
    const imageError = await validateImage(request, parsed.data, false);
    if (imageError) return reply.code(400).send(error(imageError, 'MEDIA_SOURCE_INVALID'));
    const { umkmId, ...values } = parsed.data;
    if (umkmId && umkmId !== existing.product.umkmId) {
      if (!hasCapability(request.auth!.user.role, 'products:transfer-owner')) return reply.code(403).send(error('Product transfer is not assigned', 'FORBIDDEN'));
      const parent = await repository.getManagedUMKM(umkmId);
      if (!parent || !canViewUMKM(request.auth!.user.role, request.auth!.user.id, parent.ownerUserId)) return reply.code(403).send(error('Cannot move product to that UMKM', 'FORBIDDEN'));
    }
    return repository.transaction(async (transaction) => {
      if (umkmId && umkmId !== existing.product.umkmId) await transaction.moveProduct(request.params.id, umkmId);
      const item = await transaction.updateProduct(request.params.id, values);
      await transaction.refreshMediaOrphans([existing.product.imageAssetId, item.imageAssetId], now());
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'product.updated', entityType: 'product', entityId: item.id, ...info(request) });
      return { data: { ...item, umkmId: umkmId ?? item.umkmId } };
    });
  });
  for (const [path, status, action] of [['publish', 'published', 'product.published'], ['unpublish', 'draft', 'product.unpublished'], ['archive', 'archived', 'product.archived'], ['restore', 'draft', 'product.restored']] as const) {
    app.post<{ Params: { id: string } }>(`/manage/products/:id/${path}`, { preHandler: guards.secured }, async (request, reply) => {
      const existing = await loadProduct(request, reply);
      if (!existing || reply.sent) return;
      const ownerId = existing.umkm.ownerUserId;
      const allowed = path === 'publish' || path === 'unpublish'
        ? hasCapability(request.auth!.user.role, 'products:publish') && canViewProduct(request.auth!.user.role, request.auth!.user.id, ownerId)
        : path === 'archive'
          ? canArchiveProduct(request.auth!.user.role, request.auth!.user.id, ownerId)
          : canRestoreProduct(request.auth!.user.role, request.auth!.user.id, ownerId);
      if (!allowed) return denyOwnership(reply, 'Product');
      if (status === 'published' && existing.umkm.publicationStatus !== 'published') return reply.code(409).send(error('Product parent must be published', 'PARENT_NOT_PUBLISHED'));
      return repository.transaction(async (transaction) => {
        const item = await transaction.setProductPublication(request.params.id, status as PublicationStatus, now());
        await transaction.addAudit({ actorUserId: request.auth!.user.id, action, entityType: 'product', entityId: item.id, ...info(request) });
        return { data: item };
      });
    });
  }
  app.delete<{ Params: { id: string } }>('/manage/products/:id', { preHandler: guards.secured }, async (request, reply) => {
    const existing = await loadProduct(request, reply);
    if (!existing || reply.sent) return;
    if (!canArchiveProduct(request.auth!.user.role, request.auth!.user.id, existing.umkm.ownerUserId)) return denyOwnership(reply, 'Product');
    return repository.transaction(async (transaction) => {
      const item = await transaction.setProductPublication(request.params.id, 'archived', now());
      await transaction.addAudit({ actorUserId: request.auth!.user.id, action: 'product.archived', entityType: 'product', entityId: item.id, ...info(request) });
      return { data: item };
    });
  });
}
