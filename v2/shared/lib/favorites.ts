/**
 * Favorit V2 — logika MURNI (tanpa DOM/React), V2-only.
 *
 * Menyimpan produk & UMKM yang ditandai pengunjung di localStorage, sehingga
 * bisa dilihat lagi nanti tanpa backend baru. Ini fitur RETENSI pengunjung:
 * transaksi tetap lewat WhatsApp, jadi favorit hanya penanda "lihat lagi".
 *
 * Satu-satunya yang disimpan adalah slug (identifier kanonik), bukan snapshot
 * data — supaya kalau harga/nama berubah, halaman favorit menampilkan data
 * terbaru dari API, bukan salinan basi.
 */

export type FavoriteKind = 'umkm' | 'product';

export interface FavoriteEntry {
  kind: FavoriteKind;
  slug: string;
}

/** Key localStorage. Mengikuti pola penamaan `loning_*` yang sudah dipakai. */
export const FAVORITES_STORAGE_KEY = 'loning_v2_favorites';

/** Batas wajar supaya localStorage tidak tumbuh tanpa batas. */
export const FAVORITES_MAX = 50;

function isEntry(value: unknown): value is FavoriteEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as FavoriteEntry).kind === 'umkm' || (value as FavoriteEntry).kind === 'product') &&
    typeof (value as FavoriteEntry).slug === 'string' &&
    (value as FavoriteEntry).slug.length > 0
  );
}

export function readFavorites(storage?: Pick<Storage, 'getItem'>): FavoriteEntry[] {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store?.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter nilai rusak + dedupe (slug+kind unik).
    const seen = new Set<string>();
    const result: FavoriteEntry[] = [];
    for (const item of parsed) {
      if (!isEntry(item)) continue;
      const key = `${item.kind}:${item.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result.slice(0, FAVORITES_MAX);
  } catch {
    return [];
  }
}

export function writeFavorites(
  entries: FavoriteEntry[],
  storage?: Pick<Storage, 'setItem' | 'removeItem'>,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store) return;
    if (entries.length === 0) store.removeItem(FAVORITES_STORAGE_KEY);
    else store.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* penyimpanan penuh/diblokir tidak boleh membuat UI gagal */
  }
}

export function isFavorite(entries: FavoriteEntry[], kind: FavoriteKind, slug: string): boolean {
  return entries.some((entry) => entry.kind === kind && entry.slug === slug);
}

/**
 * Toggle murni: kembalikan daftar baru (tanpa menyentuh argumen asli).
 * Tidak menulis storage — persist adalah tanggung jawab pemakai (hook/effect).
 */
export function toggleFavorite(
  entries: FavoriteEntry[],
  kind: FavoriteKind,
  slug: string,
): FavoriteEntry[] {
  if (isFavorite(entries, kind, slug)) {
    return entries.filter((entry) => !(entry.kind === kind && entry.slug === slug));
  }
  return [{ kind, slug }, ...entries].slice(0, FAVORITES_MAX);
}
