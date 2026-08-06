/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Store } from 'lucide-react';
import { ProductImage } from '../product/ProductImage';

interface HeroSectionProps {
  onBrowseProducts: () => void;
  onBrowseUMKMs: () => void;
}

export default function HeroSection({ onBrowseProducts, onBrowseUMKMs }: HeroSectionProps) {
  const trustPoints = [
    { value: 'Terverifikasi', label: 'UMKM desa' },
    { value: 'Langsung', label: 'ke pemilik usaha' },
    { value: 'Tanpa perantara', label: 'via WhatsApp' },
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-sage-border bg-cream-tint px-4 py-14 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-7 text-left lg:col-span-7">
            <div className="space-y-4">
              <span className="editorial-label block">Pasar digital warga Desa Loning</span>
              <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-charcoal md:text-6xl">
                Temukan Produk Lokal{' '}
                <span className="editorial-serif font-normal italic text-forest">dari Desa Loning</span>
              </h1>
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-forest md:text-lg">
                Langsung dari pengrajin dan pelaku usaha desa.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-warm-gray md:text-base">
                Jelajahi produk dan usaha lokal, kenali pelaku usahanya, lalu hubungi langsung melalui WhatsApp. Setiap pilihan Anda ikut menggerakkan ekonomi Desa Loning.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center">
              <button
                id="hero-browse-products"
                type="button"
                onClick={onBrowseProducts}
                className="focus-ring touch-target flex items-center justify-center gap-2 rounded-xl bg-forest px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-hover hover:shadow-lg"
              >
                <span>Jelajahi Produk Loning</span>
                <ArrowRight size={16} />
              </button>
              <button
                id="hero-browse-umkms"
                type="button"
                onClick={onBrowseUMKMs}
                className="focus-ring touch-target flex items-center justify-center gap-2 rounded-xl border border-forest/20 bg-cream-card px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-charcoal shadow-xs transition-all hover:border-forest/40 hover:bg-sage-light"
              >
                <Store size={16} className="text-terracotta" />
                <span>Lihat Daftar UMKM</span>
              </button>
            </div>

            <dl className="grid max-w-2xl grid-cols-1 gap-4 border-t border-forest/15 pt-5 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.value} className="flex flex-col justify-start">
                  <dt className="text-sm font-extrabold text-charcoal flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-terracotta shrink-0" aria-hidden="true" />
                    <span>{point.value}</span>
                  </dt>
                  <dd className="mt-0.5 text-xs leading-5 text-warm-gray pl-3">{point.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-5">
            <div className="grid grid-cols-2 gap-4" aria-label="Pilihan produk dan usaha Desa Loning">
              <div className="space-y-4">
                <HeroPhoto src="/images/hero/produk-loning-1.jpg" alt="Produk lokal Desa Loning" label="Produk lokal" className="h-56 md:h-64" priority />
                <HeroPhoto src="/images/hero/produk-loning-2.jpg" alt="Produk kuliner Desa Loning" label="Kuliner" className="h-36 md:h-40" />
              </div>
              <div className="space-y-4 pt-8">
                <HeroPhoto src="/images/hero/produk-loning-3.jpg" alt="Layanan usaha warga Desa Loning" label="Jasa" className="h-36 md:h-40" />
                <HeroPhoto src="/images/hero/pelaku-umkm-loning.jpg" alt="Pelaku UMKM Desa Loning" label="Pelaku UMKM" className="h-56 md:h-64" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPhoto({ src, alt, label, className, priority }: { src: string; alt: string; label: string; className: string; priority?: boolean }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl border border-sage-border/80 bg-sage-light shadow-sm ${className}`}>
      <ProductImage src={src} alt={alt} priority={priority} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent" />
      <figcaption className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-charcoal/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
        {label}
      </figcaption>
    </figure>
  );
}
