// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import ProductDetailPage from '../pages/ProductDetailPage';
import UMKMDetailPage from '../pages/UMKMDetailPage';
import type { ProductDetail, UMKM } from '../types';

const { product, umkm } = vi.hoisted(() => {
  const product: ProductDetail = { id: '10000000-0000-4000-8000-000000000001', slug: 'keripik-canonical', umkmId: '00000000-0000-4000-8000-000000000001', name: 'Keripik', price: 10_000, description: 'Keripik', category: 'Kuliner', imageUrl: '/product.webp', isAvailable: true, umkm: { id: '00000000-0000-4000-8000-000000000001', slug: 'dapur-canonical', name: 'Dapur', phone: '628123456789' } };
  const umkm: UMKM = { id: product.umkm.id, slug: product.umkm.slug, name: product.umkm.name, owner: 'Sri', description: 'Dapur', phone: product.umkm.phone, category: 'Kuliner', imageUrl: '/umkm.webp', address: 'Loning' };
  return { product, umkm };
});

vi.mock('./api', async (original) => ({
  ...await original<typeof import('./api')>(),
  getProduct: vi.fn().mockResolvedValue(product),
  getUMKM: vi.fn().mockResolvedValue(umkm),
  getProducts: vi.fn().mockResolvedValue([]),
}));
vi.mock('./analytics', () => ({ trackPublicEvent: vi.fn() }));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
}

function renderRoute(path: string, element: ReactNode, route: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={<>{element}<LocationProbe /></>} /></Routes></MemoryRouter></QueryClientProvider>);
}

afterEach(cleanup);

describe('legacy detail canonicalization', () => {
  it('replaces a legacy product ID while preserving query and hash once', async () => {
    renderRoute(`/produk/${product.id}?source=campaign#kontak`, <ProductDetailPage />, '/produk/:identifier');
    await waitFor(() => expect(document.querySelector('[data-testid="location"]')).toHaveTextContent('/produk/keripik-canonical?source=campaign#kontak'));
  });

  it('replaces a legacy UMKM ID while preserving query and hash once', async () => {
    renderRoute(`/umkm/${umkm.id}?source=campaign#produk`, <UMKMDetailPage />, '/umkm/:identifier');
    await waitFor(() => expect(document.querySelector('[data-testid="location"]')).toHaveTextContent('/umkm/dapur-canonical?source=campaign#produk'));
  });
});
