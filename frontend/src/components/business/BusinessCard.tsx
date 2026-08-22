/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router';
import { Store, ArrowRight, MapPin, Eye } from 'lucide-react';
import { getCategoryShortLabel, UMKM } from '../../types';
import { UMKMImage } from './UMKMImage';
import { formatPublicUpdatedAt, getBusinessOpenStatus } from '../../lib/umkmStatus';

interface BusinessCardProps {
  umkm: UMKM;
  onViewDetails: (umkm: UMKM) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ umkm, onViewDetails }) => {
  const openStatus = getBusinessOpenStatus(umkm.workingHours, new Date(), umkm.openingTime, umkm.closingTime);
  const updatedLabel = formatPublicUpdatedAt(umkm.catalogUpdatedAt ?? umkm.updatedAt);
  return (
    <article
      id={`business-card-${umkm.id}`}
      className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-sage-border bg-cream-card transition-all duration-300 hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-md"
    >
      {/* Cover Image Stage */}
      <div className="relative h-52 w-full shrink-0 overflow-hidden bg-cream-tint">
        <UMKMImage
          src={umkm.imageUrl}
          alt={umkm.altText || umkm.name}
          name={umkm.name}
          category={umkm.category}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent" />
        <span
          title={umkm.category}
          className="absolute left-3 top-3 z-20 max-w-[85%] truncate whitespace-nowrap rounded-md bg-forest px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs"
        >
          {getCategoryShortLabel(umkm.category)}
        </span>
      </div>

      {/* Information Content */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div className="space-y-2">
          {/* Owner metadata */}
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
            <span className="font-bold text-terracotta">Pengelola:</span> {umkm.owner}
          </span>

          {/* Business Name */}
          <h3 className="line-clamp-1 font-serif text-lg font-semibold text-charcoal transition-colors group-hover:text-forest">
            {umkm.name}
          </h3>

          {/* Simple Address */}
          <div className="flex items-center gap-1.5 text-[13px] text-warm-gray">
            <MapPin size={14} className="shrink-0 text-terracotta" />
            <span className="line-clamp-1">{umkm.address}</span>
          </div>

          {/* Business description */}
          <p className="line-clamp-2 text-[13px] leading-relaxed text-warm-gray/90">
            {umkm.description}
          </p>
          <p className={`pt-1 text-xs font-bold ${openStatus.kind === 'open' ? 'text-emerald-700' : 'text-warm-gray'}`}>{openStatus.label}</p>
          {updatedLabel && <p className="text-[11px] text-warm-gray">{updatedLabel}</p>}
        </div>

        {/* Footer Action */}
        <div className="mt-auto flex items-center gap-2 border-t border-sage-border/80 pt-4">
          <button
            type="button"
            onClick={() => onViewDetails(umkm)}
            aria-label={`Lihat ringkasan ${umkm.name}`}
            title="Lihat ringkasan"
            className="focus-ring touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-sage-border text-forest transition-colors hover:border-forest/30 hover:bg-sage-light"
          >
            <Eye size={15} aria-hidden="true" />
          </button>
          <Link
            id={`business-cta-${umkm.id}`}
            to={`/umkm/${encodeURIComponent(umkm.slug)}`}
            className="focus-ring touch-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-sage-border bg-cream-bg px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-forest transition-colors hover:border-forest/30 hover:bg-sage-light hover:text-forest-hover"
          >
            <Store size={14} aria-hidden="true" />
            <span className="truncate">Kunjungi Profil</span>
            <ArrowRight size={14} aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BusinessCard;
