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
 * Direktori UMKM V2 mobile — hairline list satu kolom.
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
      <div className="px-4 pb-1 pt-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Profil pelaku UMKM</h1>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">Usaha warga Desa Loning beserta kategori dan lokasinya.</p>
      </div>

      <div className="mt-4">
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
      </div>

      <section className="px-4 py-8">
        {umkmsQuery.isError ? (
          <ErrorState action={<Button variant="outline" onClick={() => void umkmsQuery.refetch()}>Coba lagi</Button>} />
        ) : umkmsQuery.isPending ? (
          <HairlineList className="border-t border-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex gap-4 py-5">
                <Skeleton className="aspect-square w-20 shrink-0" />
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
            description={hasActiveFilters ? 'Tidak ada usaha yang cocok dengan filter Anda. Coba kata kunci lain atau hapus filter.' : 'Belum ada profil usaha yang dipublikasikan.'}
            action={hasActiveFilters ? <Button variant="outline" onClick={discovery.clearFilters}>Tampilkan semua usaha</Button> : undefined}
          />
        ) : (
          <>
            <p aria-live="polite" className="text-sm text-ink-muted">
              Menampilkan <span className="numeric">{umkms.length}</span> usaha
            </p>
            <HairlineList className="mt-4 border-t border-line">
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
