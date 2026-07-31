import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { categories, type Repository } from '../db/repository.js';

const querySchema = z.object({ category: z.enum(categories).optional(), q: z.string().trim().max(80).optional(), umkmId: z.string().uuid().optional(), limit: z.coerce.number().int().positive().max(100).default(100) });
const identifierSchema = z.string().min(1).max(128);
const relatedQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(4).default(4) });
const error = (message: string, code: string) => ({ error: { message, code } });
export async function productRoutes(app: FastifyInstance, repository: Repository) {
  app.get('/products', async (request, reply) => { const parsed = querySchema.safeParse(request.query); if (!parsed.success) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR')); return { data: await repository.listProducts({ ...parsed.data, q: parsed.data.q || undefined }) }; });
  app.get<{ Params: { id: string } }>('/products/:id/related', async (request, reply) => { const identifier = identifierSchema.safeParse(request.params.id); const parsed = relatedQuerySchema.safeParse(request.query); if (!identifier.success || !parsed.success) return reply.code(400).send(error('Invalid related product parameters', 'VALIDATION_ERROR')); const related = await repository.listRelatedProducts(request.params.id, parsed.data.limit); return related ? { data: related } : reply.code(404).send(error('Product not found', 'NOT_FOUND')); });
  app.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => { const parsed = identifierSchema.safeParse(request.params.id); if (!parsed.success) return reply.code(400).send(error('Invalid public identifier', 'VALIDATION_ERROR')); const item = await repository.getProduct(request.params.id); if (!item) return reply.code(404).send(error('Product not found', 'NOT_FOUND')); const product = item.product; return { data: { id: product.id, slug: product.slug, umkmId: product.umkmId, name: product.name, price: product.price, description: product.description, category: product.category, imageUrl: product.imageUrl, ...(product.imageAsset ? { imageAsset: product.imageAsset } : {}), isAvailable: product.isAvailable, ...(product.unit ? { unit: product.unit } : {}), umkm: item.umkm } }; });
}
