/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, MessageSquare, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, UMKM } from '../../types';
import { trackPublicEvent } from '../../lib/analytics';

interface WhatsAppInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  umkm?: UMKM;
  source: 'homepage_featured' | 'umkm_detail' | 'product_detail';
}

export default function WhatsAppInquiryDialog({ isOpen, onClose, product, umkm, source }: WhatsAppInquiryDialogProps) {
  const merchantName = product ? product.umkmName : (umkm ? umkm.name : 'Nama UMKM');
  const ownerName = umkm ? umkm.owner : (product ? 'Penjual' : 'Pelaku UMKM');
  const phoneNumber = umkm?.phone;
  const hasContact = Boolean(phoneNumber && umkm?.isContactValid !== false);

  const [visitorName, setVisitorName] = useState('');
  const [visitorQuestion, setVisitorQuestion] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [status, setStatus] = useState('');
  const [popupFallbackUrl, setPopupFallbackUrl] = useState('');

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = (event: Parameters<typeof trackPublicEvent>[0]) => {
    try { trackPublicEvent(event); } catch { /* analytics must not block the CTA */ }
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const backdrop = backdropRef.current;
    const background = backdrop
      ? [...document.body.children, ...Array.from(backdrop.parentElement?.children ?? [])]
        .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop && !element.contains(backdrop))
      : [];
    const uniqueBackground = [...new Set(background)];
    const previous = uniqueBackground.map((element) => ({ element, inert: element.inert, ariaHidden: element.getAttribute('aria-hidden') }));
    for (const element of uniqueBackground) { element.inert = true; element.setAttribute('aria-hidden', 'true'); }
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const { element, inert, ariaHidden } of previous) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', ariaHidden);
      }
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      const trigger = returnFocusRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && hasContact) track({ eventType: 'inquiry_started', source, umkmId: umkm?.id, productId: product?.id });
  }, [isOpen, hasContact, product?.id, source, umkm?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Tab') {
        const focusable: HTMLElement[] = [...(containerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? [])];
        if (!focusable.length) { e.preventDefault(); containerRef.current?.focus(); return; }
        const first = focusable[0], last = focusable.at(-1)!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Formulate neutral conversation starter message
  const introPart = product
    ? `Halo Kak ${ownerName} (${merchantName}), saya tertarik dengan produk *${product.name}* yang saya temukan di katalog digital Desa Loning.`
    : `Halo Kak ${ownerName} (${merchantName}), saya tertarik dengan usaha *${merchantName}* yang saya temukan di direktori digital Desa Loning.`;

  const senderPart = visitorName.trim() ? `\n\nPerkenalkan, nama saya *${visitorName}*.` : '';
  const questionPart = visitorQuestion.trim() 
    ? `\n\nPertanyaan saya:\n"${visitorQuestion}"` 
    : `\n\nApakah produk/layanan ini saat ini tersedia untuk dipesan?`;

  const finalMessage = `${introPart}${senderPart}${questionPart}\n\nTerima kasih!`;
  const encodedMessage = encodeURIComponent(finalMessage);
  const whatsappUrl = phoneNumber ? `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}` : '';

  const handleSend = () => {
    if (!phoneNumber) return;
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      setPopupFallbackUrl(whatsappUrl);
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
      await navigator.clipboard.writeText(finalMessage);
      track({ eventType: 'message_copied', source, umkmId: umkm?.id, productId: product?.id });
      setIsCopied(true);
      setStatus('Pesan berhasil disalin.');
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
      setStatus('Salin secara manual: pilih pesan atau nomor WhatsApp di bawah.');
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="wa-dialog-backdrop"
        ref={backdropRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="wa-dialog-container"
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-dialog-title"
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-cream-card rounded-2xl border border-sage-border shadow-xl flex flex-col overflow-hidden max-h-[90dvh] overscroll-contain"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-sage-border bg-cream-bg">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-terracotta" />
              <div>
                <h3 id="wa-dialog-title" className="font-serif text-base font-semibold text-charcoal">
                  Kirim Pertanyaan
                </h3>
                <p className="text-[11px] text-warm-gray font-medium mt-0.5">
                  Terhubung ke: <span className="text-forest font-semibold">{merchantName}</span>
                </p>
              </div>
            </div>
            <button
              id="wa-dialog-close"
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Tutup dialog"
              className="p-1.5 rounded-lg text-warm-gray hover:bg-sage-light hover:text-charcoal transition-colors focus-ring"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            <p className="text-xs text-warm-gray leading-relaxed">
              Silakan lengkapi pesan pertanyaan Anda di bawah ini. Anda akan diarahkan langsung ke aplikasi WhatsApp pelaku UMKM untuk melanjutkan obrolan secara pribadi.
            </p>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="visitor-name" className="block text-[11px] font-bold text-warm-gray uppercase tracking-wider mb-1.5">
                  Nama Anda (Opsional)
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  placeholder="Contoh: Budi Prasetyo"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full border-0 border-b border-charcoal/20 bg-transparent px-0 py-2 text-sm text-charcoal focus:border-terracotta focus:outline-none focus:ring-0 placeholder:text-warm-gray/50"
                />
              </div>

              <div>
                <label htmlFor="visitor-question" className="block text-[11px] font-bold text-warm-gray uppercase tracking-wider mb-1.5">
                  Pertanyaan Khusus (Opsional)
                </label>
                <textarea
                  id="visitor-question"
                  rows={3}
                  placeholder={
                    product 
                      ? "Contoh: Apakah varian ini ready? Berapa hari waktu produksinya?"
                      : "Contoh: Apakah hari ini toko buka? Apakah menerima pesanan custom?"
                  }
                  value={visitorQuestion}
                  onChange={(e) => setVisitorQuestion(e.target.value)}
                  className="w-full border-0 border-b border-charcoal/20 bg-transparent px-0 py-2 text-sm text-charcoal focus:border-terracotta focus:outline-none focus:ring-0 placeholder:text-warm-gray/50 resize-none"
                />
              </div>
            </div>

            {/* Dynamic Preview Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-warm-gray uppercase tracking-wider">
                  Pratinjau Pesan
                </span>
                <button
                  id="wa-copy-btn"
                  onClick={handleCopy}
                  className="text-[11px] font-semibold text-terracotta hover:text-terracotta-hover flex items-center gap-1 focus-ring rounded px-1"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <span>Salin Pesan</span>
                  )}
                </button>
              </div>
              <div className="p-3 bg-cream-bg rounded-xl border border-sage-border text-[11px] font-mono leading-relaxed text-warm-gray whitespace-pre-wrap max-h-32 overflow-y-auto">
                {finalMessage}
              </div>
              {status.startsWith('Salin secara manual') && <p className="mt-2 text-xs text-warm-gray">Nomor WhatsApp: <span className="select-all font-mono text-charcoal">{phoneNumber}</span></p>}
            </div>
            <p role="status" aria-live="polite" className="text-xs leading-5 text-warm-gray">{status}</p>
            {popupFallbackUrl && <a href={popupFallbackUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex rounded text-xs font-bold text-forest underline">Buka WhatsApp secara langsung</a>}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2.5 p-5 border-t border-sage-border bg-cream-bg">
            <button
              id="wa-dialog-cancel"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-cream-card border border-sage-border text-charcoal hover:bg-sage-light text-xs font-bold rounded-xl transition-colors focus-ring"
            >
              Batal
            </button>
            <button
              id="wa-dialog-submit"
              disabled={!hasContact}
              title={!hasContact ? 'Nomor WhatsApp UMKM belum tersedia.' : undefined}
              onClick={handleSend}
              className="flex-1 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={13} />
              <span>Kirim Pertanyaan</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
