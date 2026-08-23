import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import { getCategoryShortLabel, type UMKM } from '@loning/shared';
import { MediaImage } from '@v2-shared/ui/MediaImage';

/**
 * BusinessCard V2 mobile — daftar UMKM satu kolom, hairline antar item.
 */
export default function BusinessCard({ umkm }: { umkm: UMKM }) {
  return (
    <article className="group relative flex gap-4 py-5">
      <MediaImage src={umkm.imageUrl} alt={umkm.altText ?? `Foto usaha ${umkm.name}`} ratio="aspect-square" className="w-20 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent-ink">{getCategoryShortLabel(umkm.category)}</p>
        <h3 className="mt-1 font-display text-base font-semibold leading-snug tracking-tight text-ink">
          <Link to={`/m/umkm/${umkm.slug}`} className="focus-ring-v2 after:absolute after:inset-0 after:content-['']">
            {umkm.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{umkm.description}</p>
        {umkm.address ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-subtle">
            <MapPin size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{umkm.address}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
