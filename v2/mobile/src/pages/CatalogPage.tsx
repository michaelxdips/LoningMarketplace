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
 * Katalog produk V2 mobile — state filter milik URL (useDiscoveryUrlState).
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
      <div className="px-4 pb-1 pt-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Katalog produk</h1>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">Produk dari pelaku usaha Desa Loning. Hubungi penjual langsung lewat WhatsApp.</p>
      </div>

      <div className="mt-4">
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
      </div>

      <section className="px-4 py-6">
        {productsQuery.isError ? (
          <ErrorState action={<Button variant="outline" onClick={() => void productsQuery.refetch()}>Coba lagi</Button>} />
        ) : productsQuery.isPending ? (
          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description={hasActiveFilters ? 'Tidak ada produk yang cocok dengan filter Anda. Coba kata kunci lain atau hapus filter.' : 'Belum ada produk yang dipublikasikan.'}
            action={hasActiveFilters ? <Button variant="outline" onClick={discovery.clearFilters}>Tampilkan semua produk</Button> : undefined}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <p aria-live="polite" className="text-sm text-ink-muted">
                Menampilkan <span className="numeric">{products.length}</span> produk
              </p>

              <div className="flex items-center gap-1.5">
                <label htmlFor="catalog-sort-mobile" className="sr-only">
                  Urutkan produk
                </label>
                <div className="relative inline-flex items-center">
                  <ArrowUpDown size={13} strokeWidth={1.5} className="pointer-events-none absolute left-2.5 text-ink-subtle" aria-hidden="true" />
                  <select
                    id="catalog-sort-mobile"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Urutkan produk"
                    className="focus-ring-v2 h-9 rounded-control border border-control-border bg-surface pl-7 pr-2.5 text-xs font-medium text-ink hover:bg-sunken"
                  >
                    <option value="default">Terbaru</option>
                    <option value="price-asc">Harga Terendah</option>
                    <option value="price-desc">Harga Tertinggi</option>
                    <option value="name-asc">Nama A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2">
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
