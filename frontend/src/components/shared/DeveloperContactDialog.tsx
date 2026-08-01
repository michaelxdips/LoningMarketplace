/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Code2, AlertTriangle, HelpCircle, MessageSquare } from 'lucide-react';

interface DeveloperContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ContactCategory = 'error' | 'question' | 'feature' | 'other';

const categories: { id: ContactCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'error', label: 'Laporan Error / Kendala Teknikal', icon: <AlertTriangle size={15} className="text-terracotta" /> },
  { id: 'question', label: 'Pertanyaan Seputar Platform', icon: <HelpCircle size={15} className="text-forest" /> },
  { id: 'feature', label: 'Usulan Fitur & Pengembangan', icon: <Code2 size={15} className="text-forest" /> },
  { id: 'other', label: 'Lainnya', icon: <MessageSquare size={15} className="text-warm-gray" /> },
];

export default function DeveloperContactDialog({ isOpen, onClose }: DeveloperContactDialogProps) {
  const [senderName, setSenderName] = useState('');
  const [category, setCategory] = useState<ContactCategory>('error');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [messageError, setMessageError] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      setSenderName('');
      setCategory('error');
      setMessage('');
      setNameError('');
      setMessageError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    const selectedCategoryLabel = categories.find((c) => c.id === category)?.label || 'Lainnya';
    const formattedText = `Halo Michael (Developer Loning Maju),\n\n📌 *Kategori:* ${selectedCategoryLabel}\n👤 *Dari:* ${senderName.trim()}\n\n💬 *Pesan / Kendala:*\n${message.trim()}\n\n_(Dikirim melalui Form Kontak Developer Platform Loning Maju)_`;

    const waUrl = `https://wa.me/62818139410?text=${encodeURIComponent(formattedText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-dialog-title"
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-sage-border bg-cream-card shadow-2xl transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sage-border bg-forest px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-terracotta">
              <Code2 size={20} />
            </div>
            <div>
              <h2 id="developer-dialog-title" className="text-base font-bold leading-tight">
                Hubungi Developer (Michael)
              </h2>
              <p className="text-[11px] text-cream-tint/75">
                Form laporan error & bantuan teknikal platform Loning Maju
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form kontak pengembang"
            className="focus-ring touch-target rounded-lg p-1.5 text-cream-tint/80 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-charcoal">
          
          {/* Sender Name */}
          <div className="space-y-1.5">
            <label htmlFor="dev-sender-name" className="block text-xs font-bold uppercase tracking-wider text-charcoal">
              Nama Anda <span className="text-terracotta">*</span>
            </label>
            <input
              id="dev-sender-name"
              ref={nameInputRef}
              type="text"
              value={senderName}
              onChange={(e) => {
                setSenderName(e.target.value);
                if (e.target.value.trim()) setNameError('');
              }}
              placeholder="Contoh: Pak Budi / Pengelola Desa"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-charcoal bg-white focus-ring ${
                nameError ? 'border-red-500 ring-red-500' : 'border-sage-border'
              }`}
            />
            {nameError && <p className="text-[11px] font-semibold text-red-600">{nameError}</p>}
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
              Kategori Keperluan <span className="text-terracotta">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs transition-all touch-target focus-ring ${
                      isSelected
                        ? 'border-forest bg-forest/5 font-bold text-forest shadow-xs'
                        : 'border-sage-border bg-white text-warm-gray hover:border-forest/40 hover:text-charcoal'
                    }`}
                  >
                    {cat.icon}
                    <span className="line-clamp-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="dev-message" className="block text-xs font-bold uppercase tracking-wider text-charcoal">
              Pesan / Deskripsi Kendala <span className="text-terracotta">*</span>
            </label>
            <textarea
              id="dev-message"
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) setMessageError('');
              }}
              placeholder="Tuliskan detail error yang ditemui atau pertanyaan pengembangan di sini..."
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-charcoal bg-white focus-ring leading-relaxed ${
                messageError ? 'border-red-500 ring-red-500' : 'border-sage-border'
              }`}
            />
            {messageError && <p className="text-[11px] font-semibold text-red-600">{messageError}</p>}
          </div>

          {/* Notice Box */}
          <div className="rounded-xl border border-sage-border bg-sage-light/30 p-3.5 text-[11px] text-warm-gray leading-relaxed flex items-start gap-2">
            <MessageSquare size={16} className="text-terracotta shrink-0 mt-0.5" />
            <span>
              Pesan yang diisi akan diformat secara otomatis dan dikirimkan langsung ke WhatsApp Developer (Michael).
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring touch-target px-4 py-2.5 rounded-xl border border-sage-border bg-white text-xs font-bold uppercase tracking-wider text-warm-gray hover:bg-sage-light"
            >
              Batal
            </button>

            <button
              type="submit"
              className="focus-ring touch-target flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-forest-hover hover:shadow transition-all"
            >
              <span>Kirim via WhatsApp</span>
              <Send size={14} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
