import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

const failedProductImageUrls = new Set<string>();

export function ProductImage({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(() => Boolean(src && failedProductImageUrls.has(src)));
  useEffect(() => setFailed(Boolean(src && failedProductImageUrls.has(src))), [src]);
  if (!src || failed) return <div className={`grid place-items-center bg-cream-tint text-warm-gray ${className}`} role="img" aria-label={alt}><ImageOff className="h-6 w-6" aria-hidden="true" /></div>;
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => { failedProductImageUrls.add(src); setFailed(true); }} />;
}
