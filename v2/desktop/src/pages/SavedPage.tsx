import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getProduct, getUMKM } from '@loning/shared/lib/api';
import type { Product, ProductDetail, UMKM } from '@loning/shared';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { useFavorites } from '@v2-shared/hooks/useFavorites';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { EmptyState } from '@v2-shared/ui/EmptyState';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import ProductCard from '../components/ProductCard';
import BusinessCard from '../components/BusinessCard';

/**
 * Tersimpan V2 (desktop) — halaman favorit pengunjung.
 *
 * Membaca slug dari localStorage (useFavorites) lalu mengambil data TERBARU
 * dari API per slug. Karena itu kalau nama/harga berubah, daftar ini tetap
 * akurat — bukan snapshot basi.
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

  // Petakan hasil query per entry. Produk perlu dibentuk ulang ke bentuk yang
  // diterima ProductCard (umkmName denormalisasi dari detail.umkm.name).
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

  const isLoading = queries.some((query, index) => {
    const entry = favorites[index];
    return Boolean(entry) && query.isPending;
  });

  const hasResolved = savedProducts.length > 0 || savedUmkms.length > 0;

  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-14 lg:px-10">
          <Eyebrow>Koleksi Anda</Eyebrow>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Tersimpan</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Produk dan usaha yang Anda tandai. Tersimpan hanya di perangkat ini, dan bisa dihapus kapan saja.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
        {favorites.length === 0 ? (
          <EmptyState
            title="Belum ada yang tersimpan"
            description="Ketuk ikon hati pada produk atau usaha untuk menyimpannya di sini."
            action={<ButtonLink to="/v2/produk">Jelajahi katalog</ButtonLink>}
          />
        ) : isLoading && !hasResolved ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: Math.min(4, favorites.length) }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mt-4 h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : !hasResolved ? (
          <EmptyState
            title="Data tersimpan tidak lagi tersedia"
            description="Produk atau usaha yang Anda simpan mungkin sudah diarsipkan atau dihapus oleh pengelolanya."
            action={<ButtonLink to="/v2/produk" variant="outline">Jelajahi katalog</ButtonLink>}
          />
        ) : (
          <>
            {savedProducts.length > 0 ? (
              <section aria-labelledby="saved-products" className="mb-16">
                <h2 id="saved-products" className="font-display text-xl font-semibold tracking-tight text-ink">Produk tersimpan</h2>
                <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                  {savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>
            ) : null}

            {savedUmkms.length > 0 ? (
              <section aria-labelledby="saved-umkms" className="border-t border-line pt-12">
                <h2 id="saved-umkms" className="font-display text-xl font-semibold tracking-tight text-ink">Usaha tersimpan</h2>
                <div className="mt-4 divide-y divide-line">
                  {savedUmkms.map((umkm) => <BusinessCard key={umkm.id} umkm={umkm} />)}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
