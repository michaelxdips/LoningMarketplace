import type { Category, Product, UMKM } from '../types';
import type { UserRole } from './auth';
import { apiRequest } from './api';

export type PublicationStatus = 'draft' | 'published' | 'archived';
export interface ManagedUMKM extends UMKM { ownerUserId: string | null; publicationStatus: PublicationStatus; publishedAt?: string | null; archivedAt?: string | null; createdAt?: string; updatedAt?: string }
export interface ManagedProduct extends Product { publicationStatus: PublicationStatus; publishedAt?: string | null; archivedAt?: string | null; createdAt?: string; updatedAt?: string }
export interface ManagedUser { id: string; username: string; displayName: string; email?: string; role: UserRole; isActive: boolean; mustChangePassword: boolean; createdAt?: string; updatedAt?: string }
export interface AuditLog { id: string; action: string; entityType: string; entityId?: string | null; actor?: { id: string; displayName: string } | null; metadata?: Record<string, unknown>; createdAt: string }
export type InquiryEventType = 'umkm_view' | 'product_view' | 'inquiry_started' | 'message_copied' | 'whatsapp_opened';
export interface InquiryAnalytics { from: string; to: string; totals: Record<InquiryEventType, number>; inquiryStartRate: number; whatsappOpenRate: number; breakdown: Array<{ umkmId: string | null; umkmName: string | null; productId: string | null; productName: string | null; eventType: InquiryEventType; count: number }> }
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }
export interface ListParams { q?: string; category?: Category; publicationStatus?: PublicationStatus; ownerUserId?: string; umkmId?: string; isAvailable?: boolean; role?: UserRole; isActive?: boolean; limit?: number }
export interface UMKMInput { name: string; owner: string; description: string; phone: string; category: Category; imageUrl: string | null; imageAssetId: string | null; address: string; workingHours?: string; ownerUserId?: string | null }
export interface ProductCreateInput { umkmId: string; name: string; price: number | null; description: string; category: Category; imageUrl: string | null; imageAssetId: string | null; isAvailable: boolean; unit?: string }
export type ProductUpdateInput = Partial<ProductCreateInput>;
export interface UserCreateInput { displayName: string; email: string; username: string; role: UserRole; temporaryPassword: string }
export interface UserUpdateInput { id: string; input: { username?: string; displayName?: string; role?: UserRole; isActive?: boolean } }

const pathWithQuery = (path: string, params: ListParams | { search?: string; page?: number; pageSize?: number }) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
  return `${path}${query.size ? `?${query}` : ''}`;
};
const mutation = <T>(path: string, csrf: string | undefined, method = 'POST', body?: unknown) => apiRequest<T>(path, { method, headers: { 'X-CSRF-Token': csrf ?? '' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

const managedResource = <T, C, U>(path: string) => ({
  list: (params: ListParams, signal?: AbortSignal) => apiRequest<Page<T> | T[]>(pathWithQuery(path, params), { signal }),
  get: (id: string, signal?: AbortSignal) => apiRequest<T>(`${path}/${id}`, { signal }),
  create: (input: C, csrf?: string) => mutation<T>(path, csrf, 'POST', input),
  update: (id: string, input: U, csrf?: string) => mutation<T>(`${path}/${id}`, csrf, 'PATCH', input),
  archive: (id: string, csrf?: string) => mutation<void>(`${path}/${id}`, csrf, 'DELETE'),
  restore: (id: string, csrf?: string) => mutation<T>(`${path}/${id}/restore`, csrf),
  publish: (id: string, csrf?: string) => mutation<T>(`${path}/${id}/publish`, csrf),
  unpublish: (id: string, csrf?: string) => mutation<T>(`${path}/${id}/unpublish`, csrf),
});

export const managementApi = {
  umkms: { ...managedResource<ManagedUMKM, UMKMInput, Partial<UMKMInput>>('/manage/umkms'), verifyContact: (id: string, csrf?: string) => mutation<ManagedUMKM>(`/manage/umkms/${id}/verify-contact`, csrf) },
  products: managedResource<ManagedProduct, ProductCreateInput, Partial<ProductUpdateInput>>('/manage/products'),
  users: {
    list: (params: ListParams, signal?: AbortSignal) => apiRequest<Page<ManagedUser> | ManagedUser[]>(pathWithQuery('/admin/users', params), { signal }),
    create: (input: UserCreateInput, csrf?: string) => mutation<ManagedUser>('/admin/users', csrf, 'POST', input),
    update: ({ id, input }: UserUpdateInput, csrf?: string) => mutation<ManagedUser>(`/admin/users/${id}`, csrf, 'PATCH', input),
    resetPassword: (id: string, temporaryPassword: string, csrf?: string) => mutation<void>(`/admin/users/${id}/reset-password`, csrf, 'POST', { temporaryPassword }),
    revokeSessions: (id: string, csrf?: string) => mutation<void>(`/admin/users/${id}/revoke-sessions`, csrf),
  },
  audit: { list: (params: { q?: string; limit?: number }, signal?: AbortSignal) => apiRequest<Page<AuditLog> | AuditLog[]>(pathWithQuery('/admin/audit-logs', params), { signal }) },
  analytics: { get: (from: string, to: string, signal?: AbortSignal) => apiRequest<InquiryAnalytics>(`/admin/inquiry-analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { signal }) },
};

export function pageItems<T>(data?: Page<T> | T[]) { return Array.isArray(data) ? data : data?.items ?? []; }
