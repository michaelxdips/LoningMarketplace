import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListParams } from '../lib/management';
import { getFreshCsrfToken } from './useAuth';
import { ApiError } from '../lib/api';
import { authApi, rememberSession } from '../lib/auth';

export function useManagedList<T>(scope: 'manage' | 'admin', key: string, params: ListParams, loader: (signal?: AbortSignal) => Promise<T>, enabled = true) {
  return useQuery({ queryKey: [scope, key, params], queryFn: ({ signal }) => loader(signal), placeholderData: (previous) => previous, enabled });
}
export function useManagedItem<T>(key: string, id: string | undefined, loader: (id: string, signal?: AbortSignal) => Promise<T>) {
  return useQuery({ queryKey: ['manage', key, id], queryFn: ({ signal }) => loader(id!, signal), enabled: Boolean(id) });
}
export function useManagedMutation<TInput, TResult>(scope: 'manage' | 'admin', key: string, action: (input: TInput, csrf?: string) => Promise<TResult>, publicKey?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => {
      const csrf = await getFreshCsrfToken(client);
      try {
        return await action(input, csrf);
      } catch (error) {
        if (error instanceof ApiError && (error.code === 'CSRF_INVALID' || error.message.includes('CSRF'))) {
          const session = await authApi.session();
          rememberSession(client, session);
          return await action(input, session.csrfToken);
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: [scope, key] });
      if (publicKey) await client.invalidateQueries({ queryKey: [publicKey] });
    },
  });
}
