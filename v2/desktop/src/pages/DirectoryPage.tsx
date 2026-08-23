import { usePageMetadata } from '@loning/shared/lib/seo';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import { useDebouncedValue } from '@loning/shared/hooks/useDebouncedValue';
import { useDiscoveryUrlState } from '@loning/shared/hooks/discovery/useDiscoveryUrlState';
import { Button } from '@v2-shared/ui/Button';
import { HairlineList } from '@v2-shared/ui/Card';
import { EmptyState, ErrorState } from '@v2-shared/ui/EmptyState';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import BusinessCard from '../components/BusinessCard';
import CatalogFilter from '../components/CatalogFilter';

/**
 * Direktori UMKM V2.
 *
 * Keluarga layout SENGAJA berbeda dari katalog produk: daftar berpemisah
 * hairline, bukan grid kartu. Dua halaman yang sama-sama grid akan membuat
 * situs terasa templated.
 */
export default function DirectoryPage() {
  usePageMetadata({
    title: 'Profil UMKM — Loning Maju',
    description: 'Daftar pelaku usaha mikro, kecil, dan menengah di Desa Loning.',
  });

  const discovery = useDiscoveryUrlState();
  const debouncedQuery = useDebouncedValue(discovery.q);
  const apiCategory = discovery.category === 'Semua' ? undefined : discovery.category;

  const umkmsQuery = useUMKMs({ category: apiCategory, q: debouncedQuery });
  const umkms = umkmsQuery.data ?? [];
  const hasActiveFilters = discovery.category !== 'Semua' || discovery.q.length > 0;

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-6 pb-2 pt-14 lg:px-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Profil pelaku UMKM
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-ink-muted">
          Usaha warga Desa Loning beserta kategori dan lokasinya.
        </p>
      </div>

      <CatalogFilter
        searchLabel="Cari usaha"
        placeholder="Cari nama usaha…"
        draftQuery={discovery.draftQuery}
        onDraftChange={discovery.setDraftQuery}
        onSubmit={discovery.submitQuery}
        category={discovery.category}
        onCategoryChange={discovery.setCategory}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={discovery.clearFilters}
      />

      <section className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
        {umkmsQuery.isError ? (
          <ErrorState
            action={
              <Button variant="outline" onClick={() => void umkmsQuery.refetch()}>
                Coba lagi
              </Button>
            }
          />
        ) : umkmsQuery.isPending ? (
          <HairlineList className="border-t border-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex gap-5 py-6">
                <Skeleton className="aspect-square w-24 shrink-0 sm:w-28" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </div>
              </div>
            ))}
          </HairlineList>
        ) : umkms.length === 0 ? (
          <EmptyState
            title="Usaha tidak ditemukan"
            description={
              hasActiveFilters
                ? 'Tidak ada usaha yang cocok dengan filter Anda. Coba kata kunci lain atau hapus filter.'
                : 'Belum ada profil usaha yang dipublikasikan.'
            }
            action={
              hasActiveFilters ? (
                // Label sengaja beda dari "Hapus filter" di bilah filter
                // (lihat catatan sama di CatalogPage).
                <Button variant="outline" onClick={discovery.clearFilters}>
                  Tampilkan semua usaha
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p aria-live="polite" className="text-sm text-ink-muted">
              Menampilkan <span className="numeric">{umkms.length}</span> usaha
            </p>
            <HairlineList className="mt-6 border-t border-line">
              {umkms.map((umkm) => (
                <BusinessCard key={umkm.id} umkm={umkm} />
              ))}
            </HairlineList>
          </>
        )}
      </section>
    </>
  );
}
