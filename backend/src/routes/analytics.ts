import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Repository } from '../db/repository.js';
import type { ReturnTypeGuards } from './types.js';
import { error } from './validation.js';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const query = z.strictObject({ from: date, to: date });
const parseUtcDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed : undefined;
};

export async function analyticsRoutes(app: FastifyInstance, repository: Repository, guards: ReturnTypeGuards) {
  app.get('/admin/inquiry-analytics', { preHandler: [guards.authenticate, guards.requireCapability('analytics:view-global')] }, async (request, reply) => {
    const parsed = query.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send(error('Invalid analytics date range', 'INVALID_DATE_RANGE'));
    const from = parseUtcDate(parsed.data.from), to = parseUtcDate(parsed.data.to);
    if (!from || !to || to < from) return reply.code(400).send(error('Date range must use real UTC dates with an end on or after the start', 'INVALID_DATE_RANGE'));
    const days = (to.getTime() - from.getTime()) / 86_400_000;
    if (days > 366) return reply.code(400).send(error('Date range cannot exceed 366 days', 'DATE_RANGE_TOO_LARGE'));
    const queryTo = new Date(to.getTime() + 86_400_000);
    const [summary, breakdown] = await Promise.all([repository.inquiryAnalytics(from, queryTo), repository.inquiryAnalyticsByTarget(from, queryTo)]);
    return { data: { from: from.toISOString(), to: to.toISOString(), ...summary, breakdown } };
  });
}
