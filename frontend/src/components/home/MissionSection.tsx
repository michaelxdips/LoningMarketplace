/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Telusuri Produk & UMKM',
    description: 'Temukan aneka produk khas Loning dan profil UMKM terverifikasi murni dari warga desa.',
  },
  {
    number: '02',
    title: 'Hubungi via WhatsApp',
    description: 'Klik tombol WhatsApp untuk langsung bertanya stok, tawar harga, atau pesan kustom ke penjual.',
  },
  {
    number: '03',
    title: 'Kesepakatan & Transaksi',
    description: 'Sepakati harga dan pengiriman secara langsung. Seluruh hasil penjualan 100% utuh untuk penjual.',
  },
];

export default function MissionSection() {
  return (
    <section
      aria-labelledby="mission-heading"
      className="border-b border-sage-border bg-cream-card px-4 py-16 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Editorial header */}
        <div className="mb-12 max-w-3xl md:mb-16">
          <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
            Misi & Cara Kerja
          </p>
          <h2
            id="mission-heading"
            className="mt-5 font-serif text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-4xl md:text-5xl"
          >
            Satu klik menghubungkan usaha desa,{' '}
            <span className="font-light italic text-forest">menggerakkan ekonomi berdikari.</span>
          </h2>
        </div>

        {/* Numbered steps — editorial index, not icon tiles */}
        <div className="grid grid-cols-1 gap-10 border-t border-forest/15 pt-10 md:grid-cols-3 md:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col">
              <span className="font-serif text-5xl font-light leading-none text-terracotta/90 md:text-6xl">
                {step.number}
              </span>
              <h3 className="mt-5 font-serif text-xl font-semibold text-charcoal">{step.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-7 text-warm-gray">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom note + action */}
        <div className="mt-14 flex flex-col gap-5 border-t border-sage-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-7 text-warm-gray">
            Setiap pesan yang Anda kirimkan kepada pelaku usaha di Desa Loning merupakan dukungan
            nyata bagi keberlangsungan keluarga perajin dan petani lokal.
          </p>
          <a
            href="/#categories"
            className="focus-ring touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-terracotta px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-terracotta-hover"
          >
            Mulai Jelajahi Produk
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
