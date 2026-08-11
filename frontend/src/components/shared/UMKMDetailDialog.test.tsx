import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product, UMKM } from '../../types';
import UMKMDetailDialog from './UMKMDetailDialog';

const mockUMKM: UMKM = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'dapur-loning',
  name: 'Dapur Loning',
  owner: 'Ibu Sri',
  description: 'Aneka olahan makanan khas Desa Loning',
  phone: '628123456789',
  category: 'Kuliner',
  imageUrl: '/umkm.webp',
  address: 'Desa Loning RT 01 RW 02',
  latitude: null,
  longitude: null,
  isContactValid: true,
};

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    umkmId: '00000000-0000-4000-8000-000000000001',
    umkmName: 'Dapur Loning',
    slug: 'keripik-singkong',
    name: 'Keripik Singkong',
    price: 15000,
    category: 'Kuliner',
    imageUrl: '/prod.webp',
    description: 'Renyah dan gurih',
    isAvailable: true,
  },
];

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('UMKMDetailDialog', () => {
  it('renders without throwing error and displays UMKM details including short category label', () => {
    render(
      <UMKMDetailDialog
        isOpen={true}
        onClose={vi.fn()}
        umkm={mockUMKM}
        products={mockProducts}
        onInquireProduct={vi.fn()}
        onInquireUMKM={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Dapur Loning')).toBeInTheDocument();
    expect(screen.getByText('Ibu Sri')).toBeInTheDocument();
    expect(screen.getAllByText('Kuliner').length).toBeGreaterThan(0);
  });
});
