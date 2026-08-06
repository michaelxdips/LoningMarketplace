/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, Sparkles, ArrowRight, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Telusuri Produk & UMKM',
    description: 'Temukan aneka produk khas Loning atau profil UMKM sesuai kebutuhan Anda.',
    icon: Sparkles,
  },
  {
    number: '02',
    title: 'Hubungi via WhatsApp',
    description: 'Klik tombol WhatsApp untuk langsung terhubung dengan pemilik usaha.',
    icon: MessageSquare,
  },
  {
    number: '03',
    title: 'Kesepakatan & Transaksi',
    description: 'Sepakati harga, kustomisasi pesanan, dan pengiriman secara langsung.',
    icon: CheckCircle2,
  },
];

const pillars = [
  {
    icon: Zap,
    badge: '100% Bebas Komisi',
    title: 'Tanpa Potongan Perantara',
    description: 'Seluruh hasil penjualan diterima 100% utuh oleh warga desa tanpa biaya potongan komisi platform.',
  },
  {
    icon: MessageSquare,
    badge: 'Direct WhatsApp',
    title: 'Komunikasi Langsung & Fleksibel',
    description: 'Tanya stok, tawar harga, hingga pesan kustom secara cepat dan akrab langsung kepada penjual.',
  },
  {
    icon: ShieldCheck,
    badge: 'Profil Terverifikasi',
    title: 'Murni Usaha Warga Desa',
    description: 'Seluruh usaha yang terdaftar berada dan berkarya secara nyata di wilayah Desa Loning, Petarukan.',
  },
];

export default function MissionSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section aria-labelledby="mission-heading" className="relative overflow-hidden bg-gradient-to-br from-forest via-[#113c24] to-[#092214] py-16 md:py-24 text-white px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Glow Bubbles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sage-light/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="editorial-label text-terracotta tracking-widest text-xs font-bold uppercase">
            Misi & Cara Kerja Platform
          </span>
          <h2 id="mission-heading" className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Satu Klik untuk Menghubungkan Usaha Desa,<br />
            <span className="editorial-serif font-normal italic text-terracotta">Menggerakkan Perekonomian Berdikari</span>
          </h2>
          <p className="text-xs sm:text-sm text-cream-tint/80 leading-relaxed max-w-2xl mx-auto pt-1">
            Setiap pesan yang Anda kirimkan kepada pelaku usaha di Desa Loning merupakan dukungan nyata bagi keberlangsungan keluarga perajin dan petani lokal.
          </p>
        </div>

        {/* 1. Keunggulan Utama (Impact Pillars) */}
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-terracotta">
              Keunggulan Direktori Desa
            </h3>
            <span className="text-[11px] font-medium text-cream-tint/60">Transparan & Langsung</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-terracotta/40 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-terracotta/20 flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform">
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-xs text-cream-tint/75 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Cara Kerja 3 Langkah (Process Flow) */}
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-terracotta">
              Cara Kerja Interaksi (3 Langkah Mudah)
            </h3>
            <span className="text-[11px] font-medium text-cream-tint/60">Langsung ke WhatsApp Penjual</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isHovered = activeStep === idx;

              return (
                <div
                  key={step.number}
                  onMouseEnter={() => setActiveStep(idx)}
                  onMouseLeave={() => setActiveStep(null)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                    isHovered
                      ? 'border-terracotta bg-white/15 shadow-md -translate-y-0.5'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-terracotta/20 text-terracotta text-xs font-black">
                        {step.number}
                      </span>
                      <StepIcon size={18} className={isHovered ? 'text-terracotta' : 'text-cream-tint/50'} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{step.title}</h4>
                    <p className="text-xs text-cream-tint/75 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/15 text-xs">
          <div className="flex items-center gap-2 text-cream-tint/80">
            <CheckCircle2 size={16} className="text-terracotta shrink-0" />
            <span>Mendukung Pertumbuhan Usaha Mikro Pedesaan Secara Berkelanjutan.</span>
          </div>
          <a
            href="/#categories"
            className="focus-ring touch-target inline-flex items-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-terracotta-hover shadow-sm"
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
