import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getProduct, getUMKM } from '@loning/shared/lib/api';
import type { Product, ProductDetail, UMKM } from '@loning/shared';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { useFavorites } from '@v2-shared/hooks/useFavorites';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { HairlineList } from '@v2-shared/ui/Card';
import { EmptyState } from '@v2-shared/ui/EmptyState';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import ProductCard from '../components/ProductCard';
import BusinessCard from '../components/BusinessCard';

/**
 * Tersimpan V2 (mobile) — halaman favorit pengunjung, satu kolom.
 */
export default function SavedPage() {
  usePageMetadata({ title: 'Tersimpan — Loning Maju', description: 'Produk dan usaha yang Anda simpan untuk dilihat lagi.' });

  const { favorites } = useFavorites();
  const queries = useQueries({
    queries: favorites.map((entry) =>
      entry.kind === 'product'
        ? { queryKey: ['product', entry.slug], queryFn: () => getProduct(entry.slug), staleTime: 5 * 60_000 }
        : { queryKey: ['umkm', entry.slug], queryFn: () => getUMKM(entry.slug), staleTime: 5 * 60_000 },
    ),
  });

  const savedProducts = useMemo(() => {
    const list: Product[] = [];
    favorites.forEach((entry, index) => {
      if (entry.kind !== 'product') return;
      const data = queries[index]?.data;
      if (!data) return;
      const detail = data as ProductDetail;
      list.push({ ...detail, umkmName: detail.umkm.name });
    });
    return list;
  }, [favorites, queries]);

  const savedUmkms = useMemo(() => {
    const list: UMKM[] = [];
    favorites.forEach((entry, index) => {
      if (entry.kind !== 'umkm') return;
      const data = queries[index]?.data;
      if (data) list.push(data as UMKM);
    });
    return list;
  }, [favorites, queries]);

  const isLoading = queries.some((query, index) => Boolean(favorites[index]) && query.isPending);
  const hasResolved = savedProducts.length > 0 || savedUmkms.length > 0;

  return (
    <>
      <div className="px-4 pb-1 pt-8">
        <Eyebrow>Koleksi Anda</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Tersimpan</h1>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">Produk dan usaha yang Anda tandai, hanya di perangkat ini.</p>
      </div>

      <div className="px-4 py-8">
        {favorites.length === 0 ? (
          <EmptyState
            title="Belum ada yang tersimpan"
            description="Ketuk ikon hati pada produk atau usaha untuk menyimpannya di sini."
            action={<ButtonLink to="/m/produk">Jelajahi katalog</ButtonLink>}
          />
        ) : isLoading && !hasResolved ? (
          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {Array.from({ length: Math.min(4, favorites.length) }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : !hasResolved ? (
          <EmptyState
            title="Data tersimpan tidak lagi tersedia"
            description="Produk atau usaha yang Anda simpan mungkin sudah diarsipkan atau dihapus oleh pengelolanya."
            action={<ButtonLink to="/m/produk" variant="outline">Jelajahi katalog</ButtonLink>}
          />
        ) : (
          <>
            {savedProducts.length > 0 ? (
              <section aria-labelledby="m-saved-products" className="mb-8">
                <h2 id="m-saved-products" className="font-display text-xl font-semibold tracking-tight text-ink">Produk tersimpan</h2>
                <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2">
                  {savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>
            ) : null}

            {savedUmkms.length > 0 ? (
              <section aria-labelledby="m-saved-umkms" className="border-t border-line pt-8">
                <h2 id="m-saved-umkms" className="font-display text-xl font-semibold tracking-tight text-ink">Usaha tersimpan</h2>
                <HairlineList className="mt-4 border-t border-line">
                  {savedUmkms.map((umkm) => <BusinessCard key={umkm.id} umkm={umkm} />)}
                </HairlineList>
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
