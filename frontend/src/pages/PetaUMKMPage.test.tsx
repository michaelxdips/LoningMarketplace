import type React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, test, vi } from 'vitest';

const mockData = [
  {
    id: 'u1',
    slug: 'usaha-warung-berkah',
    name: 'Warung Berkah',
    owner: 'Budi',
    description: 'Menjual makanan tradisional Desa Loning.',
    phone: '081234567890',
    category: 'Kuliner' as const,
    imageUrl: '/images/warung.jpg',
    address: 'Jl. Pemuda No. 12 Desa Loning',
    latitude: -7.684123,
    longitude: 109.521456
  },
  {
    id: 'u2',
    slug: 'kerajinan-bambu',
    name: 'Kerajinan Bambu Loning',
    owner: 'Siti',
    description: 'Anyaman bambu khas Loning.',
    phone: '081987654321',
    category: 'Kerajinan & Olahan Kreatif' as const,
    imageUrl: '/images/bambu.jpg',
    address: 'Dusun II Desa Loning',
    latitude: null,
    longitude: null
  }
];

vi.mock('../hooks/useUMKMs', () => ({
  useUMKMs: () => ({
    data: mockData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn()
  })
}));

// Component import AFTER vi.mock
import PetaUMKMPage from './PetaUMKMPage';

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PetaUMKMPage', () => {
  test('renders page header, verified map locations, and unmapped fallback list', async () => {
    renderWithProviders(<PetaUMKMPage />);

    expect(await screen.findByRole('heading', { name: /Peta Lokasi UMKM Desa Loning/i })).toBeInTheDocument();
    expect(screen.getAllByText('Warung Berkah').length).toBeGreaterThan(0);
    expect(screen.getByText('Kerajinan Bambu Loning')).toBeInTheDocument();
    expect(screen.getByText('UMKM Lainnya (1)')).toBeInTheDocument();
  });
});
