/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category } from '../../types';
import { ChefHat, Hammer, Sprout, ShoppingBag, Truck } from 'lucide-react';

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
    { name: 'Kerajinan', label: 'Kerajinan', icon: <Hammer size={14} /> },
    { name: 'Pertanian', label: 'Pertanian', icon: <Sprout size={14} /> },
    { name: 'Sembako', label: 'Sembako', icon: <ShoppingBag size={14} /> },
    { name: 'Jasa', label: 'Jasa', icon: <Truck size={14} /> }
  ];

  return (
    <section 
      id="categories" 
      className="py-10 bg-cream-card border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
              Pilih Kategori Usaha
            </span>
            <h2 className="text-2xl font-extrabold text-charcoal tracking-tight sm:text-3xl">
              Kategori Niaga Desa Loning
            </h2>
            <p className="text-xs text-warm-gray mt-1.5 leading-relaxed max-w-xl">
              Saring direktori produk berdasarkan bidang usaha lokal untuk memudahkan pencarian Anda.
            </p>
          </div>
        </div>
        {hasFilters && onClearFilters && <button type="button" onClick={onClearFilters} className="focus-ring mt-4 rounded-lg border border-sage-border px-3 py-2 text-xs font-bold text-forest hover:bg-sage-light/40">Hapus semua filter</button>}

        {/* Scrollable Container with Affordance */}
        <div className="relative">
          {/* Left fading mask for scroll affordance */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-cream-card to-transparent pointer-events-none z-10 md:hidden" />
          
          {/* Scrollable List */}
          <div 
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
                  className={`snap-center flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all touch-target focus-ring shrink-0 border ${
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

          {/* Right fading mask for scroll affordance */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-cream-card to-transparent pointer-events-none z-10 md:hidden" />
        </div>
        
        {/* Helper Hint for mobile */}
        <div className="flex justify-center md:hidden text-[10px] text-warm-gray/60 italic mt-1.5">
          Geser ke samping untuk melihat kategori lainnya
        </div>
      </div>
    </section>
  );
}
