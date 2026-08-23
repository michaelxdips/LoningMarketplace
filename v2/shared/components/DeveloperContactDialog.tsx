import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Code2, Send, X } from 'lucide-react';
import { Button } from '@v2-shared/ui/Button';
import { TextAreaField, TextField } from '@v2-shared/ui/Field';
import { cn } from '@v2-shared/ui/cn';

/**
 * Dialog "Hubungi Developer" V2 — pasangan fitur dari UI lama.
 *
 * Mengirim laporan error / pertanyaan langsung ke WhatsApp developer. Format
 * pesan dipertahankan dari UI lama supaya developer menerima struktur yang sama.
 * Kategori disederhanakan menjadi deretan tombol pilihan (bukan ikon), dan
 * seluruh styling memakai token V2.
 */

const DEVELOPER_WHATSAPP = '62818139410';

const CATEGORIES = [
  { id: 'error', label: 'Laporan error / kendala teknikal' },
  { id: 'question', label: 'Pertanyaan seputar platform' },
  { id: 'feature', label: 'Usulan fitur & pengembangan' },
  { id: 'other', label: 'Lainnya' },
] as const;

type ContactCategory = (typeof CATEGORIES)[number]['id'];

export default function DeveloperContactDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [senderName, setSenderName] = useState('');
  const [category, setCategory] = useState<ContactCategory>('error');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [messageError, setMessageError] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

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
    window.setTimeout(() => nameInputRef.current?.focus(), 50);
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
    if (!isOpen) {
      setSenderName('');
      setCategory('error');
      setMessage('');
      setNameError('');
      setMessageError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    let valid = true;
    if (!senderName.trim()) {
      setNameError('Nama pengirim wajib diisi');
      valid = false;
    } else {
      setNameError('');
    }
    if (!message.trim()) {
      setMessageError('Pesan atau deskripsi kendala wajib diisi');
      valid = false;
    } else {
      setMessageError('');
    }
    if (!valid) return;

    const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? 'Lainnya';
    const formattedText = `Halo Michael (Developer Loning Maju),\n\n📌 *Kategori:* ${categoryLabel}\n👤 *Dari:* ${senderName.trim()}\n\n💬 *Pesan / Kendala:*\n${message.trim()}\n\n_(Dikirim melalui Form Kontak Developer Platform Loning Maju)_`;
    window.open(
      `https://wa.me/${DEVELOPER_WHATSAPP}?text=${encodeURIComponent(formattedText)}`,
      '_blank',
      'noopener,noreferrer',
    );
    onClose();
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
        aria-labelledby="v2-dev-dialog-title"
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden bg-surface text-ink shadow-[0_24px_64px_rgba(16,22,18,0.35)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="flex items-start gap-3">
            <Code2 size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <div>
              <h2
                id="v2-dev-dialog-title"
                className="font-display text-lg font-semibold leading-snug tracking-tight text-ink"
              >
                Hubungi Developer
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Laporan error & bantuan teknikal platform
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup form kontak pengembang"
            className="focus-ring-v2 touch-44 -mr-2 -mt-2 inline-flex items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-5">
          <TextField
            ref={nameInputRef}
            label="Nama Anda"
            required
            errorText={nameError || undefined}
            placeholder="Contoh: Pak Budi / Pengelola Desa"
            value={senderName}
            onChange={(event) => {
              setSenderName(event.target.value);
              if (event.target.value.trim()) setNameError('');
            }}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-ink">
              Kategori keperluan <span aria-hidden="true" className="text-accent-ink">*</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'focus-ring-v2 min-h-11 rounded-control border px-4 text-left text-sm transition-colors',
                      isSelected
                        ? 'border-brand bg-brand text-on-brand'
                        : 'border-control-border text-ink hover:bg-sunken',
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <TextAreaField
            label="Pesan / deskripsi kendala"
            required
            rows={4}
            errorText={messageError || undefined}
            placeholder="Tuliskan detail error yang ditemui atau pertanyaan pengembangan di sini…"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (event.target.value.trim()) setMessageError('');
            }}
          />

          <p className="border border-line bg-sunken p-3.5 text-sm leading-relaxed text-ink-muted">
            Pesan yang diisi akan diformat otomatis dan dikirim langsung ke WhatsApp developer.
          </p>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" leadingIcon={<Send size={15} strokeWidth={1.5} />}>
              Kirim via WhatsApp
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
