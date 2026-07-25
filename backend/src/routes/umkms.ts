import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { categories, type Repository } from '../db/repository.js';

const querySchema = z.object({ category: z.enum(categories).optional(), q: z.string().trim().optional(), limit: z.coerce.number().int().positive().max(100).default(100) });
const identifierSchema = z.string().min(1).max(128);
const error = (message: string, code: string) => ({ error: { message, code } });
export async function umkmRoutes(app: FastifyInstance, repository: Repository) {
  app.get('/umkms', async (request, reply) => { const parsed = querySchema.safeParse(request.query); if (!parsed.success) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR')); return { data: await repository.listUMKMs({ ...parsed.data, q: parsed.data.q || undefined }) }; });
  app.get<{ Params: { id: string } }>('/umkms/:id', async (request, reply) => { const parsed = identifierSchema.safeParse(request.params.id); if (!parsed.success) return reply.code(400).send(error('Invalid public identifier', 'VALIDATION_ERROR')); const item = await repository.getUMKM(request.params.id); return item ? { data: item } : reply.code(404).send(error('UMKM not found', 'NOT_FOUND')); });
}
