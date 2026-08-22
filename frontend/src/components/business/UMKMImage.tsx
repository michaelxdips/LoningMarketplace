/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Store, Utensils, Palette, Wrench, Sprout, ShoppingBag, Shirt, HardHat, Armchair, Ellipsis } from 'lucide-react';
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
    case 'Kerajinan & Olahan Kreatif':
      return Palette;
    case 'Jasa':
    case 'Jasa & Otomotif':
      return Wrench;
    case 'Pertanian':
    case 'Pertanian, Peternakan & Perikanan':
      return Sprout;
    case 'Perdagangan':
    case 'Sembako':
    case 'Sembako & Kebutuhan Harian':
    case 'Ritel & Perabot':
      return ShoppingBag;
    case 'Fashion & Konveksi':
      return Shirt;
    case 'Bahan Bangunan & Material':
      return HardHat;
    case 'Lainnya':
      return Ellipsis;
    default:
      return Store;
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
    const initial = name ? name.trim().charAt(0).toUpperCase() : 'U';

    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-sage-border bg-cream-tint ${className}`}
        role="img"
        aria-label={alt || name}
      >
        {/* Quiet watermark icon — single brand hue, no rainbow */}
        <Icon className="absolute -bottom-3 -right-3 h-28 w-28 text-forest/[0.07]" aria-hidden="true" />

        {/* Center monogram */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 text-center p-3">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-sage-border bg-cream-card text-xl font-serif font-semibold text-forest">
            {initial}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warm-gray">
            <Icon className="h-3 w-3 shrink-0 text-terracotta" aria-hidden="true" />
            <span className="truncate max-w-[130px]">{category || 'Profil Usaha'}</span>
          </span>
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
