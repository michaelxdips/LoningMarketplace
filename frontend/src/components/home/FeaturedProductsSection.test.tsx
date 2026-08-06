import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import FeaturedProductsSection from './FeaturedProductsSection';

afterEach(cleanup);

const baseProps = {
  products: [],
  selectedCategory: 'Semua' as const,
  searchQuery: 'kopi',
  onSearchChange: vi.fn(),
  onClearFilters: vi.fn(),
  onInquireProduct: vi.fn(),
  onViewProduct: vi.fn(),
  onViewMerchant: vi.fn(),
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
};

describe('FeaturedProductsSection discovery controls', () => {
  it('submits a controlled search and clears it with focus restoration', () => {
    const onSearchChange = vi.fn();
    const onSearchSubmit = vi.fn();
    const { rerender } = render(<FeaturedProductsSection {...baseProps} onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} />);
    const input = screen.getByRole('searchbox', { name: 'Cari produk lokal' });

    fireEvent.change(input, { target: { value: 'teh' } });
    rerender(<FeaturedProductsSection {...baseProps} searchQuery="teh" onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} />);
    expect(input).toHaveValue('teh');
    expect(onSearchChange).toHaveBeenCalledWith('teh');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSearchSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan pencarian' }));
    expect(onSearchChange).toHaveBeenCalledWith('');
    rerender(<FeaturedProductsSection {...baseProps} searchQuery="" onSearchChange={onSearchChange} />);
    expect(input).toHaveFocus();
  });

  it('shows loading, error retry, count, and zero-result recovery states', () => {
    const onRetry = vi.fn();
    const onClearFilters = vi.fn();
    const { rerender } = render(<FeaturedProductsSection {...baseProps} isLoading onRetry={onRetry} onClearFilters={onClearFilters} />);
    expect(screen.getByTestId('products-loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Memuat produk');
    expect(screen.getByRole('region', { name: 'Katalog Produk Warga' })).toHaveAttribute('aria-busy', 'true');

    rerender(<FeaturedProductsSection {...baseProps} isError onRetry={onRetry} onClearFilters={onClearFilters} />);
    expect(screen.queryByText('0 produk ditemukan')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<FeaturedProductsSection {...baseProps} isError={false} searchQuery="kopi" onClearFilters={onClearFilters} />);
    expect(screen.getByRole('status')).toHaveTextContent('Tidak ada produk yang sesuai.');
    expect(screen.getByText('Produk Tidak Ditemukan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus Filter' }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
