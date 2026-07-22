import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { categories, type Repository } from '../db/repository.js';

const querySchema = z.object({ category: z.enum(categories).optional(), q: z.string().trim().optional(), umkmId: z.string().uuid().optional(), limit: z.coerce.number().int().positive().max(100).default(100) });
const idSchema = z.string().uuid();
const error = (message: string, code: string) => ({ error: { message, code } });
export async function productRoutes(app: FastifyInstance, repository: Repository) {
  app.get('/products', async (request, reply) => { const parsed = querySchema.safeParse(request.query); if (!parsed.success) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR')); return { data: await repository.listProducts({ ...parsed.data, q: parsed.data.q || undefined }) }; });
  app.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => { const parsed = idSchema.safeParse(request.params.id); if (!parsed.success) return reply.code(400).send(error('Invalid UUID', 'VALIDATION_ERROR')); const item = await repository.getProduct(request.params.id); if (!item) return reply.code(404).send(error('Product not found', 'NOT_FOUND')); const product = item.product; return { data: { id: product.id, umkmId: product.umkmId, name: product.name, price: product.price, description: product.description, category: product.category, imageUrl: product.imageUrl, ...(product.imageAsset ? { imageAsset: product.imageAsset } : {}), isAvailable: product.isAvailable, ...(product.unit ? { unit: product.unit } : {}), umkm: item.umkm } }; });
}
