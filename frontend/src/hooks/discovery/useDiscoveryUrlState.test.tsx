import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { useDiscoveryUrlState } from './useDiscoveryUrlState';

function Probe() {
  const discovery = useDiscoveryUrlState();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <input aria-label="Draf pencarian" value={discovery.draftQuery} onChange={(event) => discovery.setDraftQuery(event.currentTarget.value)} />
      <button type="button" onClick={discovery.submitQuery}>Cari</button>
      <button type="button" onClick={discovery.clearQuery}>Bersihkan pencarian</button>
      <button type="button" onClick={() => discovery.setCategory('Kerajinan & Olahan Kreatif')}>Kerajinan & Olahan Kreatif</button>
      <button type="button" onClick={() => discovery.setCategory('Jasa & Otomotif')}>Jasa & Otomotif</button>
      <button type="button" onClick={discovery.clearFilters}>Hapus filter</button>
      <button type="button" onClick={() => navigate(-1)}>Kembali</button>
      <output aria-label="Kategori">{discovery.category}</output>
      <output aria-label="Lokasi">{location.search}</output>
      <output aria-label="Hash">{location.hash}</output>
    </>
  );
}

afterEach(cleanup);

describe('useDiscoveryUrlState', () => {
  it('initializes controlled state from the URL and treats an unknown category as Semua', () => {
    render(<MemoryRouter initialEntries={['/?q=kopi&category=Unknown']}><Probe /></MemoryRouter>);

    expect(screen.getByLabelText('Draf pencarian')).toHaveValue('kopi');
    expect(screen.getByLabelText('Kategori')).toHaveTextContent('Semua');
  });

  it('updates the URL with replacement while typing and submits bounded canonical state', () => {
    render(<MemoryRouter initialEntries={['/?category=Kuliner']}><Probe /></MemoryRouter>);
    const input = screen.getByLabelText('Draf pencarian');

    fireEvent.change(input, { target: { value: `  ${'a'.repeat(100)}  ` } });
    expect(new URLSearchParams(screen.getByLabelText('Lokasi').textContent ?? '').get('q')).toHaveLength(80);
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    expect(new URLSearchParams(screen.getByLabelText('Lokasi').textContent ?? '').get('q')).toHaveLength(80);
    expect(screen.getByLabelText('Lokasi')).toHaveTextContent('category=Kuliner');
    expect(input).toHaveValue('a'.repeat(80));
    fireEvent.click(screen.getByRole('button', { name: 'Jasa & Otomotif' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(screen.getByLabelText('Lokasi')).toHaveTextContent(`?q=${'a'.repeat(80)}&category=Kuliner`);
  });

  it('pushes category changes, clears all filters, and follows back navigation without loops', () => {
    render(<MemoryRouter initialEntries={['/?q=kopi&category=Kuliner']}><Probe /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Kerajinan & Olahan Kreatif' }));
    expect(screen.getByLabelText('Lokasi')).toHaveTextContent('?q=kopi&category=Kerajinan+%26+Olahan+Kreatif');
    fireEvent.click(screen.getByRole('button', { name: 'Hapus filter' }));
    expect(screen.getByLabelText('Lokasi')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Draf pencarian')).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(screen.getByLabelText('Lokasi')).toHaveTextContent('?q=kopi&category=Kerajinan+%26+Olahan+Kreatif');
    expect(screen.getByLabelText('Draf pencarian')).toHaveValue('kopi');
    expect(screen.getByLabelText('Kategori')).toHaveTextContent('Kerajinan & Olahan Kreatif');
  });

  it('clears only the query immediately and preserves the selected category', () => {
    render(<MemoryRouter initialEntries={['/?q=kopi&category=Kuliner']}><Probe /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan pencarian' }));

    expect(screen.getByLabelText('Draf pencarian')).toHaveValue('');
    expect(screen.getByLabelText('Lokasi')).toHaveTextContent('?category=Kuliner');
    expect(screen.getByLabelText('Kategori')).toHaveTextContent('Kuliner');
  });

  it('preserves hash navigation while search and category state changes', () => {
    render(<MemoryRouter initialEntries={['/?q=kopi#featured-products']}><Probe /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Draf pencarian'), { target: { value: 'teh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kerajinan & Olahan Kreatif' }));
    expect(screen.getByLabelText('Hash')).toHaveTextContent('#featured-products');
  });
});
