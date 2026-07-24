import { z } from 'zod';

export const USER_ROLES = ['superadmin', 'admin', 'perangkat_desa', 'pelaku_umkm'] as const;
export type UserRole = typeof USER_ROLES[number];
export const SUPPORTED_USER_ROLES = ['admin', 'pelaku_umkm'] as const;
export type SupportedUserRole = typeof SUPPORTED_USER_ROLES[number];
export const CAPABILITIES = ['accessDashboard', 'manageOwnUmkms', 'manageAllUmkms', 'manageUsers', 'viewAuditLogs', 'viewInquiryAnalytics', 'verifyOwnContact', 'verifyAnyContact', 'revokeSessions', 'resetPasswords'] as const;
export type Capability = typeof CAPABILITIES[number];
const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  admin: CAPABILITIES,
  pelaku_umkm: ['accessDashboard', 'manageOwnUmkms', 'verifyOwnContact'],
  superadmin: [],
  perangkat_desa: [],
};
export const hasCapability = (role: UserRole, capability: Capability) => ROLE_CAPABILITIES[role].includes(capability);
export const isSupportedUserRole = (role: UserRole): role is SupportedUserRole => (SUPPORTED_USER_ROLES as readonly UserRole[]).includes(role);
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export const userRoleSchema = z.enum(USER_ROLES);
export const assignableUserRoleSchema = z.enum(SUPPORTED_USER_ROLES);
export const passwordSetterSchema = z.string().min(PASSWORD_MIN_LENGTH, 'Kata sandi minimal 8 karakter.').max(PASSWORD_MAX_LENGTH);
export const loginPasswordSchema = z.string().min(1).max(PASSWORD_MAX_LENGTH);
export const usernameSchema = z.string().trim().toLowerCase().regex(USERNAME_PATTERN, 'Username tidak valid.');

export const normalizeUsername = (value: string) => value.trim().toLowerCase();
export const isUserRole = (value: unknown): value is UserRole => typeof value === 'string' && USER_ROLES.includes(value as UserRole);
