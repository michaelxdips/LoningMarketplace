import { Link } from 'react-router';
import { Clock3, MapPin } from 'lucide-react';
import { getCategoryShortLabel, type UMKM } from '@loning/shared';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Badge } from '@v2-shared/ui/Badge';
import { isOpenNow } from '@v2-shared/lib/businessHours';
import FavoriteButton from '@v2-shared/components/FavoriteButton';

/**
 * BusinessCard V2 mobile — daftar UMKM satu kolom, hairline antar item.
 */
export default function BusinessCard({ umkm }: { umkm: UMKM }) {
  const status = isOpenNow(umkm.openingTime, umkm.closingTime, umkm.workingHours);
  const hasHours = Boolean(umkm.openingTime && umkm.closingTime) || Boolean(umkm.workingHours);

  return (
    <article className="group relative flex gap-4 py-5">
      <div className="relative shrink-0">
        <MediaImage src={umkm.imageUrl} alt={umkm.altText ?? `Foto usaha ${umkm.name}`} ratio="aspect-square" className="w-20" />
        <FavoriteButton kind="umkm" slug={umkm.slug} name={`usaha ${umkm.name}`} className="absolute right-1 top-1" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-accent-ink">{getCategoryShortLabel(umkm.category)}</p>
          {hasHours ? (
            <Badge
              variant={status.isOpen ? 'success' : 'neutral'}
              icon={<Clock3 size={11} strokeWidth={1.5} />}
            >
              {status.isOpen ? 'Buka Sekarang' : 'Tutup'}
            </Badge>
          ) : null}
        </div>
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
