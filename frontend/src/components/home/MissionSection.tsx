/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ShieldCheck, MessageSquare, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Telusuri Produk & UMKM',
    description: 'Pilih produk lokal khas Loning atau profil UMKM sesuai kebutuhan Anda.',
    icon: Sparkles,
  },
  {
    number: '02',
    title: 'Hubungi via WhatsApp',
    description: 'Klik tombol tanya untuk membuka obrolan langsung dengan pemilik usaha.',
    icon: MessageSquare,
  },
  {
    number: '03',
    title: 'Kesepakatan & Pengiriman',
    description: 'Negosiasi harga, kustomisasi pesanan, dan pengiriman secara fleksibel.',
    icon: CheckCircle2,
  },
];

export default function MissionSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-forest via-[#113c24] to-[#092214] py-16 md:py-24 text-white px-4 sm:px-6 lg:px-8">
      
      {/* Background Decorative Glow Bubbles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sage-light/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-terracotta text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <Heart size={15} className="fill-terracotta animate-pulse" />
            <span className="text-white">Misi Ekonomi Berdikari</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Satu Klik untuk Menghubungkan Usaha Desa,<br />
            <span className="editorial-serif font-normal italic text-terracotta">Menggerakkan Perekonomian Berdikari</span>
          </h2>

          <p className="text-xs sm:text-sm text-cream-tint/80 leading-relaxed max-w-2xl mx-auto">
            Setiap pesan pertanyaan yang Anda kirimkan kepada pelaku usaha di Desa Loning merupakan dukungan nyata bagi keberlangsungan keluarga perajin dan petani lokal.
          </p>
        </div>

        {/* 3 Impact Pillars - Interactive Glassmorphism Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="group relative rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-terracotta/40 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta/20 flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform">
                <Zap size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
                100% Bebas Komisi
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Tanpa Potongan Perantara</h3>
            <p className="text-xs text-cream-tint/70 leading-relaxed">
              Seluruh hasil transaksi diterima utuh 100% oleh pelaku UMKM warga desa tanpa biaya potongan komisi platform.
            </p>
          </div>

          <div className="group relative rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-terracotta/40 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-forest-hover/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <MessageSquare size={20} className="text-terracotta" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                Direct WhatsApp
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Komunikasi Langsung & Fleksibel</h3>
            <p className="text-xs text-cream-tint/70 leading-relaxed">
              Tanya ketersediaan stok, negosiasi harga, hingga pesanan khusus secara santai dan akrab langsung dengan penjual.
            </p>
          </div>

          <div className="group relative rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-terracotta/40 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta/20 flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full border border-terracotta/20">
                Profil Terverifikasi
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Murni Usaha Warga Desa</h3>
            <p className="text-xs text-cream-tint/70 leading-relaxed">
              Seluruh pelaku usaha yang terdaftar berada dan berkarya secara nyata di wilayah Desa Loning, Petarukan.
            </p>
          </div>

        </div>

        {/* Interactive "Cara Kerja 3 Langkah" Process Guide */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 md:p-8 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cara Kerja Interaksi Loning Maju</span>
                <span className="text-xs font-normal text-cream-tint/60">(Arahkan kursor/sentuh langkah untuk info)</span>
              </h3>
            </div>
            <span className="text-xs text-terracotta font-semibold">3 Langkah Praktis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isHovered = activeStep === idx;

              return (
                <div
                  key={step.number}
                  onMouseEnter={() => setActiveStep(idx)}
                  onMouseLeave={() => setActiveStep(null)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    isHovered
                      ? 'border-terracotta bg-white/15 shadow-md scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-terracotta tracking-widest uppercase">
                      Langkah {step.number}
                    </span>
                    <StepIcon size={16} className={isHovered ? 'text-terracotta' : 'text-cream-tint/50'} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                  <p className="text-xs text-cream-tint/75 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Call to Action Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-cream-tint/70">
            <CheckCircle2 size={16} className="text-terracotta" />
            <span>Mendukung Pertumbuhan Usaha Mikro Pedesaan Secara Berkelanjutan.</span>
          </div>
          <a
            href="/#featured-products"
            className="focus-ring touch-target flex items-center gap-2 font-bold uppercase tracking-wider text-terracotta hover:text-white transition-colors"
          >
            <span>Mulai Jelajahi Produk Sekarang</span>
            <ArrowRight size={14} />
          </a>
        </div>

      </div>
    </section>
  );
}
