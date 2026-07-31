import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProducts } from '../useProducts';
import { useUMKMs } from '../useUMKMs';

vi.mock('../../lib/api', () => ({
  getProducts: vi.fn().mockResolvedValue([]),
  getUMKMs: vi.fn().mockResolvedValue([]),
}));

function Probe() {
  useProducts({ q: ' kopi ', category: 'Kuliner', limit: 12 });
  useUMKMs({ q: ' kopi ', category: 'Kuliner', limit: 12 });
  return null;
}

afterEach(() => vi.clearAllMocks());

describe('discovery query keys', () => {
  it('separates entity, q, category, and limit dimensions', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><Probe /></QueryClientProvider>);

    await waitFor(() => expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual(expect.arrayContaining([
      ['products', { q: 'kopi', category: 'Kuliner', limit: 12 }],
      ['umkms', { q: 'kopi', category: 'Kuliner', limit: 12 }],
    ])));
  });
});