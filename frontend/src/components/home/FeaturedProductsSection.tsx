/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, X, Grid } from 'lucide-react';
import { Product, Category } from '../../types';
import ProductCard from '../product/ProductCard';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';

interface FeaturedProductsSectionProps {
  products: Product[];
  selectedCategory: Category | 'Semua';
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onInquireProduct: (product: Product) => void;
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
  onInquireProduct,
  onViewMerchant, isLoading, isError, onRetry
}: FeaturedProductsSectionProps) {
  return (
    <section 
      id="featured-products" 
      className="py-16 bg-cream-bg border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
              Etalase Niaga Desa
            </span>
            <h2 className="text-2xl font-extrabold text-charcoal tracking-tight">
              Katalog Produk Warga
            </h2>
            <p className="text-xs text-warm-gray mt-1 leading-relaxed max-w-xl">
              Telusuri aneka produk pilihan hasil karya mandiri masyarakat Desa Loning. Klik tombol tanya produk untuk tersambung ke WhatsApp penjual.
            </p>
          </div>

          {/* Search Box with Accessible Labels */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <label htmlFor="search-products-input" className="sr-only">
              Cari produk lokal
            </label>
            <div className="relative">
              <input
                id="search-products-input"
                type="text"
                placeholder="Cari produk atau nama UMKM..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-cream-card border border-sage-border rounded-xl pl-9 pr-8 py-2.5 text-xs text-charcoal placeholder:text-warm-gray/40 focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest focus-ring"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warm-gray">
                <Search size={14} />
              </div>
              {searchQuery && (
                <button
                   onClick={() => onSearchChange('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-warm-gray hover:text-charcoal focus-ring rounded"
                >
                  <X size={14} />
                </button>
              )}
            </div>
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

        {/* Displaying Products or Empty State */}
        {isLoading ? <LoadingSkeleton count={3} /> : isError ? (
          <EmptyState title="Katalog Tidak Dapat Dimuat" description="Terjadi kendala saat mengambil katalog produk. Silakan coba lagi." actionLabel="Coba Lagi" onAction={onRetry} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Produk Tidak Ditemukan"
            description={`Tidak ada produk yang cocok dengan kategori "${selectedCategory}" atau kata pencarian "${searchQuery}". Silakan coba kata kunci lain.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onInquire={onInquireProduct}
                onViewMerchant={onViewMerchant}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
