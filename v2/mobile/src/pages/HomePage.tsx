import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, getCategoryShortLabel } from '@loning/shared';
import { defaultMetadata, usePageMetadata } from '@loning/shared/lib/seo';
import { useProducts } from '@loning/shared/hooks/useProducts';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import { Button } from '@v2-shared/ui/Button';
import { ErrorState } from '@v2-shared/ui/EmptyState';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { HairlineList } from '@v2-shared/ui/Card';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import ProductCard from '../components/ProductCard';
import BusinessCard from '../components/BusinessCard';
import heroImage from '@loning/assets/hero/produk-lokal.png';

/**
 * Beranda V2 mobile — satu kolom, tap target besar, tanpa glass.
 * Hero foto -> pita kategori -> produk -> UMKM (hairline list).
 */
export default function HomePage() {
  usePageMetadata(defaultMetadata);
  const productsQuery = useProducts({ limit: 6 });
  const umkmsQuery = useUMKMs({ limit: 4 });

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-sunken px-4 pb-12 pt-10">
        <Eyebrow>Pasar digital warga Desa Loning</Eyebrow>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink text-balance">
          Temukan produk lokal <span className="font-light italic text-brand">dari Desa Loning</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Katalog usaha warga desa. Hubungi penjual langsung lewat WhatsApp, tanpa perantara.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/m/produk"
            className="focus-ring-v2 inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover active:translate-y-px"
          >
            Lihat Produk
          </Link>
          <Link
            to="/m/umkm"
            className="focus-ring-v2 inline-flex min-h-12 flex-1 items-center justify-center rounded-control border border-control-border px-5 text-sm font-medium text-ink transition-colors hover:bg-sunken"
          >
            Profil UMKM
          </Link>
        </div>
        <div className="mt-8">
          <MediaImage src={heroImage} alt="Produk lokal hasil UMKM Desa Loning" ratio="aspect-[4/3]" priority />
        </div>
      </section>

      {/* Kategori */}
      <section className="border-b border-line px-4 py-10">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Telusuri menurut kategori</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <Link
                to={`/m/produk?category=${encodeURIComponent(category)}`}
                className="focus-ring-v2 inline-flex min-h-11 items-center rounded-control border border-control-border px-4 text-sm text-ink transition-colors hover:bg-sunken"
              >
                {getCategoryShortLabel(category)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Produk */}
      <section className="border-b border-line px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Produk terbaru</h2>
          <Link to="/m/produk" className="focus-ring-v2 inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
            Semua
            <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>

        {productsQuery.isError ? (
          <ErrorState className="mt-6" action={<Button variant="outline" onClick={() => void productsQuery.refetch()}>Coba lagi</Button>} />
        ) : (
          <div className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {productsQuery.isPending
              ? Array.from({ length: 4 }, (_, index) => (
                  <div key={index}>
                    <Skeleton className="aspect-[4/3] w-full" />
                    <Skeleton className="mt-3 h-5 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                ))
              : (productsQuery.data ?? []).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      {/* UMKM */}
      <section className="px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <Eyebrow>Pelaku usaha</Eyebrow>
          <Link to="/m/umkm" className="focus-ring-v2 inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
            Semua
            <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">Usaha warga desa</h2>

        {umkmsQuery.isError ? (
          <ErrorState className="mt-6" action={<Button variant="outline" onClick={() => void umkmsQuery.refetch()}>Coba lagi</Button>} />
        ) : (
          <HairlineList className="mt-4 border-t border-line">
            {umkmsQuery.isPending
              ? Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex gap-4 py-5">
                    <Skeleton className="aspect-square w-20 shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-2 h-5 w-2/3" />
                      <Skeleton className="mt-2 h-4 w-full" />
                    </div>
                  </div>
                ))
              : (umkmsQuery.data ?? []).map((umkm) => <BusinessCard key={umkm.id} umkm={umkm} />)}
          </HairlineList>
        )}
      </section>
    </>
  );
}
