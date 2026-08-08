/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronDown, ChevronUp, Store } from 'lucide-react';
import { useState } from 'react';
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
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 12;
  const displayedUmkms = showAll ? umkms : umkms.slice(0, displayLimit);
  const hasMore = umkms.length > displayLimit;

  return (
    <section
      id="umkm" 
      aria-labelledby="featured-businesses-heading"
      aria-busy={isLoading}
      className="py-16 bg-cream-card border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] md:items-center">
          <div className="min-w-0">
            <span className="editorial-label mb-1.5 block">
              Direktori Usaha Rakyat
            </span>
            <h2 id="featured-businesses-heading" className="text-2xl font-extrabold text-charcoal tracking-tight sm:text-3xl">
              Profil Pelaku UMKM Desa
            </h2>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-warm-gray sm:text-sm">
              Kenali lebih dekat warga pegiat niaga mandiri yang menggerakkan roda ekonomi Desa Loning. Kunjungi profil untuk membaca informasi jam operasional dan melihat produk mereka.
            </p>
            <p role="status" aria-live="polite" aria-atomic="true" className="mt-2.5 text-xs font-semibold text-forest">
              {isLoading
                ? 'Memuat UMKM…'
                : isError
                ? 'Gagal memuat UMKM.'
                : umkms.length === 0
                ? 'Tidak ada UMKM yang sesuai.'
                : hasMore && !showAll
                ? `Ditemukan ${umkms.length} UMKM (menampilkan 12 teratas).`
                : `Ditemukan ${umkms.length} UMKM.`}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full shrink-0">
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
        {isLoading ? <div data-testid="umkms-loading"><LoadingSkeleton type="umkm" count={3} /></div> : isError ? (
          <EmptyState title="Direktori Tidak Dapat Dimuat" description="Terjadi kendala saat mengambil data UMKM. Silakan coba lagi." actionLabel="Coba Lagi" onAction={onRetry} />
        ) : umkms.length === 0 ? (
          <EmptyState
            title="Usaha Tidak Ditemukan"
            description="Tidak ada profil UMKM yang cocok. Hapus filter atau gunakan kata kunci lain."
            actionLabel={onClearFilters && searchQuery.trim() ? 'Hapus Filter' : undefined}
            onAction={onClearFilters && searchQuery.trim() ? onClearFilters : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedUmkms.map((umkm) => (
                <BusinessCard
                  key={umkm.id}
                  umkm={umkm}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-sage-border bg-white px-6 py-3 text-sm font-extrabold text-forest hover:bg-cream-bg shadow-sm transition-all"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Persingkat Tampilan (12 Teratas)
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Tampilkan Selengkapnya ({umkms.length} UMKM)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
