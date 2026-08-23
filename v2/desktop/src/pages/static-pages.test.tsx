// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { UMKM } from '@loning/shared';
import FaqPage from './FaqPage';
import PetaUMKMPage from './PetaUMKMPage';
import AboutVillagePage from './AboutVillagePage';
import AboutTeamPage from './AboutTeamPage';

/**
 * Test render halaman statis & peta V2.
 * Target mock '@loning/shared/lib/api' (konsisten dengan file test lain).
 */

const { umkms } = vi.hoisted(() => {
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
      latitude: -6.89,
      longitude: 109.46,
      openingTime: '08.00',
      closingTime: '17.00',
    },
    {
      id: 'u2',
      slug: 'kedai-kopi-lereng',
      name: 'Kedai Kopi Lereng',
      owner: 'Bambang',
      description: 'Kedai kopi robusta.',
      phone: '628123456780',
      category: 'Kuliner',
      imageUrl: '/media/kopi.webp',
      address: 'Dukuh Tengah, Desa Loning',
      latitude: null,
      longitude: null,
    },
  ];
  return { umkms };
});

const getUMKMs = vi.fn();

vi.mock('@loning/shared/lib/api', () => ({
  getUMKMs: (...args: unknown[]) => getUMKMs(...args),
}));

function renderPage(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/v2/faq']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('FaqPage', () => {
  it('menampilkan heading dan accordion FAQ', () => {
    renderPage(<FaqPage />);

    expect(
      screen.getByRole('heading', { name: /Pertanyaan umum & cara penggunaan/ }),
    ).toBeInTheDocument();
    // Pertanyaan pertama dari FAQS tampil sebagai tombol accordion.
    expect(
      screen.getByRole('button', { name: /transaksi pembelian dilakukan langsung/ }),
    ).toBeInTheDocument();
    // Langkah penggunaan tampil.
    expect(screen.getByText('Temukan yang dicari')).toBeInTheDocument();
  });

  it('membuka jawaban saat tombol accordion diklik', async () => {
    renderPage(<FaqPage />);

    const question = screen.getByRole('button', {
      name: /transaksi pembelian dilakukan langsung/,
    });
    // Pertanyaan pertama terbuka secara default.
    expect(question).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('PetaUMKMPage', () => {
  it('menampilkan peta untuk UMKM terverifikasi dan daftar belum terpetakan', async () => {
    getUMKMs.mockResolvedValue(umkms);

    renderPage(<PetaUMKMPage />);

    expect(
      await screen.findByRole('heading', { name: /Peta lokasi UMKM Desa Loning/ }),
    ).toBeInTheDocument();
    // UMKM terverifikasi tampil di selektor dan iframe peta.
    await waitFor(() =>
      expect(screen.getByTitle('Peta Lokasi Warung Nasi Khas Loning')).toBeInTheDocument(),
    );
    // UMKM belum terpetakan masuk daftar "lainnya".
    expect(screen.getByText('UMKM lainnya (1)')).toBeInTheDocument();
    expect(screen.getByText('Kedai Kopi Lereng')).toBeInTheDocument();
  });
});

describe('AboutVillagePage', () => {
  it('menampilkan hero dan sektor utama', async () => {
    getUMKMs.mockResolvedValue(umkms);

    renderPage(<AboutVillagePage />);

    expect(
      await screen.findByRole('heading', { name: /jantung Petarukan/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pertanian & Hasil Bumi')).toBeInTheDocument();
    expect(screen.getByText('Kuliner & Snack Olahan')).toBeInTheDocument();
  });
});

describe('AboutTeamPage', () => {
  it('menampilkan identitas KKN dan kontribusi', () => {
    renderPage(<AboutTeamPage />);

    expect(
      screen.getByRole('heading', { name: /Mengabdi, berkolaborasi, dan/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Digitalisasi Potensi Desa')).toBeInTheDocument();
    expect(screen.getByText(/Stephen Michael/)).toBeInTheDocument();
  });
});
