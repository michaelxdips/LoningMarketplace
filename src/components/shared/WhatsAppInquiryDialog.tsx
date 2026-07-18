/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, UMKM } from '../../types';

interface WhatsAppInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  umkm?: UMKM;
}

export default function WhatsAppInquiryDialog({ isOpen, onClose, product, umkm }: WhatsAppInquiryDialogProps) {
  const merchantName = product ? product.umkmName : (umkm ? umkm.name : 'Nama UMKM');
  const ownerName = umkm ? umkm.owner : (product ? 'Penjual' : 'Pelaku UMKM');
  const phoneNumber = umkm ? umkm.phone : '6281234567890'; // standard indonesian placeholder fallback

  const [visitorName, setVisitorName] = useState('');
  const [visitorQuestion, setVisitorQuestion] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll lock & Focus trap
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

  const handleSend = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        id="wa-dialog-backdrop"
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-cream-card rounded-xl border border-sage-border shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sage-border bg-cream-bg">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-forest/5 text-forest rounded-lg">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 id="wa-dialog-title" className="text-sm font-semibold text-charcoal">
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
            <div className="p-3 bg-sage-light/60 border border-sage-border/80 rounded-lg text-xs text-warm-gray leading-relaxed">
              Silakan lengkapi pesan pertanyaan Anda di bawah ini. Anda akan diarahkan langsung ke aplikasi WhatsApp pelaku UMKM untuk melanjutkan obrolan secara pribadi.
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div>
                <label htmlFor="visitor-name" className="block text-[10px] font-semibold text-warm-gray uppercase tracking-widest mb-1.5">
                  Nama Anda (Opsional)
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  placeholder="Contoh: Budi Prasetyo"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full bg-cream-bg border border-sage-border rounded-lg px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest placeholder:text-warm-gray/40 focus-ring"
                />
              </div>

              <div>
                <label htmlFor="visitor-question" className="block text-[10px] font-semibold text-warm-gray uppercase tracking-widest mb-1.5">
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
                  className="w-full bg-cream-bg border border-sage-border rounded-lg px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest placeholder:text-warm-gray/40 resize-none focus-ring"
                />
              </div>
            </div>

            {/* Dynamic Preview Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-warm-gray uppercase tracking-widest">
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
              <div className="p-3 bg-cream-bg rounded-lg border border-sage-border text-[11px] font-mono leading-relaxed text-warm-gray whitespace-pre-wrap max-h-32 overflow-y-auto">
                {finalMessage}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2.5 p-4 border-t border-sage-border bg-cream-bg">
            <button
              id="wa-dialog-cancel"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-cream-card border border-sage-border text-charcoal hover:bg-sage-light text-xs font-semibold rounded-lg transition-colors focus-ring"
            >
              Batal
            </button>
            <button
              id="wa-dialog-submit"
              onClick={handleSend}
              className="flex-1 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow active:scale-98 transition-all focus-ring"
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
