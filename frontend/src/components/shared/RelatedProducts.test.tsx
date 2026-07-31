import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import type { Product } from '../../types';
import RelatedProducts from './RelatedProducts';

const product: Product = { id: '10000000-0000-4000-8000-000000000001', slug: 'kopi-loning', umkmId: '00000000-0000-4000-8000-000000000001', umkmName: 'Kopi Loning', name: 'Kopi Bubuk', price: 20_000, description: 'Kopi lokal.', category: 'Kuliner', imageUrl: '/kopi.webp', isAvailable: true };

afterEach(cleanup);

describe('RelatedProducts', () => {
  it('uses the shared ProductCard and canonical link', () => {
    render(<MemoryRouter><RelatedProducts products={[product]} /></MemoryRouter>);
    expect(screen.getByRole('region', { name: 'Produk terkait' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: product.name })).toBeInTheDocument();
    expect(document.querySelector(`#product-card-${product.id}`)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: `Buka produk terkait ${product.name}` })).not.toHaveLength(0);
    expect(screen.getAllByRole('link', { name: `Buka produk terkait ${product.name}` })[0]).toHaveAttribute('href', `/produk/${product.slug}`);
    expect(screen.queryByRole('button', { name: `Lihat detail ${product.name}` })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tanya Produk' })).not.toBeInTheDocument();
  });
  it('renders nothing for empty results', () => {
    const { container } = render(<MemoryRouter><RelatedProducts products={[]} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
  it('reserves a labelled loading region while related products load', () => {
    render(<MemoryRouter><RelatedProducts products={[]} isLoading /></MemoryRouter>);
    expect(screen.getByRole('region', { name: 'Produk terkait' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Memuat produk terkait…')).toBeInTheDocument();
  });
});