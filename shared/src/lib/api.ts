import type { Category, Product, ProductDetail, UMKM } from '../types';

export interface GetUMKMsParams { category?: Category; q?: string; limit?: number }
export interface GetProductsParams { category?: Category; q?: string; umkmId?: string; limit?: number }
export interface GetRelatedProductsParams { limit?: number }

export const PUBLIC_DETAIL_STALE_TIME = 5 * 60 * 1000;

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); this.name = 'ApiError'; }
}

export function shouldRetryApiRequest(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof DOMException && error.name === 'AbortError') return false;
  if (!(error instanceof ApiError)) return false;
  return error.status === 0 || error.status >= 500;
}

let unauthorizedHandler: (() => void) | undefined;
export function setUnauthorizedHandler(handler: () => void) { unauthorizedHandler = handler; }

function getBaseUrl() {
  const value = import.meta.env.VITE_API_URL;
  if (!value) return '/api';
  return value.replace(/\/+$/, '');
}

/** Read the persisted session token used as Bearer fallback for environments where cookies are blocked. */
function getStoredSessionToken(): string | null {
  try { return localStorage.getItem('loning_session_token'); } catch { return null; }
}

async function fetchApi(url: string, options?: RequestInit) {
  try { return await fetch(url, options); }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi backend, lalu coba lagi.', 'NETWORK_ERROR');
  }
}

type ErrorEnvelope = { error?: { message?: string; code?: string; fields?: Record<string, string> } };
type ApiRequestOptions = RequestInit & { skipUnauthorizedHandler?: boolean };

export function apiUrl(path: string) { return `${getBaseUrl()}${path}`; }

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipUnauthorizedHandler, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  if (requestOptions.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  // Inject stored Bearer token as fallback when browser may have blocked the session cookie (e.g. iOS Safari cross-site ITP).
  // Backend authenticate guard checks cookie first; Bearer is only used when no cookie is present.
  if (!headers.has('Authorization')) {
    const stored = getStoredSessionToken();
    if (stored) headers.set('Authorization', `Bearer ${stored}`);
  }
  const response = await fetchApi(`${getBaseUrl()}${path}`, { ...requestOptions, headers, credentials: 'include' });

  const body = await response.json().catch(() => ({})) as { data?: T } & ErrorEnvelope;
  if (!response.ok) {
    const error = new ApiError(response.status, body.error?.message ?? 'Permintaan gagal.', body.error?.code);
    Object.assign(error, { fields: body.error?.fields });
    if (response.status === 401 && !skipUnauthorizedHandler) unauthorizedHandler?.();
    throw error;
  }
  if (response.status === 204) return undefined as T;
  if (!body.data && response.status !== 204 && response.status >= 200 && response.status < 300) {
    // If we have a successful response but no data wrapper and not a 204, return the body itself or empty
    return body as T;
  }
  return body.data as T;
}

export async function get<T>(path: string, params: object = {}, signal?: AbortSignal): Promise<T> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.size ? `?${search}` : '';
  return apiRequest<T>(`${path}${query}`, { signal, method: 'GET' });
}

export const getUMKMs = (params?: GetUMKMsParams, signal?: AbortSignal) => get<UMKM[]>('/umkms', params, signal);
export const getProducts = (params?: GetProductsParams, signal?: AbortSignal) => get<Product[]>('/products', params, signal);
export const getUMKM = (id: string, signal?: AbortSignal) => get<UMKM>(`/umkms/${encodeURIComponent(id)}`, {}, signal);
export const getProduct = (id: string, signal?: AbortSignal) => get<ProductDetail>(`/products/${encodeURIComponent(id)}`, {}, signal);
export const getRelatedProducts = (id: string, params: GetRelatedProductsParams = {}, signal?: AbortSignal) => get<Product[]>(`/products/${encodeURIComponent(id)}/related`, params, signal);

export interface MediaAsset { id: string; imageUrl: string; thumbnailUrl: string; width: number; height: number; byteSize: number; altText: string | null }
export function uploadMedia(file: File, altText: string, csrf: string | undefined, onProgress?: (percent: number) => void) {
  return new Promise<MediaAsset>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${getBaseUrl()}/manage/media/images`);
    request.withCredentials = true;
    request.setRequestHeader('X-CSRF-Token', csrf ?? '');
    // Inject Bearer token fallback for iOS Safari cross-site cookie blocking (ITP)
    try { const stored = localStorage.getItem('loning_session_token'); if (stored) request.setRequestHeader('Authorization', `Bearer ${stored}`); } catch { /* ignore */ }
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
    
    request.onerror = () => reject(new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi backend, lalu coba lagi.', 'NETWORK_ERROR'));
    request.onabort = () => reject(new DOMException('Upload dibatalkan', 'AbortError'));
    request.ontimeout = () => reject(new ApiError(0, 'Koneksi terputus karena batas waktu (timeout).', 'TIMEOUT_ERROR'));
    
    request.onload = () => {
      let body: { data?: MediaAsset; error?: { message?: string; code?: string } } = {};
      try { body = JSON.parse(request.responseText); } catch (e) { /* leave body empty */ }
      
      if (request.status < 200 || request.status >= 300 || !body.data) {
        if (request.status === 401) unauthorizedHandler?.();
        reject(new ApiError(request.status, body.error?.message ?? 'Upload gambar gagal.', body.error?.code));
        return;
      }
      resolve(body.data);
    };
    
    const form = new FormData(); form.append('file', file); form.append('altText', altText); request.send(form);
  });
}
export const updateMediaAltText = (id: string, altText: string | null, csrf?: string) => apiRequest<MediaAsset>(`/manage/media/images/${id}`, { method: 'PATCH', headers: { 'X-CSRF-Token': csrf ?? '' }, body: JSON.stringify({ altText }) });
export const deleteMedia = (id: string, csrf?: string) => apiRequest<void>(`/manage/media/images/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrf ?? '' } });
