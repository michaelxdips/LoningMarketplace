// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  FAVORITES_MAX,
  FAVORITES_STORAGE_KEY,
  isFavorite,
  readFavorites,
  toggleFavorite,
  writeFavorites,
  type FavoriteEntry,
} from './favorites';

function makeStore(initial?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    _dump: () => Object.fromEntries(map),
  };
}

describe('favorites — readFavorites', () => {
  it('tanpa data tersimpan mengembalikan []', () => {
    expect(readFavorites(makeStore())).toEqual([]);
  });

  it('data rusak (bukan array) diabaikan', () => {
    expect(readFavorites(makeStore({ [FAVORITES_STORAGE_KEY]: '{"bukan":"array"}' }))).toEqual([]);
  });

  it('JSON korup tidak melempar', () => {
    expect(readFavorites(makeStore({ [FAVORITES_STORAGE_KEY]: '{korup' }))).toEqual([]);
  });

  it('entry tidak valid disaring, duplikat didedupe', () => {
    const store = makeStore({
      [FAVORITES_STORAGE_KEY]: JSON.stringify([
        { kind: 'product', slug: 'a' },
        { kind: 'product', slug: 'a' },
        { kind: 'nope', slug: 'b' },
        { kind: 'product', slug: '' },
        null,
      ]),
    });
    expect(readFavorites(store)).toEqual([{ kind: 'product', slug: 'a' }]);
  });
});

describe('favorites — toggleFavorite', () => {
  it('menambah entry baru di depan', () => {
    const result = toggleFavorite([{ kind: 'umkm', slug: 'x' }], 'product', 'y');
    expect(result).toEqual([
      { kind: 'product', slug: 'y' },
      { kind: 'umkm', slug: 'x' },
    ]);
  });

  it('menghapus entry yang sudah ada', () => {
    expect(toggleFavorite([{ kind: 'product', slug: 'a' }], 'product', 'a')).toEqual([]);
  });

  it('tidak memutasi argumen asli', () => {
    const original: FavoriteEntry[] = [{ kind: 'umkm', slug: 'x' }];
    toggleFavorite(original, 'product', 'y');
    expect(original).toEqual([{ kind: 'umkm', slug: 'x' }]);
  });

  it('membatasi jumlah ke FAVORITES_MAX', () => {
    let entries: FavoriteEntry[] = [];
    for (let i = 0; i < FAVORITES_MAX; i += 1) entries = toggleFavorite(entries, 'product', `p${i}`);
    entries = toggleFavorite(entries, 'product', 'overflow');
    expect(entries).toHaveLength(FAVORITES_MAX);
    expect(entries[0]).toEqual({ kind: 'product', slug: 'overflow' });
  });
});

describe('favorites — isFavorite', () => {
  it('membandingkan kind DAN slug', () => {
    const entries: FavoriteEntry[] = [{ kind: 'product', slug: 'a' }];
    expect(isFavorite(entries, 'product', 'a')).toBe(true);
    expect(isFavorite(entries, 'umkm', 'a')).toBe(false);
    expect(isFavorite(entries, 'product', 'b')).toBe(false);
  });
});

describe('favorites — writeFavorites', () => {
  it('kosong menghapus key, berisi menulis JSON', () => {
    const store = makeStore({ [FAVORITES_STORAGE_KEY]: 'x' });
    writeFavorites([], store);
    expect(store._dump()[FAVORITES_STORAGE_KEY]).toBeUndefined();

    writeFavorites([{ kind: 'umkm', slug: 'a' }], store);
    expect(JSON.parse(store._dump()[FAVORITES_STORAGE_KEY])).toEqual([{ kind: 'umkm', slug: 'a' }]);
  });
});
