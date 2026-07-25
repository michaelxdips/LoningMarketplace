import { useQuery } from '@tanstack/react-query';
import { getProducts, type GetProductsParams } from '../lib/api';

type ProductQueryOptions = { enabled?: boolean };

export function useProducts(params: GetProductsParams = {}, options: ProductQueryOptions = {}) {
  const normalized = { category: params.category, q: params.q?.trim() || undefined, umkmId: params.umkmId, limit: params.limit };
  return useQuery({
    queryKey: ['products', normalized],
    // ponytail: no AbortSignal — a StrictMode/Suspense remount would otherwise cancel the
    // in-flight fetch (net::ERR_ABORTED). Upgrade path: pass signal when real cancellation is needed.
    queryFn: () => getProducts(normalized),
    staleTime: 3 * 60 * 1000,
    enabled: options.enabled,
  });
}
