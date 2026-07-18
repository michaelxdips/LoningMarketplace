/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Store, ArrowRight, MapPin } from 'lucide-react';
import { UMKM } from '../../types';

interface BusinessCardProps {
  umkm: UMKM;
  onViewDetails: (umkm: UMKM) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ umkm, onViewDetails }) => {
  return (
    <div
      id={`business-card-${umkm.id}`}
      className="bg-cream-card border border-sage-border rounded-xl overflow-hidden flex flex-col transition-card hover:border-forest/30 hover:shadow-md group h-[340px]"
    >
      {/* Cover Image Stage */}
      <div className="h-44 w-full overflow-hidden bg-cream-tint relative">
        <img
          src={umkm.imageUrl}
          alt={umkm.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        />
        <span className="absolute top-3 left-3 bg-forest text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase">
          {umkm.category}
        </span>
      </div>

      {/* Information Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          {/* Owner metadata */}
          <span className="text-[9px] font-semibold text-warm-gray uppercase tracking-widest block">
            Pengelola: {umkm.owner}
          </span>
          
          {/* Business Name */}
          <h4 className="text-sm font-semibold text-charcoal line-clamp-1 group-hover:text-forest transition-colors">
            {umkm.name}
          </h4>

          {/* Simple Address */}
          <div className="flex items-center gap-1 text-[11px] text-warm-gray/90">
            <MapPin size={11} className="text-terracotta shrink-0" />
            <span className="line-clamp-1">{umkm.address}</span>
          </div>

          {/* Business description */}
          <p className="text-[11px] text-warm-gray/85 line-clamp-2 leading-relaxed pt-1">
            {umkm.description}
          </p>
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-sage-border/60">
          <button
            id={`business-cta-${umkm.id}`}
            onClick={() => onViewDetails(umkm)}
            className="w-full py-2 bg-cream-bg hover:bg-sage-light text-forest text-[11px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-sage-border focus-ring touch-target"
          >
            <Store size={12} />
            <span>Kunjungi Profil</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
