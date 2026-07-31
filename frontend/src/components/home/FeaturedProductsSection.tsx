/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grid } from 'lucide-react';
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
  return (
    <section
      id="featured-products" 
      aria-labelledby="featured-products-heading"
      aria-busy={isLoading}
      className="py-16 bg-cream-bg border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
              Etalase Niaga Desa
            </span>
            <h2 id="featured-products-heading" className="text-2xl font-extrabold text-charcoal tracking-tight">
              Katalog Produk Warga
            </h2>
            <p className="text-xs text-warm-gray mt-1 leading-relaxed max-w-xl">
              Telusuri aneka produk pilihan hasil karya mandiri masyarakat Desa Loning. Klik tombol tanya produk untuk tersambung ke WhatsApp penjual.
            </p>
          </div>

          {/* Search Box with Accessible Labels */}
          <div className="relative w-full md:max-w-xs shrink-0">
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
          <div className="flex items-center gap-2 mb-6 text-xs text-warm-gray bg-sage-light/40 border border-sage-border rounded-lg p-2.5 w-fit">
            <Grid size={12} className="text-forest" />
            <span>
              Menampilkan kategori: <strong className="text-forest">{selectedCategory}</strong>
            </span>
          </div>
        )}

        <p role="status" aria-live="polite" className="mb-5 text-xs text-warm-gray">
          {isLoading ? 'Memuat produk…' : isError ? 'Produk gagal dimuat.' : `${products.length} produk ditemukan`}
        </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onInquire={onInquireProduct}
                onViewProduct={onViewProduct}
                onViewMerchant={onViewMerchant}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
