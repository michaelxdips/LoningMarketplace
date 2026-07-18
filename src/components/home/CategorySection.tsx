/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category } from '../../types';
import { ChefHat, Hammer, Sprout, ShoppingBag, Truck } from 'lucide-react';

interface CategorySectionProps {
  selectedCategory: Category | 'Semua';
  onSelectCategory: (category: Category | 'Semua') => void;
}

export default function CategorySection({ selectedCategory, onSelectCategory }: CategorySectionProps) {
  const categoriesList: { name: Category | 'Semua'; label: string; icon: React.ReactNode }[] = [
    { name: 'Semua', label: 'Semua Produk', icon: <ShoppingBag size={14} /> },
    { name: 'Kuliner', label: 'Kuliner', icon: <ChefHat size={14} /> },
    { name: 'Kerajinan', label: 'Kerajinan', icon: <Hammer size={14} /> },
    { name: 'Pertanian', label: 'Pertanian', icon: <Sprout size={14} /> },
    { name: 'Sembako', label: 'Sembako', icon: <ShoppingBag size={14} /> },
    { name: 'Jasa', label: 'Jasa & Mebel', icon: <Truck size={14} /> }
  ];

  return (
    <section 
      id="categories" 
      className="py-10 bg-cream-card border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center md:text-left md:flex md:items-end md:justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
              Pilih Kategori Usaha
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-charcoal tracking-tight">
              Kategori Niaga Desa Loning
            </h2>
          </div>
          <p className="text-xs text-warm-gray mt-1.5 md:mt-0 max-w-sm">
            Saring direktori produk berdasarkan bidang usaha lokal untuk memudahkan pencarian Anda.
          </p>
        </div>

        {/* Scrollable Container with Affordance */}
        <div className="relative">
          {/* Left fading mask for scroll affordance */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-cream-card to-transparent pointer-events-none z-10 md:hidden" />
          
          {/* Scrollable List */}
          <div 
            className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x"
            role="tablist"
            aria-label="Kategori Produk"
          >
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  role="tab"
                  aria-selected={isSelected}
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
