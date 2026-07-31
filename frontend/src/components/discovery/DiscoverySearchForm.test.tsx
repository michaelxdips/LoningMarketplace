import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_QUERY_MAX_LENGTH } from '../../lib/catalog-url';
import DiscoverySearchForm from './DiscoverySearchForm';

afterEach(cleanup);

describe('DiscoverySearchForm', () => {
  it('is controlled and submits from its button or Enter without submitting on change', () => {
    const onQueryChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(<DiscoverySearchForm id="catalog-search" label="Cari katalog" query="" onQueryChange={onQueryChange} onSubmit={onSubmit} onClear={vi.fn()} />);
    const input = screen.getByRole('searchbox', { name: 'Cari katalog' });

    fireEvent.change(input, { target: { value: 'kopi' } });
    expect(onQueryChange).toHaveBeenCalledWith('kopi');
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(<DiscoverySearchForm id="catalog-search" label="Cari katalog" query="kopi" onQueryChange={onQueryChange} onSubmit={onSubmit} onClear={vi.fn()} />);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('bounds long input and clears then restores focus to the searchbox', () => {
    const onClear = vi.fn();
    const { rerender } = render(<DiscoverySearchForm id="catalog-search" label="Cari katalog" query={'a'.repeat(CATALOG_QUERY_MAX_LENGTH)} onQueryChange={vi.fn()} onSubmit={vi.fn()} onClear={onClear} />);
    const input = screen.getByRole('searchbox', { name: 'Cari katalog' });

    expect(input).toHaveAttribute('maxLength', String(CATALOG_QUERY_MAX_LENGTH));
    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan pencarian' }));
    rerender(<DiscoverySearchForm id="catalog-search" label="Cari katalog" query="" onQueryChange={vi.fn()} onSubmit={vi.fn()} onClear={onClear} />);

    expect(onClear).toHaveBeenCalledOnce();
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Bersihkan pencarian' })).not.toBeInTheDocument();
  });
});
