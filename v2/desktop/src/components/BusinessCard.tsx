import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import { getCategoryShortLabel, type UMKM } from '@loning/shared';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import FavoriteButton from '@v2-shared/components/FavoriteButton';

/**
 * BusinessCard V2 (desktop).
 *
 * Sengaja BERBEDA bentuk dari ProductCard: di sini gambar kecil di kiri dan
 * teks di kanan (bukan gambar besar di atas). Aturan anti-slop melarang satu
 * keluarga layout dipakai ulang untuk section berbeda; grid produk dan daftar
 * UMKM harus terbaca sebagai dua hal.
 */
export default function BusinessCard({ umkm }: { umkm: UMKM }) {
  return (
    <article className="group relative flex gap-5 py-6">
      <div className="relative shrink-0">
        <MediaImage
          src={umkm.imageUrl}
          alt={umkm.altText ?? `Foto usaha ${umkm.name}`}
          ratio="aspect-square"
          className="w-24 sm:w-28"
        />
        <FavoriteButton kind="umkm" slug={umkm.slug} name={`usaha ${umkm.name}`} className="absolute right-1.5 top-1.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-ink-subtle">
          {getCategoryShortLabel(umkm.category)}
        </p>

        <h3 className="mt-1 font-display text-lg font-semibold leading-snug tracking-tight text-ink">
          <Link
            to={`/v2/umkm/${umkm.slug}`}
            className="focus-ring-v2 after:absolute after:inset-0 after:content-['']"
          >
            {umkm.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {umkm.description}
        </p>

        {umkm.address ? (
          <p className="mt-2.5 flex items-start gap-1.5 text-xs text-ink-subtle">
            <MapPin size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{umkm.address}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
