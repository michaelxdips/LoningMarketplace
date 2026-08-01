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
  return (
    <section 
      id="home" 
      className="relative overflow-hidden bg-cream-tint border-b border-sage-border pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8"
    >
      {/* Editorial Decorative Leaf/Flower Background Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true">
        <svg className="absolute right-0 top-0 w-96 h-96" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,0 C60,20 80,40 100,50 C80,60 60,80 50,100 C40,80 20,60 0,50 C20,40 40,20 50,0 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Hero Content Column */}
          <div className="lg:col-span-7 space-y-5 text-left">

            <div className="space-y-3.5">
              <h1 className="text-3xl md:text-5xl font-extrabold text-charcoal tracking-tight leading-tight">
                Temukan Produk Lokal <br className="hidden md:inline" />
                <span className="editorial-serif font-normal italic text-forest">dari Desa Loning</span>
              </h1>
              <p className="text-sm md:text-base text-warm-gray leading-relaxed max-w-2xl">
                Jelajahi produk dan usaha lokal Desa Loning, kenali pelaku usahanya, lalu hubungi langsung melalui WhatsApp. Dukung pertumbuhan usaha warga pedesaan secara berkelanjutan.
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onBrowseProducts}
                className="px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs hover:shadow focus-ring touch-target"
              >
                <span>Jelajahi Produk</span>
                <ArrowRight size={14} />
              </button>
              
              <button
                onClick={onBrowseUMKMs}
                className="px-6 py-3 bg-cream-card hover:bg-sage-light text-charcoal text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors border border-sage-border focus-ring touch-target"
              >
                <Store size={14} className="text-terracotta" />
                <span>Lihat Daftar UMKM</span>
              </button>
            </div>
          </div>

          {/* Hero Media Columns */}
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Product Photography Column */}
              <div className="space-y-4">
                <div className="h-44 md:h-52 overflow-hidden rounded-2xl border border-sage-border/80 shadow-xs relative">
                  <ProductImage
                    src="https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80"
                    alt="Anyaman Bambu Loning"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                </div>
                <div className="h-32 md:h-36 overflow-hidden rounded-2xl border border-sage-border/80 shadow-xs relative">
                  <ProductImage
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80"
                    alt="Kuliner Tradisional Loning"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                </div>
              </div>

              {/* Farmer and Weaver photography column (offset) */}
              <div className="space-y-4 pt-6">
                <div className="h-32 md:h-36 overflow-hidden rounded-2xl border border-sage-border/80 shadow-xs relative">
                  <ProductImage
                    src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=400&q=80"
                    alt="Hasil Tani Kopi Loning"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                </div>
                <div className="h-44 md:h-52 overflow-hidden rounded-2xl border border-sage-border/80 shadow-xs relative">
                  <ProductImage
                    src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80"
                    alt="Mebel Kayu Loning"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
