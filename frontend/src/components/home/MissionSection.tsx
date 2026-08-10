/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, ArrowRight, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Telusuri Produk & UMKM',
    badge: 'Profil Terverifikasi',
    description: 'Temukan aneka produk khas Loning dan profil UMKM terverifikasi murni dari warga desa.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'Hubungi via WhatsApp',
    badge: 'Direct WhatsApp',
    description: 'Klik tombol WhatsApp untuk langsung bertanya stok, tawar harga, atau pesan kustom ke penjual.',
    icon: MessageSquare,
  },
  {
    number: '03',
    title: 'Kesepakatan & Transaksi',
    badge: '100% Bebas Komisi',
    description: 'Sepakati harga dan pengiriman secara langsung. Seluruh hasil penjualan 100% utuh untuk penjual.',
    icon: Zap,
  },
];

export default function MissionSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section aria-labelledby="mission-heading" className="relative overflow-hidden bg-gradient-to-br from-forest via-[#113c24] to-[#092214] py-16 md:py-20 text-white px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Glow Bubbles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sage-light/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="editorial-label text-amber-300/90 tracking-widest text-xs font-bold uppercase">
            Misi & Cara Kerja Platform
          </span>
          <h2 id="mission-heading" className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Satu Klik untuk Menghubungkan Usaha Desa,<br />
            <span className="editorial-serif font-normal italic text-amber-200/90">Menggerakkan Perekonomian Berdikari</span>
          </h2>
          <p className="text-xs sm:text-sm text-cream-tint/80 leading-relaxed max-w-2xl mx-auto pt-1">
            Setiap pesan yang Anda kirimkan kepada pelaku usaha di Desa Loning merupakan dukungan nyata bagi keberlangsungan keluarga perajin dan petani lokal.
          </p>
        </div>

        {/* Unified 3-Step Interactive Process Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isHovered = activeStep === idx;

            return (
              <div
                key={step.number}
                onMouseEnter={() => setActiveStep(idx)}
                onMouseLeave={() => setActiveStep(null)}
                className={`group relative rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between backdrop-blur-md ${
                  isHovered
                    ? 'border-terracotta/50 bg-[#13442a]/80 shadow-xl -translate-y-1'
                    : 'border-emerald-800/40 bg-[#0c2f1d]/60 hover:border-emerald-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-xs font-black tracking-wider">
                      {step.number}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/90 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-700/40">
                      {step.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-terracotta/20 group-hover:text-terracotta transition-all shrink-0">
                      <Icon size={16} />
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                  </div>

                  <p className="text-xs text-cream-tint/75 leading-relaxed pt-1">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integrated Bottom Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-emerald-800/40 text-xs">
          <div className="flex items-center gap-2.5 text-cream-tint/85">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-medium">Mendukung Pertumbuhan Usaha Mikro Pedesaan Secara Berkelanjutan.</span>
          </div>
          <a
            href="/#categories"
            className="focus-ring touch-target inline-flex items-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-terracotta-hover hover:shadow-md shadow-sm"
          >
            <ShoppingBag size={14} />
            <span>Mulai Jelajahi Produk Sekarang</span>
            <ArrowRight size={14} />
          </a>
        </div>

      </div>
    </section>
  );
}
