/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, X, Store } from 'lucide-react';
import { UMKM } from '../../types';
import BusinessCard from '../business/BusinessCard';
import EmptyState from '../shared/EmptyState';

interface FeaturedBusinessesSectionProps {
  umkms: UMKM[];
  onViewDetails: (umkm: UMKM) => void;
}

export default function FeaturedBusinessesSection({ umkms, onViewDetails }: FeaturedBusinessesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Apply search filtering
  const filteredUMKMs = umkms.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <section 
      id="umkm" 
      className="py-16 bg-cream-card border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
              Direktori Usaha Rakyat
            </span>
            <h2 className="text-2xl font-extrabold text-charcoal tracking-tight">
              Profil Pelaku UMKM Desa
            </h2>
            <p className="text-xs text-warm-gray mt-1 leading-relaxed max-w-xl">
              Kenali lebih dekat warga pegiat niaga mandiri yang menggerakkan roda ekonomi Desa Loning. Kunjungi profil untuk membaca informasi jam operasional dan melihat produk mereka.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <label htmlFor="search-umkm-input" className="sr-only">
              Cari pelaku UMKM
            </label>
            <div className="relative">
              <input
                id="search-umkm-input"
                type="text"
                placeholder="Cari nama usaha atau pemilik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-cream-bg border border-sage-border rounded-xl pl-9 pr-8 py-2.5 text-xs text-charcoal placeholder:text-warm-gray/40 focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest focus-ring"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warm-gray">
                <Search size={14} />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-warm-gray hover:text-charcoal focus-ring rounded"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        {filteredUMKMs.length === 0 ? (
          <EmptyState
            title="Usaha Tidak Ditemukan"
            description={`Tidak ada profil UMKM yang cocok dengan kata kunci "${searchQuery}". Silakan coba pencarian lain.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUMKMs.map((umkm) => (
              <BusinessCard
                key={umkm.id}
                umkm={umkm}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
