import { CATEGORIES, type Category } from '../types';

export const CATALOG_QUERY_MAX_LENGTH = 80;
export type CatalogState = { q: string; category: Category | 'Semua' };

export function parseCatalogState(search: string): CatalogState {
  const params = new URLSearchParams(search);
  const q = (params.get('q') ?? '').trim().slice(0, CATALOG_QUERY_MAX_LENGTH);
  const category = params.get('category');
  return { q, category: CATEGORIES.includes(category as Category) ? category as Category : 'Semua' };
}

export function serializeCatalogState(state: Partial<CatalogState>): URLSearchParams {
  const params = new URLSearchParams();
  const q = (state.q ?? '').trim().slice(0, CATALOG_QUERY_MAX_LENGTH);
  if (q) params.set('q', q);
  if (state.category && state.category !== 'Semua' && CATEGORIES.includes(state.category)) params.set('category', state.category);
  return params;
}
