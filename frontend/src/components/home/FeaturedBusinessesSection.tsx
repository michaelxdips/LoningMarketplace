/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store } from 'lucide-react';
import { UMKM } from '../../types';
import BusinessCard from '../business/BusinessCard';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import DiscoverySearchForm from '../discovery/DiscoverySearchForm';

interface FeaturedBusinessesSectionProps {
  umkms: UMKM[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  onClearFilters?: () => void;
  onViewDetails: (umkm: UMKM) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export default function FeaturedBusinessesSection({ umkms, searchQuery, onSearchChange, onSearchSubmit, onClearFilters, onViewDetails, isLoading, isError, onRetry }: FeaturedBusinessesSectionProps) {
  return (
    <section
      id="umkm" 
      aria-labelledby="featured-businesses-heading"
      aria-busy={isLoading}
      className="py-16 bg-cream-card border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
              Direktori Usaha Rakyat
            </span>
            <h2 id="featured-businesses-heading" className="text-2xl font-extrabold text-charcoal tracking-tight sm:text-3xl">
              Profil Pelaku UMKM Desa
            </h2>
            <p className="text-xs text-warm-gray mt-1.5 leading-relaxed max-w-xl">
              Kenali lebih dekat warga pegiat niaga mandiri yang menggerakkan roda ekonomi Desa Loning. Kunjungi profil untuk membaca informasi jam operasional dan melihat produk mereka.
            </p>
            <p role="status" aria-live="polite" className="mt-3 text-xs font-medium text-forest">
              {isLoading ? 'Memuat UMKM…' : isError ? 'UMKM gagal dimuat.' : `${umkms.length} UMKM ditemukan`}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80 lg:w-[24rem] shrink-0">
            <DiscoverySearchForm
              id="search-umkm-input"
              label="Cari pelaku UMKM"
              placeholder="Cari nama usaha atau pemilik..."
              query={searchQuery}
              onQueryChange={onSearchChange}
              onSubmit={onSearchSubmit ?? (() => onSearchChange(searchQuery))}
              onClear={() => onSearchChange('')}
            />
          </div>
        </div>
        {/* Directory Grid */}
        {isLoading ? <div data-testid="umkms-loading"><LoadingSkeleton count={3} /></div> : isError ? (
          <EmptyState title="Direktori Tidak Dapat Dimuat" description="Terjadi kendala saat mengambil data UMKM. Silakan coba lagi." actionLabel="Coba Lagi" onAction={onRetry} />
        ) : umkms.length === 0 ? (
          <EmptyState
            title="Usaha Tidak Ditemukan"
            description="Tidak ada profil UMKM yang cocok. Hapus filter atau gunakan kata kunci lain."
            actionLabel={onClearFilters && searchQuery.trim() ? 'Hapus Filter' : undefined}
            onAction={onClearFilters && searchQuery.trim() ? onClearFilters : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {umkms.map((umkm) => (
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
