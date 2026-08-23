import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, getCategoryShortLabel } from '@loning/shared';
import { defaultMetadata, usePageMetadata } from '@loning/shared/lib/seo';
import { useProducts } from '@loning/shared/hooks/useProducts';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import { Button } from '@v2-shared/ui/Button';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { ErrorState } from '@v2-shared/ui/EmptyState';
import { HairlineList } from '@v2-shared/ui/Card';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import ProductCard from '../components/ProductCard';
import BusinessCard from '../components/BusinessCard';
import heroImage from '@loning/assets/hero/produk-lokal.png';

/**
 * Beranda V2.
 *
 * Disiplin eyebrow: halaman ini punya 4 section, jadi maksimum 2 eyebrow
 * (ceil(4/3) = 2). Terpakai: hero + section UMKM. Section kategori dan produk
 * SENGAJA tanpa eyebrow — posisinya di halaman sudah menjelaskan perannya.
 *
 * Keluarga layout tiap section dibuat berbeda: hero split -> pita kategori ->
 * grid produk -> daftar hairline UMKM. Tidak ada pola yang dipakai dua kali.
 */
export default function HomePage() {
  usePageMetadata(defaultMetadata);

  const productsQuery = useProducts({ limit: 6 });
  const umkmsQuery = useUMKMs({ limit: 4 });

  return (
    <>
      {/* 1. HERO — split, dengan foto asli. */}
      <section className="border-b border-line bg-sunken">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-12 lg:px-10 lg:pb-20">
          <div className="lg:col-span-6">
            <Eyebrow>Pasar digital warga Desa Loning</Eyebrow>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink text-balance md:text-5xl lg:text-6xl">
              Temukan produk lokal <span className="font-light italic text-brand">dari Desa Loning</span>
            </h1>

            {/* Subteks pendek: 14 kata, di bawah batas 20 kata. */}
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-ink-muted">
              Katalog usaha warga desa. Hubungi penjual langsung lewat WhatsApp, tanpa perantara.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to="/v2/produk" size="lg" trailingIcon={<ArrowRight size={18} strokeWidth={1.5} />}>
                Lihat Produk
              </ButtonLink>
              <ButtonLink to="/v2/umkm" variant="outline" size="lg">
                Profil UMKM
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-6">
            <MediaImage
              src={heroImage}
              alt="Produk lokal hasil UMKM Desa Loning"
              ratio="aspect-[4/3]"
              priority
            />
          </div>
        </div>
      </section>

      {/* 2. KATEGORI — pita padat, bukan grid kartu berikon. */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Telusuri menurut kategori
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  to={`/v2/produk?category=${encodeURIComponent(category)}`}
                  className="focus-ring-v2 inline-flex min-h-11 items-center rounded-control border border-control-border px-4 text-sm text-ink transition-colors hover:bg-sunken"
                >
                  {getCategoryShortLabel(category)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. PRODUK — grid. */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Produk terbaru
            </h2>
            <Link
              to="/v2/produk"
              className="focus-ring-v2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
            >
              Lihat semua produk
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>

          {productsQuery.isError ? (
            <ErrorState
              className="mt-8"
              action={
                <Button variant="outline" onClick={() => void productsQuery.refetch()}>
                  Coba lagi
                </Button>
              }
            />
          ) : (
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {productsQuery.isPending
                ? Array.from({ length: 6 }, (_, index) => (
                    // Skeleton meniru bentuk kartu: gambar 4:3, judul, meta.
                    <div key={index}>
                      <Skeleton className="aspect-[4/3] w-full" />
                      <Skeleton className="mt-4 h-5 w-3/4" />
                      <Skeleton className="mt-2 h-4 w-1/2" />
                    </div>
                  ))
                : (productsQuery.data ?? []).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. UMKM — daftar hairline, keluarga layout berbeda dari grid di atas. */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <Eyebrow>Pelaku usaha</Eyebrow>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Usaha warga desa
            </h2>
            <Link
              to="/v2/umkm"
              className="focus-ring-v2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
            >
              Lihat semua UMKM
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>

          {umkmsQuery.isError ? (
            <ErrorState
              className="mt-8"
              action={
                <Button variant="outline" onClick={() => void umkmsQuery.refetch()}>
                  Coba lagi
                </Button>
              }
            />
          ) : (
            <HairlineList className="mt-8 border-t border-line">
              {umkmsQuery.isPending
                ? Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex gap-5 py-6">
                      <Skeleton className="aspect-square w-24 shrink-0 sm:w-28" />
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
        </div>
      </section>
    </>
  );
}
