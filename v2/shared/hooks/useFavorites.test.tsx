// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAVORITES_STORAGE_KEY } from '../lib/favorites';
import { resetFavoritesStoreForTests, useFavorites } from './useFavorites';

/**
 * Uji sinkronisasi antar-komponen: dua komponen yang sama-sama memakai
 * useFavorites harus melihat state yang SAMA. Ini menjamin bug "state terpisah
 * per hook" tidak muncul kembali setelah migrasi ke shared store.
 */
function Probe({ label }: { label: string }) {
  const { favorites, toggle, isSaved } = useFavorites();
  const saved = isSaved('product', 'nasi-megono');
  return (
    <div>
      <span data-testid={`${label}-count`}>{favorites.length}</span>
      <span data-testid={`${label}-saved`}>{String(saved)}</span>
      <button type="button" onClick={() => toggle('product', 'nasi-megono')}>
        {label}-toggle
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  resetFavoritesStoreForTests();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('useFavorites — sinkronisasi antar komponen', () => {
  it('toggle dari satu komponen terlihat oleh komponen lain', () => {
    render(
      <>
        <Probe label="a" />
        <Probe label="b" />
      </>,
    );

    expect(screen.getByTestId('a-saved').textContent).toBe('false');
    expect(screen.getByTestId('b-saved').textContent).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'a-toggle' }));

    // Kedua komponen harus membaca state tersimpan yang sama.
    expect(screen.getByTestId('a-saved').textContent).toBe('true');
    expect(screen.getByTestId('b-saved').textContent).toBe('true');
    expect(screen.getByTestId('a-count').textContent).toBe('1');
    expect(screen.getByTestId('b-count').textContent).toBe('1');
  });

  it('toggle kedua (off) juga tersinkron', () => {
    render(
      <>
        <Probe label="a" />
        <Probe label="b" />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'a-toggle' }));
    fireEvent.click(screen.getByRole('button', { name: 'b-toggle' }));

    expect(screen.getByTestId('a-saved').textContent).toBe('false');
    expect(screen.getByTestId('b-saved').textContent).toBe('false');
  });

  it('state persisten ke localStorage', () => {
    render(<Probe label="a" />);
    fireEvent.click(screen.getByRole('button', { name: 'a-toggle' }));

    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    expect(JSON.parse(raw!)).toEqual([{ kind: 'product', slug: 'nasi-megono' }]);
  });
});
