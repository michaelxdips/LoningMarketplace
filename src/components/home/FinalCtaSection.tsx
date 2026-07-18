/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Store, ArrowRight } from 'lucide-react';

interface FinalCtaSectionProps {
  onBrowseProducts: () => void;
  onBrowseUMKMs: () => void;
}

export default function FinalCtaSection({ onBrowseProducts, onBrowseUMKMs }: FinalCtaSectionProps) {
  return (
    <section className="py-16 bg-cream-tint border-b border-sage-border px-4 sm:px-6 lg:px-8 text-center relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" aria-hidden="true">
        <svg className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[500px] h-[500px]" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="2" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block">
          Mulai Penjelajahan
        </span>

        <h2 className="text-2xl md:text-3xl font-extrabold text-charcoal tracking-tight">
          Temukan Produk Lokal Desa Loning
        </h2>

        <p className="text-xs md:text-sm text-warm-gray max-w-xl mx-auto leading-relaxed">
          Jelajahi katalog produk pilihan dan hubungi langsung pelaku UMKM yang Anda pilih melalui WhatsApp. Transaksi aman, akrab, tanpa perantara.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={onBrowseProducts}
            className="w-full sm:w-auto px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors focus-ring shadow-sm hover:shadow"
          >
            <span>Jelajahi Produk</span>
            <ArrowRight size={14} />
          </button>
          
          <button
            onClick={onBrowseUMKMs}
            className="w-full sm:w-auto px-6 py-3 bg-cream-card hover:bg-sage-light text-charcoal text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-sage-border focus-ring"
          >
            <Store size={14} className="text-terracotta" />
            <span>Lihat Daftar UMKM</span>
          </button>
        </div>
      </div>
    </section>
  );
}
