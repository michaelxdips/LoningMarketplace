import { Heart } from 'lucide-react';
import { useFavorites } from '@v2-shared/hooks/useFavorites';
import type { FavoriteKind } from '@v2-shared/lib/favorites';
import { cn } from '@v2-shared/ui/cn';

/**
 * Tombol simpan/favorit V2 — dipasang di kartu produk & detail UMKM.
 *
 * Tanpa backend: menandai slug di localStorage lewat useFavorites. Karena
 * trigger-nya sering duduk di atas kartu yang seluruhnya bisa diklik (pola
 * stretched-link), tombol ini di-render di lapisan lebih atas (z-10) supaya
 * tidak ketelan overlay ::after milik tautan judul.
 */
export default function FavoriteButton({
  kind,
  slug,
  name,
  className,
}: {
  kind: FavoriteKind;
  slug: string;
  /** Nama entitas untuk accessible-name, mis. "Simpan Produk X". */
  name: string;
  className?: string;
}) {
  const { isSaved, toggle } = useFavorites();
  const saved = isSaved(kind, slug);

  return (
    <button
      type="button"
      onClick={() => toggle(kind, slug)}
      aria-pressed={saved}
      aria-label={saved ? `Hapus ${name} dari tersimpan` : `Simpan ${name}`}
      title={saved ? 'Hapus dari tersimpan' : 'Simpan untuk dilihat nanti'}
      className={cn(
        'focus-ring-v2 touch-44 relative z-10 inline-flex items-center justify-center rounded-control transition-all duration-150 active:scale-90',
        saved
          ? 'bg-surface text-danger-ink border border-danger-ink/30'
          : 'border border-control-border bg-surface text-ink-muted hover:text-danger-ink',
        className,
      )}
    >
      <Heart
        size={16}
        strokeWidth={1.5}
        fill={saved ? 'currentColor' : 'none'}
        className={cn('transition-transform duration-200', saved && 'scale-110')}
        aria-hidden="true"
      />
    </button>
  );
}
