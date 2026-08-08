/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Category } from '../../types';
import { ChefHat, ChevronLeft, ChevronRight, Hammer, Sprout, ShoppingBag, Truck, Shirt, HardHat, Armchair, Ellipsis } from 'lucide-react';

interface CategorySectionProps {
  selectedCategory: Category | 'Semua';
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onSelectCategory: (category: Category | 'Semua') => void;
}

export default function CategorySection({ selectedCategory, hasFilters = false, onClearFilters, onSelectCategory }: CategorySectionProps) {
  const categoriesList: { name: Category | 'Semua'; label: string; icon: React.ReactNode }[] = [
    { name: 'Semua', label: 'Semua Produk', icon: <ShoppingBag size={14} /> },
    { name: 'Kuliner', label: 'Kuliner', icon: <ChefHat size={14} /> },
    { name: 'Sembako & Kebutuhan Harian', label: 'Sembako & Harian', icon: <ShoppingBag size={14} /> },
    { name: 'Fashion & Konveksi', label: 'Fashion', icon: <Shirt size={14} /> },
    { name: 'Bahan Bangunan & Material', label: 'Bangunan', icon: <HardHat size={14} /> },
    { name: 'Jasa & Otomotif', label: 'Jasa & Otomotif', icon: <Truck size={14} /> },
    { name: 'Pertanian, Peternakan & Perikanan', label: 'Tani & Ternak', icon: <Sprout size={14} /> },
    { name: 'Ritel & Perabot', label: 'Ritel & Perabot', icon: <Armchair size={14} /> },
    { name: 'Kerajinan & Olahan Kreatif', label: 'Kerajinan', icon: <Hammer size={14} /> },
    { name: 'Lainnya', label: 'Lainnya', icon: <Ellipsis size={14} /> },
  ];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateScrollCue = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 2);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 2);
  }, []);
  useEffect(() => {
    updateScrollCue();
    const node = scrollRef.current;
    if (!node) return;
    node.addEventListener('scroll', updateScrollCue, { passive: true });
    const observer = new ResizeObserver(updateScrollCue);
    observer.observe(node);
    return () => { node.removeEventListener('scroll', updateScrollCue); observer.disconnect(); };
  }, [updateScrollCue]);
  const scrollCategories = (direction: -1 | 1) => scrollRef.current?.scrollBy({ left: direction * 180, behavior: 'smooth' });

  return (
    <section 
      id="categories" 
      className="border-b border-sage-border bg-cream-card px-4 py-10 sm:px-6 md:py-12 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="editorial-label mb-2 block">
              Mulai Jelajah
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
              Pilih Kategori Usaha
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray md:text-base">
              Temukan kuliner, kerajinan, hasil tani, kebutuhan harian, dan layanan dari warga Desa Loning.
            </p>
          </div>
        </div>
        {hasFilters && onClearFilters && <button type="button" onClick={onClearFilters} className="focus-ring mt-4 rounded-lg border border-sage-border px-3 py-2 text-xs font-bold text-forest hover:bg-sage-light/40">Hapus semua filter</button>}

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-cream-card to-transparent pointer-events-none z-10 md:hidden" />
          {canScrollLeft && <button type="button" onClick={() => scrollCategories(-1)} aria-label="Geser kategori ke kiri" className="focus-ring absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-sage-border bg-white p-2 text-forest shadow-md sm:flex md:hidden"><ChevronLeft size={16}/></button>}
          <div
            ref={scrollRef}
            className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x"
            role="group"
            aria-label="Filter kategori produk"
          >
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  aria-pressed={isSelected}
                  onClick={() => onSelectCategory(cat.name)}
                  className={`focus-ring touch-target snap-center flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-all ${
                    isSelected
                      ? 'bg-forest text-white border-forest shadow-sm'
                      : 'bg-cream-bg text-warm-gray border-sage-border hover:bg-sage-light/40 hover:text-charcoal'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-terracotta'}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-cream-card to-transparent pointer-events-none z-10 md:hidden" />}
          {canScrollRight && <button type="button" onClick={() => scrollCategories(1)} aria-label="Geser kategori ke kanan" className="focus-ring absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-sage-border bg-white p-2 text-forest shadow-md sm:flex md:hidden"><ChevronRight size={16}/></button>}
        </div>
        <div className="mt-1.5 flex justify-center text-xs italic text-warm-gray/70 md:hidden">
          Geser ke samping untuk melihat kategori lainnya
        </div>
      </div>
    </section>
  );
}
