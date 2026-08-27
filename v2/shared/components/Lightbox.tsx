import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@v2-shared/ui/cn';

/**
 * Lightbox galeri V2 — tampil penuh resolusi untuk galeri produk.
 *
 * Dipakai oleh halaman detail produk (desktop & mobile). Kontrak a11y sama
 * dengan dialog lain: portal ke body, #root inert, focus trap, Escape menutup,
 * panah kiri/kanan berpindah gambar. Tanpa library motion — transisi cukup
 * lewat opacity/scale CSS yang sudah digerbangi prefers-reduced-motion.
 */

export interface LightboxImage {
  id: string;
  url: string;
  altText?: string | null;
}

export default function Lightbox({
  images,
  startIndex,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
  /** Dipanggil saat index berubah (untuk sinkron dengan thumbnail halaman). */
  onNavigate?: (index: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const clampedIndex = Math.max(0, Math.min(index, images.length - 1));
  const current = images[clampedIndex];

  const goTo = useCallback(
    (next: number) => {
      const wrapped = (next + images.length) % images.length;
      setIndex(wrapped);
      onNavigate?.(wrapped);
    },
    [images.length, onNavigate],
  );

  // Body lock + inert + return focus.
  useLayoutEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (root) {
      root.inert = true;
      root.setAttribute('aria-hidden', 'true');
    }
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (root) {
        root.inert = false;
        root.removeAttribute('aria-hidden');
      }
      const trigger = returnFocusRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  // Keyboard: Escape + panah kiri/kanan + focus trap.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(clampedIndex - 1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(clampedIndex + 1);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [],
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clampedIndex, goTo, onClose]);

  if (!current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-ink/95"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Bar atas */}
      <div className="flex items-center justify-between gap-4 p-4 text-on-brand">
        <p className="numeric text-sm text-on-brand/70">
          {clampedIndex + 1} / {images.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Tutup tampilan penuh"
          className="focus-ring-v2 touch-44 inline-flex items-center justify-center rounded-control text-on-brand/80 transition-colors hover:bg-on-brand/10 hover:text-on-brand"
        >
          <X size={22} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {/* Gambar */}
      <div ref={panelRef} className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <img
          key={current.id}
          src={current.url}
          alt={current.altText || `Gambar ${clampedIndex + 1}`}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(clampedIndex - 1)}
              aria-label="Gambar sebelumnya"
              className="focus-ring-v2 touch-44 absolute left-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-control bg-ink/40 p-3 text-on-brand transition-colors hover:bg-ink/60 sm:left-4"
            >
              <ChevronLeft size={24} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(clampedIndex + 1)}
              aria-label="Gambar berikutnya"
              className="focus-ring-v2 touch-44 absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-control bg-ink/40 p-3 text-on-brand transition-colors hover:bg-ink/60 sm:right-4"
            >
              <ChevronRight size={24} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {/* Titik indikator */}
      {images.length > 1 ? (
        <div className="flex justify-center gap-2 pb-6">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ke gambar ${i + 1}`}
              aria-current={i === clampedIndex}
              className={cn(
                'focus-ring-v2 h-2 rounded-full transition-all',
                i === clampedIndex ? 'w-6 bg-on-brand' : 'w-2 bg-on-brand/40 hover:bg-on-brand/60',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
