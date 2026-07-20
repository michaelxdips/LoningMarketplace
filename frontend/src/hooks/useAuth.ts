import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, csrfKey, rememberSession, sessionKey } from '../lib/auth';
import { ApiError } from '../lib/api';

export function useSession() {
  const client = useQueryClient();
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      try { const session = await authApi.session(); client.setQueryData(csrfKey, session.csrfToken); return session; }
      catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
    },
    retry: (failureCount, error) => error instanceof ApiError && error.status >= 500 && failureCount < 1,
    staleTime: 60_000,
  });
}

export function useCsrfToken() {
  return useQuery({ queryKey: csrfKey, queryFn: () => null as string | null, staleTime: Infinity }).data ?? undefined;
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({ mutationFn: authApi.login, onSuccess: (session) => rememberSession(client, session) });
}

export function useLogout() {
  const client = useQueryClient();
  const csrf = useCsrfToken();
  return useMutation({ mutationFn: () => authApi.logout(csrf), onSettled: async () => {
    await Promise.all([client.cancelQueries({ queryKey: ['auth'] }), client.cancelQueries({ queryKey: ['manage'] }), client.cancelQueries({ queryKey: ['admin'] })]);
    client.removeQueries({ queryKey: ['manage'] }); client.removeQueries({ queryKey: ['admin'] });
    rememberSession(client, null);
  } });
}
