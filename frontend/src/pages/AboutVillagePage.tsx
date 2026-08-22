/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowRight,
  MapPin,
  Wheat,
  ShieldCheck,
  Map
} from 'lucide-react';
import { Link } from 'react-router';
import { UMKMImage } from '../components/business/UMKMImage';
import PublicPageShell from '../components/layout/PublicPageShell';
import { useUMKMs } from '../hooks/useUMKMs';
import { usePageMetadata } from '../lib/seo';

export default function AboutVillagePage() {
  const gallery = useUMKMs({ limit: 4 });
  const description =
    'Mengenal Desa Loning, Kecamatan Petarukan, Kabupaten Pemalang. Desa dengan potensi pertanian, hasil industri lokal, kuliner lokal, dan semangat kemandirian ekonomi warga.';

  usePageMetadata({
    title: 'Tentang Desa Loning — Potensi & Direktori UMKM Loning Maju',
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'Tentang Desa Loning',
      description,
      about: {
        '@type': 'Place',
        name: 'Desa Loning',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Petarukan',
          addressRegion: 'Kabupaten Pemalang, Jawa Tengah',
          postalCode: '52362',
          addressCountry: 'ID',
        },
      },
    },
  });

  return (
    <PublicPageShell>
      <article className="bg-cream-bg text-charcoal antialiased">
        {/* Header Hero Section */}
        <header className="relative border-b border-sage-border bg-cream-tint px-5 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid min-w-0 gap-10 lg:grid-cols-12 lg:items-center">

              <div className="min-w-0 space-y-6 lg:col-span-7">
                <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
                  Karya & Potensi Lokal dari <span className="font-light italic text-forest">Jantung Petarukan</span>
                </h1>

                <p className="max-w-2xl text-base md:text-lg leading-relaxed text-warm-gray">
                  Desa Loning adalah desa yang kaya akan tradisi, ketahanan pangan, dan hasil industri lokal di Kabupaten Pemalang. Loning Maju hadir sebagai direktori etalase digital untuk membawa karya warga langsung ke genggaman Anda.
                </p>

                {/* Key Quick Facts Pill Grid */}
                <div className="grid min-w-0 grid-cols-1 gap-3 pt-2 min-[480px]:grid-cols-2 sm:grid-cols-3">
                  <div className="min-w-0 rounded-xl border border-sage-border bg-cream-card p-3.5 shadow-xs">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-forest font-bold text-xs">
                      <MapPin size={16} className="text-terracotta" />
                      <span>Lokasi</span>
                    </div>
                    <p className="mt-1 text-xs text-warm-gray font-medium">Petarukan, Pemalang</p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-sage-border bg-cream-card p-3.5 shadow-xs">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-forest font-bold text-xs">
                      <Wheat size={16} className="text-terracotta" />
                      <span>Sektor Utama</span>
                    </div>
                    <p className="mt-1 text-xs text-warm-gray font-medium">Tani, Industri & Kuliner</p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-sage-border bg-cream-card p-3.5 shadow-xs min-[480px]:col-span-2 sm:col-span-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-forest font-bold text-xs">
                      <ShieldCheck size={16} className="text-terracotta" />
                      <span>Kemitraan</span>
                    </div>
                    <p className="mt-1 text-xs text-warm-gray font-medium">Direct Via WhatsApp</p>
                  </div>
                </div>
              </div>

              {/* Quote & Value Statement Column */}
              <div className="min-w-0 lg:col-span-5 lg:col-start-8">
                <div className="relative rounded-2xl border border-sage-border bg-cream-card p-8 shadow-sm space-y-4">
                  <div className="absolute -top-3 left-6 bg-terracotta text-white px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                    Prinsip Pemberdayaan
                  </div>
                  <p className="editorial-serif text-xl italic leading-relaxed text-forest pt-2">
                    “Kemandirian ekonomi warga tumbuh saat karya dari rumah dan hasil sawah serta industri desa mendapat panggung yang layak dan dipercaya masyarakat luas.”
                  </p>
                  <div className="border-t border-sage-border pt-4 flex items-center justify-between text-xs text-warm-gray">
                    <span className="font-bold text-charcoal">Stephen Michael</span>
                    <span>Desa Loning &copy; {new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* Potret Usaha & Galeri Desa */}
        <section aria-label="Potret usaha Desa Loning" className="mx-auto max-w-7xl px-5 pt-16 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
                <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
                Potret Kegiatan Usaha
              </p>
              <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">Etalase Kehidupan & Karya Warga</h2>
            </div>
            <p className="text-xs text-warm-gray max-w-md">
              Dokumentasi nyata kegiatan UMKM, pembuatan produk olahan dari masyarakat Desa Loning.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 h-72 sm:h-96 rounded-2xl overflow-hidden shadow-sm border border-sage-border bg-sage-light">
            {gallery.data?.length ? (
              gallery.data.map((umkm, index) => (
                <div key={umkm.id} className="relative overflow-hidden group h-full">
                  <UMKMImage
                    src={umkm.imageUrl}
                    alt={umkm.altText || `Kegiatan dan produk ${umkm.name}`}
                    name={umkm.name}
                    category={umkm.category}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta bg-white/90 px-2 py-0.5 rounded w-fit">
                      {umkm.category}
                    </span>
                    <p className="text-xs font-bold text-white mt-1 line-clamp-1">{umkm.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 grid place-items-center bg-cream-card">
                <div className="text-center p-8">
                  <MapPin className="mx-auto text-terracotta mb-2" size={32} />
                  <p className="text-sm font-bold text-forest">Desa Loning · Petarukan</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sektor Potensi Ekonomi Desa Loning */}
        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="max-w-2xl mx-auto mb-12 text-left">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
              <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
              Kekayaan Potensi Desa
            </p>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">Sektor Utama UMKM Desa Loning</h2>
            <p className="mt-3 text-sm leading-7 text-warm-gray">
              Berbagai bidang usaha yang menggerakkan roda perekonomian dan kesejahteraan warga lokal.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-sage-border bg-sage-border sm:grid-cols-3">
            <div className="bg-cream-card p-8">
              <h3 className="font-serif text-2xl font-semibold text-charcoal">Pertanian & Hasil Bumi</h3>
              <p className="mt-3 text-sm leading-7 text-warm-gray">
                Beras pilihan, jagung, sayur mayur segar, serta komoditas perkebunan yang dipanen langsung dari tanah Loning.
              </p>
            </div>
            <div className="bg-cream-card p-8">
              <h3 className="font-serif text-2xl font-semibold text-charcoal">Kuliner & Snack Olahan</h3>
              <p className="mt-3 text-sm leading-7 text-warm-gray">
                Jajanan tradisional, camilan kering renyah, dan olahan makanan khas rumahan racikan ibu-ibu warga desa.
              </p>
            </div>
            <div className="bg-cream-card p-8">
              <h3 className="font-serif text-2xl font-semibold text-charcoal">Jasa & Perdagangan Usaha</h3>
              <p className="mt-3 text-sm leading-7 text-warm-gray">
                Layanan perbengkelan, penjahit pakaian, warung sembako, dan jasa kebutuhan harian yang ramah dan tepercaya.
              </p>
            </div>
          </div>
        </section>

        {/* Mengapa Loning Maju Dibuat? (Values Banner) */}
        <section className="bg-forest text-cream-tint my-12 py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-terracotta">Niat & Tujuan Platform</span>
              <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">Prinsip Kerja Direktori Loning Maju</h2>
            </div>

            <div className="grid gap-10 md:grid-cols-3 md:gap-12">
              <div className="space-y-3">
                <span className="font-serif text-5xl font-light text-terracotta/90">1</span>
                <h3 className="font-serif text-xl font-semibold text-white">Informasi Terpusat & Akurat</h3>
                <p className="text-sm leading-7 text-cream-tint/70">
                  Seluruh profil usaha, katalog produk, alamat lokasi, dan kontak pemilik dikumpulkan secara rapi dan mudah diakses siapa saja.
                </p>
              </div>

              <div className="space-y-3">
                <span className="font-serif text-5xl font-light text-terracotta/90">2</span>
                <h3 className="font-serif text-xl font-semibold text-white">Interaksi Langsung Tanpa Perantara</h3>
                <p className="text-sm leading-7 text-cream-tint/70">
                  Pengunjung berinteraksi dan bertransaksi langsung via WhatsApp tanpa ada potongan komisi atau biaya transaksi pihak ketiga.
                </p>
              </div>

              <div className="space-y-3">
                <span className="font-serif text-5xl font-light text-terracotta/90">3</span>
                <h3 className="font-serif text-xl font-semibold text-white">Murni untuk Pemberdayaan Warga</h3>
                <p className="text-sm leading-7 text-cream-tint/70">
                  Dikembangkan khusus untuk mendukung pertumbuhan usaha mikro warga Desa Loning agar semakin dikenal dan berdaya saing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Action Navigation Cards */}
        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="rounded-3xl border border-sage-border bg-cream-card p-8 md:p-12 shadow-sm">
            <div className="grid md:grid-cols-12 gap-8 items-center">

              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta uppercase tracking-wider">
                  <Map size={16} />
                  <span>Jelajahi Desa Loning</span>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-charcoal md:text-4xl">
                  Temukan Lokasi & Produk Usaha Warga Sekarang
                </h2>
                <p className="text-xs md:text-sm text-warm-gray leading-relaxed">
                  Gunakan peta interaktif untuk melihat sebaran lokasi UMKM Desa Loning, atau telusuri produk pilihan favorit Anda secara langsung.
                </p>
              </div>

              <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-3">
                <Link
                  to="/peta-umkm"
                  className="focus-ring touch-target flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-forest-hover hover:shadow-md"
                >
                  <Map size={16} />
                  <span>Buka Peta Lokasi UMKM</span>
                </Link>

                <Link
                  to="/#featured-products"
                  className="focus-ring touch-target flex items-center justify-center gap-2 rounded-xl border border-sage-border bg-cream-tint px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-charcoal transition-colors hover:bg-sage-light"
                >
                  <span>Lihat Katalog Produk</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

            </div>
          </div>
        </section>
      </article>
    </PublicPageShell>
  );
}
