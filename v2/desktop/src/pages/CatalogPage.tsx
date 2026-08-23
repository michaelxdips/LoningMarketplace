import { usePageMetadata } from '@loning/shared/lib/seo';
import { useProducts } from '@loning/shared/hooks/useProducts';
import { useDebouncedValue } from '@loning/shared/hooks/useDebouncedValue';
import { useDiscoveryUrlState } from '@loning/shared/hooks/discovery/useDiscoveryUrlState';
import { Button } from '@v2-shared/ui/Button';
import { EmptyState, ErrorState } from '@v2-shared/ui/EmptyState';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import ProductCard from '../components/ProductCard';
import CatalogFilter from '../components/CatalogFilter';

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

  const discovery = useDiscoveryUrlState();
  const debouncedQuery = useDebouncedValue(discovery.q);
  const apiCategory = discovery.category === 'Semua' ? undefined : discovery.category;

  const productsQuery = useProducts({ category: apiCategory, q: debouncedQuery });
  const products = productsQuery.data ?? [];
  const hasActiveFilters = discovery.category !== 'Semua' || discovery.q.length > 0;

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
            {/* Jumlah hasil diumumkan supaya pengguna pembaca layar tahu filter bekerja. */}
            <p aria-live="polite" className="text-sm text-ink-muted">
              Menampilkan <span className="numeric">{products.length}</span> produk
            </p>
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
