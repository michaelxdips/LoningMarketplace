import { useQuery } from '@tanstack/react-query';
import { getUMKMs, type GetUMKMsParams } from '../lib/api';

type UMKMQueryOptions = { enabled?: boolean };

export function useUMKMs(params: GetUMKMsParams = {}, options: UMKMQueryOptions = {}) {
  const normalized = { category: params.category, q: params.q?.trim() || undefined, limit: params.limit };
  return useQuery({
    queryKey: ['umkms', normalized],
    // ponytail: no AbortSignal — a StrictMode/Suspense remount would otherwise cancel the
    // in-flight fetch (net::ERR_ABORTED). Upgrade path: pass signal when real cancellation is needed.
    queryFn: () => getUMKMs(normalized),
    staleTime: 3 * 60 * 1000,
    enabled: options.enabled,
  });
}
