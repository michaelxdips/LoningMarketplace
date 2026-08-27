import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { useProducts } from '@loning/shared/hooks/useProducts';
import { useDebouncedValue } from '@loning/shared/hooks/useDebouncedValue';
import { useDiscoveryUrlState } from '@loning/shared/hooks/discovery/useDiscoveryUrlState';
import { Button } from '@v2-shared/ui/Button';
import { EmptyState, ErrorState } from '@v2-shared/ui/EmptyState';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import ProductCard from '../components/ProductCard';
import CatalogFilter from '../components/CatalogFilter';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

/**
 * Katalog produk V2.
 *
 * State filter dimiliki URL (lewat useDiscoveryUrlState dari @loning/shared),
 * sehingga refresh, tombol back/forward, dan tautan yang dibagikan sepakat.
 * Hook itu memakai location.pathname saat ini, jadi otomatis tetap di /v2/produk.
 *
 * Tanpa eyebrow: halaman ini satu section, dan posisinya sudah menjelaskan diri.
 */
export default function CatalogPage() {
  usePageMetadata({
    title: 'Katalog Produk — Loning Maju',
    description: 'Telusuri produk UMKM Desa Loning menurut kategori dan kata kunci.',
  });

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const discovery = useDiscoveryUrlState();
  const debouncedQuery = useDebouncedValue(discovery.q);
  const apiCategory = discovery.category === 'Semua' ? undefined : discovery.category;

  const productsQuery = useProducts({ category: apiCategory, q: debouncedQuery });
  const rawProducts = productsQuery.data ?? [];
  const hasActiveFilters = discovery.category !== 'Semua' || discovery.q.length > 0;

  const products = useMemo(() => {
    const list = [...rawProducts];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    }
    return list;
  }, [rawProducts, sortBy]);

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-6 pb-2 pt-14 lg:px-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Katalog produk
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-ink-muted">
          Produk dari pelaku usaha Desa Loning. Hubungi penjual langsung lewat WhatsApp.
        </p>
      </div>

      <CatalogFilter
        searchLabel="Cari produk"
        placeholder="Cari nama produk…"
        draftQuery={discovery.draftQuery}
        onDraftChange={discovery.setDraftQuery}
        onSubmit={discovery.submitQuery}
        category={discovery.category}
        onCategoryChange={discovery.setCategory}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={discovery.clearFilters}
      />

      <section className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
        {productsQuery.isError ? (
          <ErrorState
            action={
              <Button variant="outline" onClick={() => void productsQuery.refetch()}>
                Coba lagi
              </Button>
            }
          />
        ) : productsQuery.isPending ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mt-4 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description={
              hasActiveFilters
                ? 'Tidak ada produk yang cocok dengan filter Anda. Coba kata kunci lain atau hapus filter.'
                : 'Belum ada produk yang dipublikasikan.'
            }
            action={
              hasActiveFilters ? (
                // Label BERBEDA dari tombol "Hapus filter" di bilah filter,
                // meski efeknya sama. Dua tombol dengan label identik di satu
                // halaman melanggar aturan duplicate-CTA dan membuat nama
                // aksesibelnya ambigu (ketangkap oleh test render).
                <Button variant="outline" onClick={discovery.clearFilters}>
                  Tampilkan semua produk
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              {/* Jumlah hasil diumumkan supaya pengguna pembaca layar tahu filter bekerja. */}
              <p aria-live="polite" className="text-sm text-ink-muted">
                Menampilkan <span className="numeric">{products.length}</span> produk
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort-desktop" className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-subtle">
                  <ArrowUpDown size={14} strokeWidth={1.5} aria-hidden="true" />
                  Sortir:
                </label>
                <select
                  id="catalog-sort-desktop"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="focus-ring-v2 h-9 rounded-control border border-control-border bg-surface px-2.5 text-xs font-medium text-ink hover:bg-sunken"
                >
                  <option value="default">Terbaru (Default)</option>
                  <option value="price-asc">Harga Terendah</option>
                  <option value="price-desc">Harga Tertinggi</option>
                  <option value="name-asc">Nama A-Z</option>
                </select>
              </div>
            </div>

            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
