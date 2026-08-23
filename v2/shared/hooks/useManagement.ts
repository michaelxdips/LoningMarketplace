import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListParams } from '@loning/shared/lib/management';
import { ApiError } from '@loning/shared/lib/api';
import { authApi, rememberSession } from '@loning/shared/lib/auth';
import { getFreshCsrfToken } from '@loning/shared/hooks/useAuth';
import { useToast } from '@v2-shared/components/Toast';

/**
 * Hook manajemen V2 — pasangan fitur dari frontend/src/hooks/useManagement.ts.
 *
 * Logika query/mutation + auto-refresh CSRF + invalidasi dipertahankan penuh;
 * satu-satunya beda adalah sumber Toast (provider V2, bukan UI lama).
 * Relatif path (`../components/Toast`) sengaja dipakai: file ini dan Toast
 * sama-sama tinggal di v2/shared.
 */

export function useManagedList<T>(
  scope: 'manage' | 'admin',
  key: string,
  params: ListParams,
  loader: (signal?: AbortSignal) => Promise<T>,
  enabled = true,
) {
  return useQuery({
    queryKey: [scope, key, params],
    queryFn: ({ signal }) => loader(signal),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useManagedItem<T>(key: string, id: string | undefined, loader: (id: string, signal?: AbortSignal) => Promise<T>) {
  return useQuery({ queryKey: ['manage', key, id], queryFn: ({ signal }) => loader(id!, signal), enabled: Boolean(id) });
}

export function useManagedMutation<TInput, TResult>(
  scope: 'manage' | 'admin',
  key: string,
  action: (input: TInput, csrf?: string) => Promise<TResult>,
  publicKey?: string,
  toastOptions?: {
    successMessage?: string | ((data: TResult) => string);
    errorMessage?: string | ((err: unknown) => string);
  },
) {
  const client = useQueryClient();
  const { showToast } = useToast();
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
    onSuccess: async (data) => {
      await client.invalidateQueries({ queryKey: [scope, key] });
      if (publicKey) await client.invalidateQueries({ queryKey: [publicKey] });
      if (toastOptions?.successMessage) {
        const msg = typeof toastOptions.successMessage === 'function' ? toastOptions.successMessage(data) : toastOptions.successMessage;
        showToast(msg, 'success');
      }
    },
    onError: (error) => {
      if (toastOptions?.errorMessage) {
        const msg = typeof toastOptions.errorMessage === 'function' ? toastOptions.errorMessage(error) : toastOptions.errorMessage;
        showToast(msg, 'error');
      }
    },
  });
}
