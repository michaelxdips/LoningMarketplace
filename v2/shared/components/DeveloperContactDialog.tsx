import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Code2, Send, X } from 'lucide-react';
import { TextAreaField, TextField } from '@v2-shared/ui/Field';
import { Button } from '@v2-shared/ui/Button';
import { cn } from '@v2-shared/ui/cn';

const DEVELOPER_WHATSAPP = '62818139410';

const CATEGORIES = [
  { id: 'bug', label: 'Laporan Kendala / Bug' },
  { id: 'question', label: 'Pertanyaan Platform' },
  { id: 'feature', label: 'Usulan Fitur Baru' },
  { id: 'other', label: 'Keperluan Lainnya' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

export default function DeveloperContactDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const headingId = useId();
  const [senderName, setSenderName] = useState('');
  const [category, setCategory] = useState<CategoryId>('bug');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [messageError, setMessageError] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
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
      <div className="absolute inset-0 bg-ink/60" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden border border-line bg-surface text-ink shadow-md"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="flex items-start gap-3">
            <Code2 size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <div>
              <h2
                id={headingId}
                className="font-display text-base font-semibold tracking-tight text-ink"
              >
                Hubungi Developer
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Laporan error & bantuan teknikal platform Loning Maju
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
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5 text-xs">
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
            <label className="mb-1.5 block font-medium text-ink">
              Kategori keperluan <span aria-hidden="true" className="text-accent-ink">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'focus-ring-v2 min-h-10 rounded-control border px-3 text-left text-xs transition-colors',
                      isSelected
                        ? 'border-brand bg-brand font-medium text-on-brand'
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
            placeholder="Tuliskan detail kendala atau pertanyaan Anda di sini…"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (event.target.value.trim()) setMessageError('');
            }}
          />

          <p className="border border-line bg-sunken p-3 text-[11px] leading-relaxed text-ink-muted">
            Pesan yang diisi akan diformat otomatis dan diteruskan langsung ke WhatsApp developer.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" size="md" leadingIcon={<Send size={14} strokeWidth={1.5} />}>
              Kirim via WhatsApp
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
