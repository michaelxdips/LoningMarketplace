/**
 * Penggabung className minimal.
 *
 * ponytail: sengaja BUKAN clsx + tailwind-merge. Primitif di folder ini memakai
 * peta varian tertutup, jadi tidak ada konflik utility yang perlu diselesaikan
 * (yang merupakan satu-satunya alasan memakai tailwind-merge).
 * Naikkan ke clsx/tailwind-merge kalau nanti primitif menerima className dari
 * luar yang boleh menimpa warna/spacing internalnya.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
