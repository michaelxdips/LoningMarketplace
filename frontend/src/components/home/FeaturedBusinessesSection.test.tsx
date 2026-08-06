import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FeaturedBusinessesSection from './FeaturedBusinessesSection';

afterEach(cleanup);

const baseProps = {
  umkms: [],
  searchQuery: 'kopi',
  onSearchChange: vi.fn(),
  onClearFilters: vi.fn(),
  onViewDetails: vi.fn(),
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
};

describe('FeaturedBusinessesSection discovery states', () => {
  it('provides an accessible submitted search and clear action', () => {
    const onSearchChange = vi.fn();
    const onSearchSubmit = vi.fn();
    render(<FeaturedBusinessesSection {...baseProps} onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari pelaku UMKM' }), { target: { value: 'toko' } });
    expect(onSearchChange).toHaveBeenCalledWith('toko');
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(onSearchSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan pencarian' }));
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('shows loading, retry, count, and zero-result recovery states', () => {
    const onRetry = vi.fn();
    const onClearFilters = vi.fn();
    const { rerender } = render(<FeaturedBusinessesSection {...baseProps} isLoading onRetry={onRetry} onClearFilters={onClearFilters} />);
    expect(screen.getByTestId('umkms-loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Memuat UMKM');
    expect(screen.getByRole('region', { name: 'Profil Pelaku UMKM Desa' })).toHaveAttribute('aria-busy', 'true');

    rerender(<FeaturedBusinessesSection {...baseProps} isError onRetry={onRetry} onClearFilters={onClearFilters} />);
    expect(screen.queryByText('0 UMKM ditemukan')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<FeaturedBusinessesSection {...baseProps} isError={false} onClearFilters={onClearFilters} />);
    expect(screen.getByRole('status')).toHaveTextContent('Tidak ada UMKM yang sesuai.');
    expect(screen.getByText('Usaha Tidak Ditemukan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus Filter' }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
