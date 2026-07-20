import { useQuery } from '@tanstack/react-query';
import { getProducts, type GetProductsParams } from '../lib/api';

export function useProducts(params: GetProductsParams = {}) {
  const normalized = { category: params.category, q: params.q?.trim() || undefined, umkmId: params.umkmId, limit: params.limit };
  return useQuery({ queryKey: ['products', normalized], queryFn: ({ signal }) => getProducts(normalized, signal), staleTime: 3 * 60 * 1000 });
}
