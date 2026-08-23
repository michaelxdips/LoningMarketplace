import type { QueryClient } from '@tanstack/react-query';
import { apiRequest } from './api';

export type UserRole = 'superadmin' | 'admin' | 'perangkat_desa' | 'pelaku_umkm';
/** Capabilities are serialized by the backend policy; the client never derives them from roles. */
export type Capability = string;
export interface UserRoleOption { value: UserRole; label: string }
export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  capabilities: readonly Capability[];
  assignableUserRoles: readonly UserRole[];
  manageableUserRoles: readonly UserRole[];
  assignableUserRoleOptions: readonly UserRoleOption[];
  manageableUserRoleOptions: readonly UserRoleOption[];
  isActive: boolean;
  mustChangePassword: boolean;
}
export interface Session { user: SessionUser; sessionToken?: string; csrfToken: string; expiresAt?: string }
export interface PasswordChanged { passwordChanged: true }

export const hasCapability = (user: Pick<SessionUser, 'capabilities'>, capability: Capability) => user.capabilities.includes(capability);
export const canManageUser = (actor: SessionUser, target: Pick<SessionUser, 'role'>) => hasCapability(actor, 'users:update') && actor.manageableUserRoles.includes(target.role);
export const sessionKey = ['auth', 'session'] as const;
export const csrfKey = ['auth', 'csrf'] as const;

export function rememberSession(queryClient: QueryClient, session: Session | null) {
  if (session === null) {
    try { localStorage.removeItem('loning_session_token'); } catch { /* ignore */ }
  } else if (session.sessionToken) {
    // Persist token for cross-site environments where cookies may be blocked (e.g. iOS Safari ITP).
    // Backend authenticate guard accepts Authorization: Bearer as fallback when cookie is absent.
    try { localStorage.setItem('loning_session_token', session.sessionToken); } catch { /* ignore */ }
  }
  queryClient.setQueryData(sessionKey, session);
  queryClient.setQueryData(csrfKey, session?.csrfToken ?? null);
}

export const authApi = {
  session: () => apiRequest<Session>('/auth/session', { skipUnauthorizedHandler: true }),
  login: (input: { identifier: string; password: string }) => apiRequest<Session>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: (csrfToken?: string) => apiRequest<void>('/auth/logout', { method: 'POST', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined }),
  changePassword: (input: { currentPassword: string; newPassword: string }, csrfToken?: string) => apiRequest<PasswordChanged>('/auth/change-password', { method: 'POST', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined, body: JSON.stringify(input) }),
};
