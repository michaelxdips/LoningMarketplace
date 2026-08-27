import { useCallback, useEffect, useState } from 'react';
import {
  FAVORITES_MAX,
  readFavorites,
  writeFavorites,
  type FavoriteEntry,
  type FavoriteKind,
} from '@v2-shared/lib/favorites';

/**
 * Binding React untuk favorit V2.
 *
 * State dimuat sekali dari localStorage (lazy init), lalu setiap perubahan
 * di-persist lewat effect — pola yang sama dengan useTheme. Seluruh keputusan
 * logika (parse, dedupe, toggle) ada di favorites.ts (fungsi murni, teruji).
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => readFavorites());

  // Persist saat BERUBAH (bukan di dalam updater state): updater wajib murni.
  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);

  const toggle = useCallback((kind: FavoriteKind, slug: string) => {
    setFavorites((current) =>
      current.some((e) => e.kind === kind && e.slug === slug)
        ? current.filter((e) => !(e.kind === kind && e.slug === slug))
        : [{ kind, slug }, ...current].slice(0, FAVORITES_MAX),
    );
  }, []);

  const isSaved = useCallback(
    (kind: FavoriteKind, slug: string) => favorites.some((e) => e.kind === kind && e.slug === slug),
    [favorites],
  );

  return { favorites, toggle, isSaved };
}
