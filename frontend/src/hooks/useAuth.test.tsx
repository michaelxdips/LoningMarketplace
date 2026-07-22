import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSession } from './useAuth';

function SessionProbe() {
  const session = useSession();
  if (session.isPending) return <p>loading</p>;
  if (session.isError) return <p>error</p>;
  return <p>{session.data ? session.data.user.username : 'signed-out'}</p>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('session state', () => {
  it('settles an unauthenticated 401 as signed out without retrying', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><SessionProbe /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retries one transient server failure and then settles', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }), { status: 500, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><SessionProbe /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument(), { timeout: 5000 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('settles a network failure as an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network unavailable'));
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><SessionProbe /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText('error')).toBeInTheDocument());
  });
});
