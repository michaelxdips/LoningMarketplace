import { useQuery } from '@tanstack/react-query';
import { getUMKMs, type GetUMKMsParams } from '../lib/api';

export function useUMKMs(params: GetUMKMsParams = {}) {
  const normalized = { category: params.category, q: params.q?.trim() || undefined, limit: params.limit };
  return useQuery({ queryKey: ['umkms', normalized], queryFn: ({ signal }) => getUMKMs(normalized, signal), staleTime: 3 * 60 * 1000 });
}
