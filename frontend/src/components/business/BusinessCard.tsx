/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router';
import { Store, ArrowRight, MapPin, Eye } from 'lucide-react';
import { UMKM } from '../../types';

interface BusinessCardProps {
  umkm: UMKM;
  onViewDetails: (umkm: UMKM) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ umkm, onViewDetails }) => {
  return (
    <article
      id={`business-card-${umkm.id}`}
      className="bg-cream-card border border-sage-border rounded-xl overflow-hidden flex flex-col justify-between h-full transition-card hover:border-forest/30 hover:shadow-md group"
    >
      {/* Cover Image Stage */}
      <div className="h-44 w-full overflow-hidden bg-cream-tint relative shrink-0">
        <img
          src={umkm.imageUrl}
          alt={umkm.altText || umkm.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
        <span className="absolute top-3 left-3 bg-forest text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase shadow-xs">
          {umkm.category}
        </span>
      </div>

      {/* Information Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          {/* Owner metadata */}
          <span className="text-[10px] font-bold text-terracotta uppercase tracking-wider block">
            Pengelola: {umkm.owner}
          </span>
          
          {/* Business Name */}
          <h3 className="text-base font-bold text-charcoal line-clamp-1 group-hover:text-forest transition-colors">
            {umkm.name}
          </h3>

          {/* Simple Address */}
          <div className="flex items-center gap-1.5 text-xs text-warm-gray">
            <MapPin size={13} className="text-terracotta shrink-0" />
            <span className="line-clamp-1">{umkm.address}</span>
          </div>

          {/* Business description */}
          <p className="text-xs text-warm-gray/90 line-clamp-2 leading-relaxed pt-1">
            {umkm.description}
          </p>
        </div>

        {/* Footer Action */}
        <div className="flex items-center gap-2 pt-3 border-t border-sage-border/80 mt-auto">
          <button
            type="button"
            onClick={() => onViewDetails(umkm)}
            aria-label={`Lihat ringkasan ${umkm.name}`}
            className="focus-ring touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-sage-border text-forest transition-colors hover:bg-sage-light hover:border-forest/30"
          >
            <Eye size={15}/>
          </button>
          <Link
            id={`business-cta-${umkm.id}`}
            to={`/umkm/${encodeURIComponent(umkm.slug)}`}
            className="focus-ring touch-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-sage-border bg-cream-bg px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-forest transition-colors hover:bg-sage-light hover:text-forest-hover hover:border-forest/30"
          >
            <Store size={13} />
            <span className="truncate">Kunjungi Profil</span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BusinessCard;
