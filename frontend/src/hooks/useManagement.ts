import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListParams } from '../lib/management';
import { useCsrfToken } from './useAuth';

export function useManagedList<T>(scope: 'manage' | 'admin', key: string, params: ListParams, loader: (signal?: AbortSignal) => Promise<T>, enabled = true) {
  return useQuery({ queryKey: [scope, key, params], queryFn: ({ signal }) => loader(signal), placeholderData: (previous) => previous, enabled });
}
export function useManagedItem<T>(key: string, id: string | undefined, loader: (id: string, signal?: AbortSignal) => Promise<T>) {
  return useQuery({ queryKey: ['manage', key, id], queryFn: ({ signal }) => loader(id!, signal), enabled: Boolean(id) });
}
export function useManagedMutation<TInput, TResult>(scope: 'manage' | 'admin', key: string, action: (input: TInput, csrf?: string) => Promise<TResult>, publicKey?: string) {
  const client = useQueryClient(); const csrf = useCsrfToken();
  return useMutation({ mutationFn: (input: TInput) => action(input, csrf), onSuccess: async () => { await client.invalidateQueries({ queryKey: [scope, key] }); if (publicKey) await client.invalidateQueries({ queryKey: [publicKey] }); } });
}
