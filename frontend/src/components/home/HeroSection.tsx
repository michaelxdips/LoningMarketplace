/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Store } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ProductImage } from '../product/ProductImage';

import produkLokalImg from '../../assets/hero/produk-lokal.png';
import kulinerImg from '../../assets/hero/kuliner.png';
import jasaImg from '../../assets/hero/jasa.png';
import pelakuUmkmImg from '../../assets/hero/pelaku-umkm.png';

interface HeroSectionProps {
  onBrowseProducts: () => void;
  onBrowseUMKMs: () => void;
}

export default function HeroSection({ onBrowseProducts, onBrowseUMKMs }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const trustPoints = [
    { value: 'Terverifikasi', label: 'UMKM desa' },
    { value: 'Langsung', label: 'ke pemilik usaha' },
    { value: 'Tanpa perantara', label: 'via WhatsApp' },
  ];

  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-sage-border bg-cream-tint px-4 pb-14 pt-16 sm:px-6 md:pb-20 md:pt-24 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-12">
          {/* Copy */}
          <motion.div {...fadeUp(0)} className="text-left lg:col-span-7">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
              <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
              Pasar digital warga Desa Loning
            </p>

            <h1 className="mt-6 max-w-3xl font-serif text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-charcoal sm:text-5xl md:text-6xl">
              Temukan produk lokal{' '}
              <span className="font-light italic text-forest">dari Desa Loning</span>
            </h1>

            <p className="mt-6 max-w-2xl font-serif text-lg font-light italic leading-relaxed text-forest sm:text-xl">
              Langsung dari pengrajin dan pelaku usaha desa.
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-warm-gray md:text-base">
              Jelajahi produk dan usaha lokal, kenali pelaku usahanya, lalu hubungi langsung
              melalui WhatsApp. Setiap pilihan Anda ikut menggerakkan ekonomi Desa Loning.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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

            <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-6 border-t border-forest/15 pt-6 sm:grid-cols-3 sm:gap-4">
              {trustPoints.map((point) => (
                <div key={point.value} className="flex flex-col justify-start">
                  <dt className="flex items-center gap-1.5 text-sm font-bold text-charcoal">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" aria-hidden="true" />
                    <span>{point.value}</span>
                  </dt>
                  <dd className="mt-0.5 pl-3 text-xs leading-5 text-warm-gray">{point.label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* Photography collage */}
          <motion.div {...fadeUp(0.12)} className="relative lg:col-span-5">
            <div className="grid grid-cols-2 gap-4" aria-label="Pilihan produk dan usaha Desa Loning">
              <div className="space-y-4">
                <HeroPhoto src={produkLokalImg} alt="Produk lokal kerajinan Desa Loning" label="Produk lokal" className="h-56 md:h-72" priority />
                <HeroPhoto src={kulinerImg} alt="Produk kuliner Desa Loning" label="Kuliner" className="h-36 md:h-44" />
              </div>
              <div className="space-y-4 pt-8">
                <HeroPhoto src={jasaImg} alt="Layanan usaha dan jasa warga Desa Loning" label="Jasa" className="h-36 md:h-44" />
                <HeroPhoto src={pelakuUmkmImg} alt="Pelaku UMKM Desa Loning" label="Pelaku UMKM" className="h-56 md:h-72" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroPhoto({ src, alt, label, className, priority }: { src: string; alt: string; label: string; className: string; priority?: boolean }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl border border-sage-border/80 bg-sage-light shadow-sm ${className}`}>
      <ProductImage src={src} alt={alt} priority={priority} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent" />
      <figcaption className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-charcoal/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
        {label}
      </figcaption>
    </figure>
  );
}
