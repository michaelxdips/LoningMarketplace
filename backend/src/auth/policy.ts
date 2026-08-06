import { z } from 'zod';

export const USER_ROLES = ['superadmin', 'admin', 'perangkat_desa', 'pelaku_umkm'] as const;
export type UserRole = typeof USER_ROLES[number];
export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin Desa',
  perangkat_desa: 'Perangkat Desa',
  pelaku_umkm: 'Pelaku UMKM',
};

export const CAPABILITIES = [
  'dashboard:view', 'dashboard:view-global-summary', 'dashboard:view-own-summary',
  'users:view', 'users:create-superadmin', 'users:create-admin', 'users:create-perangkat-desa', 'users:create-pelaku-umkm', 'users:update', 'users:change-role', 'users:disable', 'users:reset-password', 'users:revoke-sessions',
  'umkms:view-all', 'umkms:view-own', 'umkms:create', 'umkms:update-all', 'umkms:update-own', 'umkms:assign-owner', 'umkms:publish', 'umkms:archive', 'umkms:restore', 'umkms:delete', 'umkms:manage-location-all', 'umkms:manage-location-own',
  'products:view-all', 'products:view-own', 'products:create', 'products:update-all', 'products:update-own', 'products:publish', 'products:archive-all', 'products:archive-own', 'products:restore-all', 'products:restore-own', 'products:transfer-owner', 'products:delete',
  'media:manage-all', 'media:manage-own', 'analytics:view-global', 'audit:view-global',
] as const;
export type Capability = typeof CAPABILITIES[number];

const ALL_CAPABILITIES: readonly Capability[] = CAPABILITIES;
const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  superadmin: ALL_CAPABILITIES,
  admin: [
    'dashboard:view', 'dashboard:view-global-summary',
    'users:view', 'users:create-perangkat-desa', 'users:create-pelaku-umkm', 'users:update', 'users:change-role', 'users:disable', 'users:reset-password', 'users:revoke-sessions',
    'umkms:view-all', 'umkms:create', 'umkms:update-all', 'umkms:assign-owner', 'umkms:publish', 'umkms:archive', 'umkms:restore', 'umkms:delete', 'umkms:manage-location-all',
    'products:view-all', 'products:create', 'products:update-all', 'products:publish', 'products:archive-all', 'products:restore-all', 'products:transfer-owner', 'products:delete',
    'media:manage-all', 'analytics:view-global', 'audit:view-global',
  ],
  perangkat_desa: [
    'dashboard:view', 'dashboard:view-global-summary',
    'umkms:view-all', 'umkms:create', 'umkms:update-all', 'umkms:publish', 'umkms:archive', 'umkms:restore', 'umkms:manage-location-all',
    'products:view-all', 'products:create', 'products:update-all', 'products:publish', 'products:archive-all', 'products:restore-all',
    'media:manage-all', 'analytics:view-global',
  ],
  pelaku_umkm: [
    'dashboard:view', 'dashboard:view-own-summary',
    'umkms:view-own', 'umkms:update-own', 'umkms:manage-location-own',
    'products:view-own', 'products:create', 'products:update-own', 'products:archive-own', 'products:restore-own',
    'media:manage-own',
  ],
};

export const hasCapability = (role: UserRole, capability: Capability) => ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
export const capabilitiesForRole = (role: UserRole): readonly Capability[] => ROLE_CAPABILITIES[role] ?? [];
export const isSupportedUserRole = (role: unknown): role is UserRole => typeof role === 'string' && USER_ROLES.includes(role as UserRole);
export const roleLabel = (role: UserRole): string => ROLE_LABELS[role];

/**
 * Products are owned through their parent UMKM in V1.5. Keeping the owner id
 * explicit here lets Patch 05 add direct product ownership without changing
 * route-level authorization semantics.
 */
export function hasScopedCapability(role: UserRole, actorUserId: string, ownerUserId: string | null, allCapability: Capability, ownCapability: Capability): boolean {
  return hasCapability(role, allCapability) || (hasCapability(role, ownCapability) && ownerUserId === actorUserId);
}

export const canViewUMKM = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'umkms:view-all', 'umkms:view-own');
export const canUpdateUMKM = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'umkms:update-all', 'umkms:update-own');
export const canDeleteUMKM = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'umkms:delete', 'umkms:archive');
export const canManageUMKMLocation = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'umkms:manage-location-all', 'umkms:manage-location-own');
export const canViewProduct = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'products:view-all', 'products:view-own');
export const canUpdateProduct = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'products:update-all', 'products:update-own');
export const canArchiveProduct = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'products:archive-all', 'products:archive-own');
export const canRestoreProduct = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'products:restore-all', 'products:restore-own');
export const canDeleteProduct = (role: UserRole, actorUserId: string, ownerUserId: string | null) => hasScopedCapability(role, actorUserId, ownerUserId, 'products:delete', 'products:archive-own');
export const canManageMedia = (role: UserRole, actorUserId: string, createdByUserId: string | null) => hasScopedCapability(role, actorUserId, createdByUserId, 'media:manage-all', 'media:manage-own');

export function canCreateUserRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'superadmin') return true;
  return actorRole === 'admin' && (targetRole === 'perangkat_desa' || targetRole === 'pelaku_umkm');
}

export function canManageUserTarget(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'superadmin') return true;
  return actorRole === 'admin' && (targetRole === 'perangkat_desa' || targetRole === 'pelaku_umkm');
}

export function manageableUserRoles(actorRole: UserRole): readonly UserRole[] {
  return actorRole === 'superadmin' ? USER_ROLES : actorRole === 'admin' ? ['perangkat_desa', 'pelaku_umkm'] : [];
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export const userRoleSchema = z.enum(USER_ROLES);
export const passwordSetterSchema = z.string().min(PASSWORD_MIN_LENGTH, 'Kata sandi minimal 8 karakter.').max(PASSWORD_MAX_LENGTH);
export const loginPasswordSchema = z.string().min(1).max(PASSWORD_MAX_LENGTH);
export const usernameSchema = z.string().trim().toLowerCase().regex(USERNAME_PATTERN, 'Username tidak valid.');

export const normalizeUsername = (value: string) => value.trim().toLowerCase();
export const isUserRole = (value: unknown): value is UserRole => isSupportedUserRole(value);
