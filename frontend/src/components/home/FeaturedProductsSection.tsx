/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Grid, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, Category } from '../../types';
import ProductCard from '../product/ProductCard';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import DiscoverySearchForm from '../discovery/DiscoverySearchForm';

interface FeaturedProductsSectionProps {
  products: Product[];
  selectedCategory: Category | 'Semua';
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  onClearFilters?: () => void;
  onInquireProduct: (product: Product) => void;
  onViewProduct: (product: Product, trigger: HTMLElement, source: 'homepage_featured') => void;
  onViewMerchant: (merchantId: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export default function FeaturedProductsSection({
  products,
  selectedCategory,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearFilters,
  onInquireProduct,
  onViewProduct,
  onViewMerchant, isLoading, isError, onRetry
}: FeaturedProductsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 12;
  const displayedProducts = showAll ? products : products.slice(0, displayLimit);
  const hasMore = products.length > displayLimit;

  return (
    <section
      id="featured-products" 
      aria-labelledby="featured-products-heading"
      aria-busy={isLoading}
      className="py-16 bg-cream-bg border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] md:items-center">
          <div className="min-w-0">
            <span className="editorial-label mb-1.5 block">
              Etalase Niaga Desa
            </span>
            <h2 id="featured-products-heading" className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
              Katalog Produk Warga
            </h2>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-warm-gray sm:text-sm">
              Telusuri aneka produk pilihan hasil karya mandiri masyarakat Desa Loning. Klik tombol tanya produk untuk tersambung ke WhatsApp penjual.
            </p>
            <p role="status" aria-live="polite" aria-atomic="true" className="mt-2.5 text-xs font-semibold text-forest">
              {isLoading
                ? 'Memuat produk…'
                : isError
                ? 'Gagal memuat produk.'
                : products.length === 0
                ? 'Tidak ada produk yang sesuai.'
                : hasMore && !showAll
                ? `Ditemukan ${products.length} produk (menampilkan 12 teratas).`
                : `Ditemukan ${products.length} produk.`}
            </p>
          </div>

          {/* Search Box with Accessible Labels */}
          <div className="w-full md:justify-self-end">
            <DiscoverySearchForm
              id="search-products-input"
              label="Cari produk lokal"
              placeholder="Cari produk atau nama UMKM..."
              query={searchQuery}
              onQueryChange={onSearchChange}
              onSubmit={onSearchSubmit ?? (() => onSearchChange(searchQuery))}
              onClear={() => onSearchChange('')}
            />
          </div>
        </div>

        {/* Dynamic Category Filtering Info Badge */}
        {selectedCategory !== 'Semua' && (
          <div className="mb-4 flex w-fit items-center gap-2 rounded-lg border border-sage-border bg-sage-light/40 p-2.5 text-xs text-warm-gray">
            <Grid size={12} className="text-forest" />
            <span>
              Menampilkan kategori: <strong className="text-forest">{selectedCategory}</strong>
            </span>
          </div>
        )}
        {/* Displaying Products or Empty State */}
        {isLoading ? <div data-testid="products-loading"><LoadingSkeleton count={3} /></div> : isError ? (
          <EmptyState title="Katalog Tidak Dapat Dimuat" description="Terjadi kendala saat mengambil katalog produk. Silakan coba lagi." actionLabel="Coba Lagi" onAction={onRetry} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Produk Tidak Ditemukan"
            description="Tidak ada produk yang cocok. Hapus filter atau gunakan kata kunci lain."
            actionLabel={onClearFilters && (Boolean(searchQuery.trim()) || selectedCategory !== 'Semua') ? 'Hapus Filter' : undefined}
            onAction={onClearFilters && (Boolean(searchQuery.trim()) || selectedCategory !== 'Semua') ? onClearFilters : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onInquire={onInquireProduct}
                  onViewProduct={onViewProduct}
                  onViewMerchant={onViewMerchant}
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
                      Tampilkan Selengkapnya ({products.length} Produk)
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
