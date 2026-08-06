import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

const failedProductImageUrls = new Set<string>();

export function ProductImage({
  src,
  alt,
  className = '',
  fitMode = 'auto',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fitMode?: 'auto' | 'cover' | 'contain';
}) {
  const [failed, setFailed] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    setFailed(Boolean(src && failedProductImageUrls.has(src)));
    setIsPortrait(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-cream-tint text-warm-gray ${className}`} role="img" aria-label={alt}>
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  const handleCheckRatio = (img: HTMLImageElement | null) => {
    if (img && fitMode === 'auto' && img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio < 0.95) {
        setIsPortrait(true);
      }
    }
  };

  const applyContain = fitMode === 'contain' || (fitMode === 'auto' && isPortrait);

  return (
    <img
      ref={(img) => {
        if (img && img.complete) {
          handleCheckRatio(img);
        }
      }}
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={(e) => handleCheckRatio(e.currentTarget)}
      className={`${className} ${
        applyContain ? 'object-contain p-1.5 bg-cream-tint' : 'object-cover object-center'
      }`}
      onError={() => {
        if (src) failedProductImageUrls.add(src);
        setFailed(true);
      }}
    />
  );
}
