import type { FastifyInstance } from 'fastify';
import type { Repository } from '../db/repository.js';
export async function healthRoutes(app: FastifyInstance, repository: Repository) { app.get('/health', async () => ({ status: 'ok' })); app.get('/ready', async (_request, reply) => { try { await Promise.race([repository.ready(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))]); return { status: 'ok' }; } catch { return reply.code(503).send({ error: { message: 'Database unavailable', code: 'NOT_READY' } }); } }); }
