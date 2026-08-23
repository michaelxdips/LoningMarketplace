import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { Category } from '../../types';
import { parseCatalogState, serializeCatalogState } from '../../lib/catalog-url';

export function useDiscoveryUrlState() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = parseCatalogState(location.search);
  const [draftQuery, setDraftQuery] = useState(state.q);
  useEffect(() => setDraftQuery(state.q), [state.q]);

  const commit = (params: URLSearchParams, replace = false) => navigate({ pathname: location.pathname, search: params.size ? `?${params}` : '', hash: location.hash }, { replace });
  const update = (next: Partial<typeof state>, replace = false) => commit(serializeCatalogState({ ...state, ...next }), replace);
  const setQuery = (query: string) => {
    const next = parseCatalogState(`?${serializeCatalogState({ ...state, q: query })}`);
    setDraftQuery(next.q);
    update({ q: next.q }, true);
  };
  const submitQuery = () => {
    const next = parseCatalogState(`?${serializeCatalogState({ ...state, q: draftQuery })}`);
    setDraftQuery(next.q);
    commit(serializeCatalogState(next));
  };
  const setCategory = (category: Category | 'Semua') => update({ category });
  const clearQuery = () => {
    setDraftQuery('');
    update({ q: '' }, true);
  };
  const clearFilters = () => {
    setDraftQuery('');
    commit(new URLSearchParams());
  };

  return { ...state, draftQuery, setDraftQuery: setQuery, submitQuery, setCategory, clearQuery, clearFilters };
}
