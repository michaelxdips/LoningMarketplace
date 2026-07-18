/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Clock, User, Phone, MessageSquare, Info, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UMKM, Product } from '../../types';
import { getSavedProducts } from '../../data';

interface UMKMDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  umkm: UMKM;
  onInquireProduct: (product: Product) => void;
  onInquireUMKM: (umkm: UMKM) => void;
}

export default function UMKMDetailDialog({ isOpen, onClose, umkm, onInquireProduct, onInquireUMKM }: UMKMDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'products'>('info');
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Load associated products
  const allProducts = getSavedProducts();
  const associatedProducts = allProducts.filter((p) => p.umkmId === umkm.id);

  // Focus trap & Scroll lock
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

  // Escape listener
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

  return (
    <AnimatePresence>
      <div
        id="umkm-dialog-backdrop"
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="umkm-dialog-container"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="umkm-dialog-title"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-cream-card rounded-xl border border-sage-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header Cover Image */}
          <div className="relative h-44 md:h-56 w-full overflow-hidden shrink-0">
            <img
              src={umkm.imageUrl}
              alt={umkm.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />

            {/* Close button */}
            <button
              id="umkm-dialog-close"
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Tutup detail UMKM"
              className="absolute top-4 right-4 p-2 bg-cream-card/90 hover:bg-cream-card text-charcoal border border-sage-border rounded-full transition-colors focus-ring"
            >
              <X size={16} />
            </button>

            {/* Head Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block px-2 py-0.5 bg-terracotta text-white text-[9px] font-semibold rounded uppercase tracking-widest mb-1.5">
                {umkm.category}
              </span>
              <h2 id="umkm-dialog-title" className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                {umkm.name}
              </h2>
              <p className="text-xs text-white/80 font-medium flex items-center gap-1.5 mt-1">
                <User size={12} className="text-terracotta" />
                <span>Pengelola: <span className="font-bold text-white">{umkm.owner}</span></span>
              </p>
            </div>
          </div>

          {/* Dialog Tabs */}
          <div className="flex border-b border-sage-border bg-cream-bg shrink-0" role="tablist">
            <button
              id="tab-dialog-info"
              role="tab"
              aria-selected={activeTab === 'info'}
              aria-controls="panel-dialog-info"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1.5 focus-ring ${
                activeTab === 'info'
                  ? 'border-forest text-forest bg-cream-card'
                  : 'border-transparent text-warm-gray hover:bg-sage-light/40'
              }`}
            >
              <Info size={14} />
              <span>Profil Usaha</span>
            </button>
            <button
              id="tab-dialog-products"
              role="tab"
              aria-selected={activeTab === 'products'}
              aria-controls="panel-dialog-products"
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1.5 focus-ring ${
                activeTab === 'products'
                  ? 'border-forest text-forest bg-cream-card'
                  : 'border-transparent text-warm-gray hover:bg-sage-light/40'
              }`}
            >
              <Grid size={14} />
              <span>Katalog Produk ({associatedProducts.length})</span>
            </button>
          </div>

          {/* Dialog Body (Scrollable) */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm text-charcoal">
            {activeTab === 'info' && (
              <div id="panel-dialog-info" role="tabpanel" aria-labelledby="tab-dialog-info" className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray mb-1.5">Tentang Usaha</h4>
                  <p className="leading-relaxed text-xs text-warm-gray">{umkm.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sage-border">
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Detail Operasional</h4>
                    {umkm.workingHours && (
                      <div className="flex items-center gap-2 text-xs text-warm-gray">
                        <Clock size={14} className="text-forest shrink-0" />
                        <span>Jam Buka: {umkm.workingHours}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-xs text-warm-gray">
                      <MapPin size={14} className="text-forest shrink-0 mt-0.5" />
                      <span>Alamat: {umkm.address}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Metode Pembelian</h4>
                    <p className="text-xs text-warm-gray leading-relaxed">
                      Hubungi langsung pelaku usaha via tombol WhatsApp di bawah. Pesan otomatis ramah akan dikirim untuk memulai obrolan/tanya jawab.
                    </p>
                  </div>
                </div>

                {/* Minimalist Location Map Placement */}
                <div className="pt-4 border-t border-sage-border">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray mb-2">Simulasi Lokasi Usaha</h4>
                  <div className="w-full h-28 bg-cream-tint rounded-lg border border-sage-border relative overflow-hidden flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 0 30 Q 80 50 160 30 T 320 60 T 480 30 T 640 50 L 640 120 L 0 120 Z" fill="#123E25" />
                      <line x1="100" y1="0" x2="100" y2="120" stroke="#000" strokeWidth="1" strokeDasharray="3" />
                      <line x1="0" y1="50" x2="640" y2="50" stroke="#000" strokeWidth="1" />
                    </svg>
                    <div className="z-10 text-center flex flex-col items-center">
                      <MapPin size={20} className="text-terracotta animate-bounce" />
                      <span className="text-xs font-semibold mt-1 text-charcoal">{umkm.name}</span>
                      <span className="text-[10px] text-warm-gray">Dusun Desa Loning, Pemalang</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div id="panel-dialog-products" role="tabpanel" aria-labelledby="tab-dialog-products" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Katalog Terdaftar</h4>
                  <span className="text-xs text-warm-gray">{associatedProducts.length} Produk</span>
                </div>

                {associatedProducts.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-sage-border rounded-lg text-xs text-warm-gray">
                    UMKM ini belum mempublikasikan foto katalog produk. Hubungi langsung melalui WhatsApp untuk info ketersediaan barang.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {associatedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-cream-card border border-sage-border rounded-lg overflow-hidden flex flex-col transition-card hover:border-forest/30"
                      >
                        <div className="h-28 w-full relative bg-cream-tint">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          {p.unit && (
                            <span className="absolute top-2 right-2 bg-charcoal/85 text-white font-semibold text-[9px] px-1.5 py-0.5 rounded">
                              / {p.unit}
                            </span>
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-grow justify-between">
                          <div>
                            <h5 className="font-semibold text-xs text-charcoal line-clamp-1">{p.name}</h5>
                            <p className="text-xs font-bold text-terracotta mt-0.5">
                              {p.price ? `Rp ${p.price.toLocaleString('id-ID')}` : 'Harga Hubungi Penjual'}
                            </p>
                            <p className="text-[11px] text-warm-gray line-clamp-2 mt-1 leading-relaxed">
                              {p.description}
                            </p>
                          </div>
                          <button
                            id={`inquire-prod-${p.id}`}
                            onClick={() => onInquireProduct(p)}
                            className="w-full mt-2.5 bg-forest hover:bg-forest-hover text-white font-semibold text-[10px] py-1.5 rounded uppercase tracking-wider flex items-center justify-center gap-1 transition-colors focus-ring"
                          >
                            <MessageSquare size={11} />
                            <span>Tanya Produk</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Persistent Footer Call to Actions */}
          <div className="flex items-center gap-2.5 p-4 border-t border-sage-border bg-cream-bg shrink-0">
            <button
              id="umkm-dialog-back"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-cream-card border border-sage-border text-charcoal hover:bg-sage-light text-xs font-semibold rounded-lg transition-colors focus-ring"
            >
              Kembali
            </button>
            <button
              id="umkm-dialog-contact"
              onClick={() => onInquireUMKM(umkm)}
              className="flex-1 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all focus-ring"
            >
              <Phone size={13} />
              <span>Hubungi Pelaku UMKM</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
