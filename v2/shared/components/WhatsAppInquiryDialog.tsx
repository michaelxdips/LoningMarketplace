import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, MessageSquare, Send, X } from 'lucide-react';
import type { Product, UMKM } from '@loning/shared';
import { trackPublicEvent } from '@loning/shared/lib/analytics';
import { buildInquiryMessage, buildWhatsAppUrl } from '@v2-shared/lib/whatsapp';
import { Button } from '@v2-shared/ui/Button';
import { TextAreaField, TextField } from '@v2-shared/ui/Field';

/**
 * Dialog "Kirim Pertanyaan" V2 — pasangan fitur dari UI lama.
 *
 * Bedanya dari versi lama hanya styling (token V2, sudut tajam, tanpa motion
 * library): alur transaksi lewat WhatsApp TIDAK boleh berubah, karena ini
 * satu-satunya jalur pembeli menghubungi pelaku usaha.
 *
 * Di-render lewat portal ke <body> lalu #root dibuat inert, jadi konten di
 * belakang tidak bisa di-tab/dibaca pembaca layar selama dialog terbuka.
 */
export default function WhatsAppInquiryDialog({
  isOpen,
  onClose,
  product,
  umkm,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  umkm?: UMKM;
  source: 'homepage_featured' | 'umkm_detail' | 'product_detail';
}) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorQuestion, setVisitorQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const merchantName = product ? product.umkmName : umkm ? umkm.name : 'Nama UMKM';
  const phoneNumber = umkm?.phone;
  const hasContact = Boolean(phoneNumber && umkm?.isContactValid !== false);

  const message = buildInquiryMessage({ product, umkm, visitorName, visitorQuestion });
  const whatsappUrl = phoneNumber ? buildWhatsAppUrl(phoneNumber, message) : '';

  const track = (event: Parameters<typeof trackPublicEvent>[0]) => {
    try {
      trackPublicEvent(event);
    } catch {
      /* analytics tidak boleh memblokir CTA utama */
    }
  };

  // Kunci body + inert #root, lalu kembalikan fokus ke pemicu saat menutup.
  useLayoutEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && hasContact) {
      track({ eventType: 'inquiry_started', source, umkmId: umkm?.id, productId: product?.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasContact]);

  // Escape untuk menutup + jebakan fokus (Tab berputar di dalam dialog).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = [
        ...(panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ];
      if (!focusables.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!phoneNumber) return;
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      setFallbackUrl(whatsappUrl);
      setStatus('Browser memblokir popup WhatsApp. Gunakan tautan langsung di bawah.');
      return;
    }
    track({ eventType: 'whatsapp_opened', source, umkmId: umkm?.id, productId: product?.id });
    onClose();
  };

  const handleCopy = async () => {
    setStatus('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(message);
      track({ eventType: 'message_copied', source, umkmId: umkm?.id, productId: product?.id });
      setIsCopied(true);
      setStatus('Pesan berhasil disalin.');
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
      setStatus('Salin secara manual: pilih pesan atau nomor WhatsApp di bawah.');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="v2-wa-dialog-title"
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden bg-surface text-ink shadow-[0_24px_64px_rgba(16,22,18,0.35)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="flex items-start gap-3">
            <MessageSquare
              size={18}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-accent-ink"
              aria-hidden="true"
            />
            <div>
              <h3
                id="v2-wa-dialog-title"
                className="font-display text-lg font-semibold leading-snug tracking-tight text-ink"
              >
                Kirim Pertanyaan
              </h3>
              <p className="mt-0.5 text-sm text-ink-muted">
                Terhubung ke <span className="font-medium text-ink">{merchantName}</span>
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="focus-ring-v2 touch-44 -mr-2 -mt-2 inline-flex items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            Lengkapi pesan di bawah. Anda akan diarahkan langsung ke WhatsApp pelaku UMKM
            untuk melanjutkan obrolan secara pribadi.
          </p>

          <TextField
            label="Nama Anda"
            helperText="Opsional"
            placeholder="Contoh: Budi Prasetyo"
            value={visitorName}
            onChange={(event) => setVisitorName(event.target.value)}
          />

          <TextAreaField
            label="Pertanyaan khusus"
            helperText="Opsional"
            rows={3}
            placeholder={
              product
                ? 'Contoh: Apakah varian ini ready? Berapa lama waktu produksinya?'
                : 'Contoh: Apakah hari ini toko buka? Apakah menerima pesanan custom?'
            }
            value={visitorQuestion}
            onChange={(event) => setVisitorQuestion(event.target.value)}
          />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                Pratinjau pesan
              </span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="focus-ring-v2 inline-flex items-center gap-1.5 rounded-control px-1 text-sm font-medium text-accent-ink hover:underline"
              >
                {isCopied ? (
                  <>
                    <Check size={14} strokeWidth={1.5} aria-hidden="true" />
                    Tersalin
                  </>
                ) : (
                  'Salin pesan'
                )}
              </button>
            </div>
            <div className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap border border-line bg-sunken p-3 font-mono text-xs leading-relaxed text-ink-muted">
              {message}
            </div>
          </div>

          <p role="status" aria-live="polite" className="text-sm leading-5 text-ink-muted">
            {status}
          </p>

          {status.startsWith('Salin secara manual') && phoneNumber ? (
            <p className="text-sm text-ink-muted">
              Nomor WhatsApp: <span className="select-all font-mono text-ink">{phoneNumber}</span>
            </p>
          ) : null}

          {fallbackUrl ? (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring-v2 inline-block text-sm font-medium text-accent-ink underline underline-offset-4"
            >
              Buka WhatsApp secara langsung
            </a>
          ) : null}
        </div>

        <div className="flex items-center gap-3 border-t border-line p-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            className="flex-1"
            disabled={!hasContact}
            title={!hasContact ? 'Nomor WhatsApp UMKM belum tersedia.' : undefined}
            leadingIcon={<Send size={15} strokeWidth={1.5} />}
            onClick={handleSend}
          >
            Kirim Pertanyaan
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
