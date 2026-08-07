import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductImage } from './ProductImage';

export interface GalleryImage {
  id: string;
  url: string;
  thumbUrl: string;
  altText: string | null;
  width: number;
  height: number;
}

export function ProductGallery({ images, className = '', aspectRatio = 'aspect-[4/3]' }: { images: GalleryImage[]; className?: string; aspectRatio?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const announceId = `gallery-announce-${images[0]?.id ?? 'empty'}-${currentIndex}`;

  if (!images.length) return <div className={`grid place-items-center bg-cream-tint text-warm-gray ${className} ${aspectRatio}`} role="img" aria-label="Produk tanpa gambar">Produk belum memiliki gambar</div>;
  if (images.length === 1) return <ProductImage src={images[0].url} alt={images[0].altText || ''} className={`${className} ${aspectRatio} w-full object-cover`} />;

  const prev = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  const next = () => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  const select = (index: number) => setCurrentIndex(index);
  const current = images[currentIndex];

  return (
    <div role="region" aria-roledescription="image gallery" aria-label="Galeri produk" className={className}>
      <div className="sr-only" aria-live="polite" aria-atomic="true" id={announceId}>Gambar {currentIndex + 1} dari {images.length}</div>

      <div className={`relative ${aspectRatio} overflow-hidden rounded-2xl border border-sage-border bg-cream-tint`}>
        <ProductImage src={current.url} alt={current.altText || `Gambar produk ${currentIndex + 1}`} className="h-full w-full object-cover" />
        <button type="button" onClick={prev} aria-label="Gambar sebelumnya" className="focus-ring absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-charcoal/50 p-2 text-white hover:bg-charcoal/70 shadow-md"><ChevronLeft size={20} /></button>
        <button type="button" onClick={next} aria-label="Gambar berikutnya" className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-charcoal/50 p-2 text-white hover:bg-charcoal/70 shadow-md"><ChevronRight size={20} /></button>
        <span aria-hidden="true" className="absolute bottom-3 right-3 rounded-full bg-charcoal/70 px-2.5 py-0.5 text-[10px] font-bold text-white">{currentIndex + 1} / {images.length}</span>
      </div>

      <div role="listbox" aria-label="Pilih gambar" aria-orientation="horizontal" className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {images.map((img, i) => (
          <button
            key={img.id}
            role="option"
            aria-selected={i === currentIndex}
            aria-label={`Gambar ${i + 1}: ${img.altText || 'tanpa deskripsi'}`}
            onClick={() => select(i)}
            className={`focus-ring shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === currentIndex ? 'border-forest ring-2 ring-forest/30' : 'border-transparent opacity-70 hover:opacity-100'}`}
          >
            <img src={img.thumbUrl} alt="" className="h-16 w-16 object-cover" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
}
