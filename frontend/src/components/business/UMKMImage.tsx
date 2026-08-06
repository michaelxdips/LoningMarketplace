/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Store, Utensils, Palette, Wrench, Sprout, ShoppingBag } from 'lucide-react';
import { Category } from '../../types';

const failedUMKMImageUrls = new Set<string>();

interface UMKMImageProps {
  src?: string | null;
  alt?: string;
  name: string;
  category?: Category | string;
  className?: string;
}

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Kuliner':
      return Utensils;
    case 'Kerajinan':
      return Palette;
    case 'Jasa':
      return Wrench;
    case 'Pertanian':
      return Sprout;
    case 'Perdagangan':
      return ShoppingBag;
    default:
      return Store;
  }
};

const getCategoryGradient = (category?: string) => {
  switch (category) {
    case 'Kuliner':
      return 'from-amber-100/90 via-orange-50 to-amber-200/60 text-amber-900 border-amber-200/80';
    case 'Kerajinan':
      return 'from-emerald-100/90 via-teal-50 to-emerald-200/60 text-emerald-900 border-emerald-200/80';
    case 'Jasa':
      return 'from-blue-100/90 via-sky-50 to-indigo-100/60 text-blue-900 border-blue-200/80';
    case 'Pertanian':
      return 'from-lime-100/90 via-emerald-50 to-green-200/60 text-green-900 border-green-200/80';
    case 'Perdagangan':
      return 'from-purple-100/90 via-fuchsia-50 to-pink-100/60 text-purple-900 border-purple-200/80';
    default:
      return 'from-cream-tint via-sage-light/70 to-cream-bg text-forest border-sage-border';
  }
};

export function UMKMImage({
  src,
  alt,
  name,
  category,
  className = '',
}: UMKMImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(Boolean(src && failedUMKMImageUrls.has(src)));
  }, [src]);

  if (!src || failed) {
    const Icon = getCategoryIcon(category);
    const gradient = getCategoryGradient(category);
    const initial = name ? name.trim().charAt(0).toUpperCase() : 'U';

    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} border ${className}`}
        role="img"
        aria-label={alt || name}
      >
        {/* Background decorative watermark icon */}
        <Icon className="absolute -bottom-3 -right-3 h-28 w-28 opacity-[0.14] pointer-events-none" aria-hidden="true" />
        
        {/* Center Monogram Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 text-center p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 shadow-sm border border-black/5 backdrop-blur-xs transition-transform duration-300 group-hover:scale-110">
            <span className="text-xl font-black tracking-tight text-forest">{initial}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-forest/80 mt-1">
            <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[130px]">{category || 'Profil Usaha'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (src) failedUMKMImageUrls.add(src);
        setFailed(true);
      }}
    />
  );
}
