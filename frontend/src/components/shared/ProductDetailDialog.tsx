import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../lib/price';
import { ProductImage } from '../product/ProductImage';

interface ProductDetailDialogProps {
  isOpen: boolean;
  product: Product;
  onClose: () => void;
  onInquire: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export default function ProductDetailDialog({ isOpen, product, onClose, onInquire, returnFocusRef }: ProductDetailDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKeyDown); requestAnimationFrame(() => returnFocusRef?.current?.focus()); };
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) return null;
  const availability = product.isAvailable ? 'Tersedia' : 'Saat ini tidak tersedia';

  return (
    <div id="product-dialog-backdrop" className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/40 p-4 backdrop-blur-xs" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} id="product-dialog-container" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden overscroll-contain rounded-xl border border-sage-border bg-cream-card shadow-2xl">
        <div className="relative h-48 shrink-0 overflow-hidden bg-cream-tint sm:h-60">
          <ProductImage src={product.imageUrl} alt={product.altText || product.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
          <button id="product-dialog-close" ref={closeButtonRef} type="button" onClick={onClose} aria-label="Tutup detail produk" className="focus-ring absolute right-4 top-4 rounded-full border border-sage-border bg-cream-card/90 p-2 text-charcoal hover:bg-cream-card"><X size={17} /></button>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="mb-1.5 inline-block rounded bg-terracotta px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest">{product.category}</span>
            <h2 id="product-dialog-title" className="text-xl font-semibold tracking-tight sm:text-2xl">{product.name}</h2>
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm sm:p-6">
          <div className="grid grid-cols-2 gap-4 border-b border-sage-border pb-4 sm:grid-cols-3">
            <div><span className="block text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Harga</span><strong className="mt-1 block text-base text-forest">{formatPrice(product.price)}</strong>{product.unit && <span className="text-xs text-warm-gray">per {product.unit}</span>}</div>
            <div><span className="block text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Ketersediaan</span><strong className={`mt-1 block text-sm ${product.isAvailable ? 'text-forest' : 'text-warm-gray'}`}>{availability}</strong></div>
            <div className="col-span-2 sm:col-span-1"><span className="block text-[10px] font-semibold uppercase tracking-widest text-warm-gray">UMKM</span><strong className="mt-1 block text-sm text-charcoal">{product.umkmName}</strong></div>
          </div>
          {product.description.trim() && <div><h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Deskripsi</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-warm-gray">{product.description}</p></div>}
        </div>
        <div className="flex shrink-0 items-center justify-end border-t border-sage-border bg-cream-bg p-4">
          <button id="product-dialog-inquire" type="button" onClick={onInquire} className="focus-ring touch-target flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-hover"><MessageSquare size={14} /><span>Tanya Produk</span></button>
        </div>
      </div>
    </div>
  );
}