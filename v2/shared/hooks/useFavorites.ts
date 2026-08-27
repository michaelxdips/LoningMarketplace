import { useCallback, useSyncExternalStore } from 'react';
import {
  readFavorites,
  toggleFavorite,
  writeFavorites,
  type FavoriteEntry,
  type FavoriteKind,
} from '@v2-shared/lib/favorites';

/**
 * Binding React untuk favorit V2.
 *
 * MEMAKAI SHARED STORE (module singleton) + useSyncExternalStore, BUKAN useState
 * lokal per-hook. Alasannya: tombol favorit yang sama bisa muncul beberapa kali
 * di satu halaman (mis. produk di grid utama DAN di "produk terkait"). Kalau
 * tiap tombol punya state sendiri, klik di satu tempat tidak memperbarui yang
 * lain. Store bersama memastikan semua pemakai re-render bersamaan.
 */

let cache: FavoriteEntry[] = readFavorites();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function getSnapshot(): FavoriteEntry[] {
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setFavorites(next: FavoriteEntry[]) {
  cache = next;
  writeFavorites(next);
  emit();
}

/**
 * Reset store in-memory. Hanya untuk isolasi test (cache module-level
 * persisten antar test; localStorage di-clear saja tidak cukup).
 */
export function resetFavoritesStoreForTests() {
  cache = readFavorites();
  emit();
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggle = useCallback((kind: FavoriteKind, slug: string) => {
    setFavorites(toggleFavorite(getSnapshot(), kind, slug));
  }, []);

  const isSaved = useCallback(
    (kind: FavoriteKind, slug: string) =>
      favorites.some((entry) => entry.kind === kind && entry.slug === slug),
    [favorites],
  );

  return { favorites, toggle, isSaved };
}
