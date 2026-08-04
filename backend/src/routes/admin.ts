import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { canCreateUserRole, canManageUserTarget, hasCapability, passwordSetterSchema, roleLabel, userRoleSchema, usernameSchema } from '../auth/policy.js';
import type { Security } from '../auth/security.js';
import type { Repository } from '../db/repository.js';
import type { ReturnTypeGuards } from './types.js';
import { error, uuid } from './validation.js';

const createSchema = z.strictObject({ email: z.string().trim().toLowerCase().email(), username: usernameSchema, displayName: z.string().trim().min(1).max(200), temporaryPassword: passwordSetterSchema, role: userRoleSchema });
const updateSchema = z.strictObject({ username: usernameSchema.optional(), displayName: z.string().trim().min(1).max(200).optional(), role: userRoleSchema.optional(), isActive: z.boolean().optional() }).refine((v) => Object.keys(v).length > 0);
const requestInfo = (r: { ip: string; headers: Record<string, unknown> }) => ({ ipAddress: r.ip, userAgent: typeof r.headers['user-agent'] === 'string' ? r.headers['user-agent'] : undefined });

export async function adminRoutes(app: FastifyInstance, repository: Repository, guards: ReturnTypeGuards, crypto: Security, now: () => Date) {
  app.get('/admin/users', { preHandler: [guards.authenticate, guards.requireCapability('users:view')] }, async (request, reply) => {
    const p = z.object({ q: z.string().trim().optional(), role: userRoleSchema.optional(), isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(), limit: z.coerce.number().int().positive().max(100).default(100) }).safeParse(request.query);
    if (!p.success) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR'));
    return { data: (await repository.listUsers(p.data, request.auth!.user.role)).map((user) => ({ ...user, roleLabel: roleLabel(user.role) })) };
  });
  app.post('/admin/users', { preHandler: [guards.authenticate, guards.origin, guards.csrf, guards.requireAnyCapability(['users:create-superadmin', 'users:create-admin', 'users:create-perangkat-desa', 'users:create-pelaku-umkm'])] }, async (request, reply) => {
    const p = createSchema.safeParse(request.body); if (!p.success) return reply.code(400).send(error('Invalid user payload', 'VALIDATION_ERROR'));
    if (!canCreateUserRole(request.auth!.user.role, p.data.role)) return reply.code(403).send(error('Target role is not assignable', 'FORBIDDEN'));
    if (await repository.findUserByEmail(p.data.email)) return reply.code(409).send(error('Email sudah digunakan.', 'CONFLICT'));
    if (await repository.findUserByUsername(p.data.username)) return reply.code(409).send(error('Username sudah digunakan.', 'CONFLICT'));
    const { temporaryPassword, ...v } = p.data, passwordHash = await crypto.hashPassword(temporaryPassword);
    const item = await repository.transaction(async (tx) => { const created = await tx.createUser({ ...v, passwordHash, mustChangePassword: true }); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'user.created', entityType: 'user', entityId: created.id, ...requestInfo(request) }); return created; });
    return reply.code(201).send({ data: { ...item, roleLabel: roleLabel(item.role) } });
  });
  app.patch<{ Params: { id: string } }>('/admin/users/:id', { preHandler: [guards.authenticate, guards.origin, guards.csrf, guards.requireCapability('users:update')] }, async (request, reply) => {
    const id = uuid.safeParse(request.params.id), p = updateSchema.safeParse(request.body); if (!id.success || !p.success) return reply.code(400).send(error('Invalid user update', 'VALIDATION_ERROR'));
    const current = await repository.findUserById(id.data); if (!current) return reply.code(404).send(error('User not found', 'NOT_FOUND'));
    if (!canManageUserTarget(request.auth!.user.role, current.role)) return reply.code(403).send(error('User management is not assigned for this target', 'FORBIDDEN'));
    if (p.data.role !== undefined) {
      if (id.data === request.auth!.user.id) return reply.code(403).send(error('Users cannot change their own role', 'FORBIDDEN'));
      if (!canCreateUserRole(request.auth!.user.role, p.data.role)) return reply.code(403).send(error('Target role is not assignable', 'FORBIDDEN'));
      if (!hasCapability(request.auth!.user.role, 'users:change-role')) return reply.code(403).send(error('Role changes are not assigned', 'FORBIDDEN'));
    }
    if (p.data.isActive === false && !hasCapability(request.auth!.user.role, 'users:disable')) return reply.code(403).send(error('Account disabling is not assigned', 'FORBIDDEN'));
    if (p.data.username) { const duplicate = await repository.findUserByUsername(p.data.username); if (duplicate && duplicate.id !== id.data) return reply.code(409).send(error('Username sudah digunakan.', 'CONFLICT')); }
    const demotesSuperadmin = current.role === 'superadmin' && current.isActive && ((p.data.role !== undefined && p.data.role !== 'superadmin') || p.data.isActive === false);
    if (demotesSuperadmin && await repository.countActiveSuperadmins() <= 1) return reply.code(409).send(error('The last active Super Admin cannot be removed', 'LAST_SUPERADMIN'));
    const demotesAdmin = current.role === 'admin' && current.isActive && ((p.data.role !== undefined && p.data.role !== 'admin') || p.data.isActive === false);
    if (demotesAdmin && await repository.countActiveAdmins() <= 1) return reply.code(409).send(error('The last active admin cannot be removed', 'LAST_ADMIN'));
    const shouldRevoke = p.data.isActive === false || (p.data.role !== undefined && p.data.role !== current.role);
    const item = await repository.transaction(async (tx) => { const updated = await tx.updateUser(id.data, p.data); if (shouldRevoke) await tx.revokeUserSessions(id.data, now()); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'user.updated', entityType: 'user', entityId: id.data, metadata: { fields: Object.keys(p.data) }, ...requestInfo(request) }); return updated; });
    return { data: item && { ...item, roleLabel: roleLabel(item.role) } };
  });
  app.post<{ Params: { id: string } }>('/admin/users/:id/reset-password', { preHandler: [guards.authenticate, guards.origin, guards.csrf, guards.requireCapability('users:reset-password')] }, async (request, reply) => {
    const id = uuid.safeParse(request.params.id), p = z.strictObject({ temporaryPassword: passwordSetterSchema }).safeParse(request.body); if (!id.success || !p.success) return reply.code(400).send(error('Kata sandi minimal 8 karakter.', 'VALIDATION_ERROR'));
    const target = await repository.findUserById(id.data); if (!target) return reply.code(404).send(error('User not found', 'NOT_FOUND'));
    if (!canManageUserTarget(request.auth!.user.role, target.role)) return reply.code(403).send(error('User management is not assigned for this target', 'FORBIDDEN'));
    const at = now(), hash = await crypto.hashPassword(p.data.temporaryPassword); await repository.transaction(async (tx) => { await tx.updateUser(id.data, { passwordHash: hash, mustChangePassword: true }); await tx.revokeUserSessions(id.data, at); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'user.password_reset', entityType: 'user', entityId: id.data, ...requestInfo(request) }); }); return { data: { passwordReset: true } };
  });
  app.post<{ Params: { id: string } }>('/admin/users/:id/revoke-sessions', { preHandler: [guards.authenticate, guards.origin, guards.csrf, guards.requireCapability('users:revoke-sessions')] }, async (request, reply) => {
    const id = uuid.safeParse(request.params.id); if (!id.success) return reply.code(400).send(error('Invalid UUID', 'VALIDATION_ERROR'));
    const target = await repository.findUserById(id.data); if (!target) return reply.code(404).send(error('User not found', 'NOT_FOUND'));
    if (!canManageUserTarget(request.auth!.user.role, target.role)) return reply.code(403).send(error('User management is not assigned for this target', 'FORBIDDEN'));
    await repository.transaction(async (tx) => { await tx.revokeUserSessions(id.data, now()); await tx.addAudit({ actorUserId: request.auth!.user.id, action: 'user.sessions_revoked', entityType: 'user', entityId: id.data, ...requestInfo(request) }); }); return { data: { sessionsRevoked: true } };
  });
  app.get('/admin/audit-logs', { preHandler: [guards.authenticate, guards.requireCapability('audit:view-global')] }, async (request, reply) => {
    const p = z.object({ q: z.string().trim().optional(), limit: z.coerce.number().int().positive().max(200).default(100), actorUserId: uuid.optional(), action: z.string().trim().min(1).optional(), entityType: z.string().trim().min(1).optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional() }).safeParse(request.query);
    if (!p.success) return reply.code(400).send(error('Invalid query parameters', 'VALIDATION_ERROR'));
    return { data: await repository.listAuditLogs(p.data) };
  });
}
