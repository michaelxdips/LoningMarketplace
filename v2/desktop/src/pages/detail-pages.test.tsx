// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { ProductDetail, UMKM } from '@loning/shared';
import { ApiError } from '@loning/shared/lib/api';
import ProductDetailPage from './ProductDetailPage';
import UMKMDetailPage from './UMKMDetailPage';

/**
 * Test render halaman detail V2.
 *
 * Target mock sama seperti pages.test.tsx: '@loning/shared/lib/api' (modul yang
 * benar-benar dikonsumsi hook/query detail), bukan shim frontend. Menambah
 * getProduct/getUMKM/getRelatedProducts ke map mock yang ada di file itu.
 */

const { detail, umkm, related } = vi.hoisted(() => {
  const detail: ProductDetail = {
    id: 'p1',
    slug: 'nasi-megono-komplit',
    umkmId: 'u1',
    name: 'Nasi Megono Komplit',
    price: 18000,
    description: 'Nasi megono dengan lauk lengkap.',
    category: 'Kuliner',
    imageUrl: '/media/nasi.webp',
    isAvailable: true,
    unit: 'porsi',
    umkm: { id: 'u1', slug: 'warung-nasi-khas-loning', name: 'Warung Nasi Khas Loning', phone: '628123456789' },
  };

  const umkm: UMKM = {
    id: 'u1',
    slug: 'warung-nasi-khas-loning',
    name: 'Warung Nasi Khas Loning',
    owner: 'Sri Wahyuni',
    description: 'Warung nasi megono sejak 2011.',
    phone: '628123456789',
    category: 'Kuliner',
    imageUrl: '/media/warung.webp',
    address: 'Dukuh Krajan, Desa Loning',
    latitude: -6.89,
    longitude: 109.46,
    openingTime: '08.00',
    closingTime: '17.00',
  };

  const related = [
    {
      id: 'p2',
      slug: 'kopi-robusta-loning',
      umkmName: 'Kedai Kopi Lereng',
      name: 'Kopi Robusta Loning 250g',
      price: 42000,
      description: 'Robusta sangrai medium.',
      category: 'Kuliner',
      imageUrl: '/media/kopi.webp',
      isAvailable: false,
    },
  ];

  return { detail, umkm, related };
});

const getProduct = vi.fn();
const getUMKM = vi.fn();
const getRelatedProducts = vi.fn();
const getProducts = vi.fn();

vi.mock('@loning/shared/lib/api', () => ({
  getProduct: (...args: unknown[]) => getProduct(...args),
  getUMKM: (...args: unknown[]) => getUMKM(...args),
  getRelatedProducts: (...args: unknown[]) => getRelatedProducts(...args),
  getProducts: (...args: unknown[]) => getProducts(...args),
  getUMKMs: () => Promise.resolve([]),
  PUBLIC_DETAIL_STALE_TIME: 5 * 60 * 1000,
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

function renderPage(ui: ReactNode, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        {/* useParams pada halaman detail butuh <Route> dengan pola :identifier
            di atasnya; tanpanya identifier kosong dan query tidak pernah jalan. */}
        <Routes>
          <Route path="/v2/produk/:identifier" element={ui} />
          <Route path="/v2/umkm/:identifier" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProductDetailPage', () => {
  it('menampilkan detail produk beserta harga terformat dan nama UMKM', async () => {
    getProduct.mockResolvedValue(detail);
    getUMKM.mockResolvedValue(umkm);
    getRelatedProducts.mockResolvedValue(related);

    renderPage(<ProductDetailPage />, '/v2/produk/nasi-megono-komplit');

    expect(
      await screen.findByRole('heading', { name: 'Nasi Megono Komplit' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/18\.000/)).toBeInTheDocument();
    expect(screen.getByText(/porsi/)).toBeInTheDocument();
    expect(screen.getByText('Tersedia')).toBeInTheDocument();
    // Tautan ke profil UMKM.
    expect(screen.getByRole('link', { name: /Oleh Warung Nasi Khas Loning/ })).toBeInTheDocument();
    // Produk terkait muncul.
    await waitFor(() => expect(screen.getByText('Kopi Robusta Loning 250g')).toBeInTheDocument());
  });

  it('produk tidak ditemukan menawarkan jalan keluar', async () => {
    getProduct.mockRejectedValue(new ApiError(404, 'not found'));

    renderPage(<ProductDetailPage />, '/v2/produk/tidak-ada');

    expect(
      await screen.findByRole('heading', { name: 'Produk tidak ditemukan' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat katalog' })).toBeInTheDocument();
  });
});

describe('UMKMDetailPage', () => {
  it('menampilkan profil usaha, jam operasional, dan etalase produk', async () => {
    getUMKM.mockResolvedValue(umkm);
    getProducts.mockResolvedValue(related);

    renderPage(<UMKMDetailPage />, '/v2/umkm/warung-nasi-khas-loning');

    expect(
      await screen.findByRole('heading', { name: 'Warung Nasi Khas Loning' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dikelola oleh Sri Wahyuni')).toBeInTheDocument();
    expect(screen.getByText(/08\.00 – 17\.00 WIB/)).toBeInTheDocument();
    // Etalase produk terisi.
    await waitFor(() => expect(screen.getByText('Kopi Robusta Loning 250g')).toBeInTheDocument());
    // Peta tampil karena koordinat valid.
    expect(screen.getByTitle('Peta lokasi Warung Nasi Khas Loning')).toBeInTheDocument();
  });

  it('usaha tidak ditemukan menawarkan jalan keluar', async () => {
    getUMKM.mockRejectedValue(new ApiError(404, 'not found'));

    renderPage(<UMKMDetailPage />, '/v2/umkm/tidak-ada');

    expect(
      await screen.findByRole('heading', { name: 'Usaha tidak ditemukan' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat direktori' })).toBeInTheDocument();
  });
});
