/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router';
import { Store, ArrowRight, MapPin, Eye } from 'lucide-react';
import { UMKM } from '../../types';
import { UMKMImage } from './UMKMImage';
import { formatPublicUpdatedAt, getBusinessOpenStatus } from '../../lib/umkmStatus';

interface BusinessCardProps {
  umkm: UMKM;
  onViewDetails: (umkm: UMKM) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ umkm, onViewDetails }) => {
  const openStatus = getBusinessOpenStatus(umkm.workingHours);
  const updatedLabel = formatPublicUpdatedAt(umkm.catalogUpdatedAt ?? umkm.updatedAt);
  return (
    <article
      id={`business-card-${umkm.id}`}
      className="bg-cream-card border border-sage-border rounded-xl overflow-hidden flex flex-col justify-between h-full transition-card hover:border-forest/30 hover:shadow-md group"
    >
      {/* Cover Image Stage */}
      <div className="h-44 w-full overflow-hidden bg-cream-tint relative shrink-0">
        <UMKMImage
          src={umkm.imageUrl}
          alt={umkm.altText || umkm.name}
          name={umkm.name}
          category={umkm.category}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
        <span className="absolute top-3 left-3 z-20 bg-forest text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase shadow-xs">
          {umkm.category}
        </span>
      </div>

      {/* Information Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          {/* Owner metadata */}
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
            <span className="font-bold text-terracotta">Pengelola:</span> {umkm.owner}
          </span>
          
          {/* Business Name */}
          <h3 className="line-clamp-1 text-base font-extrabold text-charcoal transition-colors group-hover:text-forest">
            {umkm.name}
          </h3>

          {/* Simple Address */}
          <div className="flex items-center gap-1.5 text-[13px] text-warm-gray">
            <MapPin size={14} className="shrink-0 text-terracotta" />
            <span className="line-clamp-1">{umkm.address}</span>
          </div>

          {/* Business description */}
          <p className="text-xs text-warm-gray/90 line-clamp-2 leading-relaxed pt-1">
            {umkm.description}
          </p>
          <p className={`pt-1 text-xs font-bold ${openStatus.kind === 'open' ? 'text-emerald-700' : 'text-warm-gray'}`}>{openStatus.label}</p>
          {updatedLabel && <p className="text-[11px] text-warm-gray">{updatedLabel}</p>}
        </div>

        {/* Footer Action */}
        <div className="flex items-center gap-2 pt-3 border-t border-sage-border/80 mt-auto">
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
            className="focus-ring touch-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-sage-border bg-cream-bg px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-forest transition-colors hover:border-forest/30 hover:bg-sage-light hover:text-forest-hover"
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
