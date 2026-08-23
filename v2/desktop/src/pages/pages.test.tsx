// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Product, UMKM } from '@loning/shared';
import HomePage from './HomePage';
import CatalogPage from './CatalogPage';

/**
 * Test render halaman V2.
 *
 * Menguji tiga hal yang tidak bisa dibuktikan oleh typecheck maupun build:
 *   1. JALUR SUKSES benar-benar menampilkan data (nama produk, harga, UMKM).
 *   2. Jalur kosong & gagal menampilkan jalan keluar, bukan layar hampa.
 *   3. Alias `@loning/shared` / `@v2-shared` resolve di lingkungan test.
 *
 * Catatan mock (pelajaran dari Phase 0): target mock HARUS modul yang benar-benar
 * dikonsumsi. Hook useProducts/useUMKMs tinggal di shared dan mengimpor
 * `../lib/api` -> jadi yang dimock adalah '@loning/shared/lib/api', bukan shim
 * lama di frontend. Kalau salah target, mock jadi mati dan test menembak network.
 */

const { products, umkms } = vi.hoisted(() => {
  const products: Product[] = [
    {
      id: 'p1',
      slug: 'nasi-megono-komplit',
      umkmId: 'u1',
      umkmName: 'Warung Nasi Khas Loning',
      name: 'Nasi Megono Komplit',
      price: 18000,
      description: 'Nasi megono dengan lauk lengkap.',
      category: 'Kuliner',
      imageUrl: '/media/nasi.webp',
      isAvailable: true,
      unit: 'porsi',
    },
    {
      id: 'p2',
      slug: 'kopi-robusta-loning',
      umkmId: 'u2',
      umkmName: 'Kedai Kopi Lereng',
      name: 'Kopi Robusta Loning 250g',
      price: 42000,
      description: 'Robusta sangrai medium.',
      category: 'Kuliner',
      imageUrl: '/media/kopi.webp',
      isAvailable: false,
    },
  ];

  const umkms: UMKM[] = [
    {
      id: 'u1',
      slug: 'warung-nasi-khas-loning',
      name: 'Warung Nasi Khas Loning',
      owner: 'Sri Wahyuni',
      description: 'Warung nasi megono sejak 2011.',
      phone: '628123456789',
      category: 'Kuliner',
      imageUrl: '/media/warung.webp',
      address: 'Dukuh Krajan, Desa Loning',
      latitude: null,
      longitude: null,
    },
  ];

  return { products, umkms };
});

const getProducts = vi.fn();
const getUMKMs = vi.fn();

vi.mock('@loning/shared/lib/api', () => ({
  getProducts: (...args: unknown[]) => getProducts(...args),
  getUMKMs: (...args: unknown[]) => getUMKMs(...args),
}));

function renderPage(ui: ReactNode, path = '/v2') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomePage — jalur sukses', () => {
  it('menampilkan produk beserta harga terformat dan nama UMKM', async () => {
    getProducts.mockResolvedValue(products);
    getUMKMs.mockResolvedValue(umkms);

    renderPage(<HomePage />);

    expect(
      await screen.findByRole('heading', { name: /Temukan produk lokal/ }),
    ).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Nasi Megono Komplit')).toBeInTheDocument());

    // Harga diformat lewat formatPrice (Intl id-ID). Dicek longgar pada
    // pemisah ribuan supaya tidak rapuh terhadap perbedaan data ICU.
    expect(screen.getByText(/18\.000/)).toBeInTheDocument();
    expect(screen.getByText(/42\.000/)).toBeInTheDocument();

    // Satuan ditampilkan hanya bila ada.
    expect(screen.getByText(/porsi/)).toBeInTheDocument();

    // Produk yang tidak tersedia diberi penanda teks, bukan hanya warna.
    expect(screen.getByText('Kosong')).toBeInTheDocument();

    // UMKM muncul di section terpisah.
    await waitFor(() =>
      expect(screen.getAllByText('Warung Nasi Khas Loning').length).toBeGreaterThan(0),
    );
  });

  it('kartu produk memakai satu tautan ke slug canonical (stretched link)', async () => {
    getProducts.mockResolvedValue(products);
    getUMKMs.mockResolvedValue([]);

    renderPage(<HomePage />);

    const link = await screen.findByRole('link', { name: 'Nasi Megono Komplit' });
    expect(link).toHaveAttribute('href', '/v2/produk/nasi-megono-komplit');

    // Hanya SATU tautan per kartu: tiga tautan ke tujuan sama akan membuat
    // daftar tautan pembaca layar berisik.
    expect(screen.getAllByRole('link', { name: 'Nasi Megono Komplit' })).toHaveLength(1);
  });

  it('kegagalan API memunculkan pesan galat dan tombol coba lagi', async () => {
    getProducts.mockRejectedValue(new Error('jaringan mati'));
    getUMKMs.mockRejectedValue(new Error('jaringan mati'));

    renderPage(<HomePage />);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Coba lagi' }).length).toBeGreaterThan(0);
  });
});

describe('CatalogPage', () => {
  it('menampilkan jumlah hasil dan kartu produk', async () => {
    getProducts.mockResolvedValue(products);

    renderPage(<CatalogPage />, '/v2/produk');

    await waitFor(() => expect(screen.getByText('Nasi Megono Komplit')).toBeInTheDocument());
    expect(screen.getByText(/Menampilkan/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hasil kosong dengan filter aktif menawarkan jalan keluar', async () => {
    getProducts.mockResolvedValue([]);

    renderPage(<CatalogPage />, '/v2/produk?q=tidakada');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Produk tidak ditemukan' })).toBeInTheDocument(),
    );
    // Label jalan keluar di empty state SENGAJA berbeda dari "Hapus filter"
    // di bilah filter, supaya tidak ada dua tombol dengan nama aksesibel sama.
    expect(screen.getByRole('button', { name: 'Tampilkan semua produk' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Hapus filter' })).toHaveLength(1);
  });

  it('pencarian punya label sungguhan, bukan placeholder sebagai label', async () => {
    getProducts.mockResolvedValue([]);

    renderPage(<CatalogPage />, '/v2/produk');

    // getByLabelText hanya lolos kalau <label> benar-benar terhubung.
    expect(screen.getByLabelText('Cari produk')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });
});
