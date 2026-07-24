import type { QueryClient } from '@tanstack/react-query';
import { apiRequest } from './api';

export type UserRole = 'superadmin' | 'admin' | 'perangkat_desa' | 'pelaku_umkm';
export type SupportedUserRole = 'admin' | 'pelaku_umkm';
export type Capability = 'accessDashboard' | 'manageOwnUmkms' | 'manageAllUmkms' | 'manageUsers' | 'viewAuditLogs' | 'viewInquiryAnalytics' | 'verifyOwnContact' | 'verifyAnyContact' | 'revokeSessions' | 'resetPasswords';
const capabilities: Record<UserRole, readonly Capability[]> = {
  admin: ['accessDashboard', 'manageOwnUmkms', 'manageAllUmkms', 'manageUsers', 'viewAuditLogs', 'viewInquiryAnalytics', 'verifyOwnContact', 'verifyAnyContact', 'revokeSessions', 'resetPasswords'],
  pelaku_umkm: ['accessDashboard', 'manageOwnUmkms', 'verifyOwnContact'],
  superadmin: [],
  perangkat_desa: [],
};
export const hasCapability = (role: UserRole, capability: Capability) => capabilities[role].includes(capability);
export const isSupportedUserRole = (role: UserRole): role is SupportedUserRole => role === 'admin' || role === 'pelaku_umkm';
export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}
export interface Session { user: SessionUser; csrfToken: string; expiresAt?: string }
export interface PasswordChanged { passwordChanged: true }

export const sessionKey = ['auth', 'session'] as const;
export const csrfKey = ['auth', 'csrf'] as const;

export function rememberSession(queryClient: QueryClient, session: Session | null) {
  queryClient.setQueryData(sessionKey, session);
  queryClient.setQueryData(csrfKey, session?.csrfToken ?? null);
}

export const authApi = {
  session: () => apiRequest<Session>('/auth/session', { skipUnauthorizedHandler: true }),
  login: (input: { identifier: string; password: string }) => apiRequest<Session>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: (csrfToken?: string) => apiRequest<void>('/auth/logout', { method: 'POST', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined }),
  changePassword: (input: { currentPassword: string; newPassword: string }, csrfToken?: string) => apiRequest<PasswordChanged>('/auth/change-password', { method: 'POST', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined, body: JSON.stringify(input) }),
};
