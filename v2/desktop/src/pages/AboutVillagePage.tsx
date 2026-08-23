import { MapPin } from 'lucide-react';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { Eyebrow, EditorialNumber } from '@v2-shared/ui/Eyebrow';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';

/**
 * Tentang Desa V2 — pasangan fitur dari /tentang-desa UI lama.
 *
 * Konten dipertahankan; layout editorial (angka besar untuk prinsip, hairline
 * untuk sektor) menggantikan kartu ber-shadow dan ikon-topper pada quick facts.
 * Galeri memakai foto UMKM dari API.
 */
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

  const facts = [
    { label: 'Lokasi', value: 'Petarukan, Pemalang' },
    { label: 'Sektor utama', value: 'Tani, Industri & Kuliner' },
    { label: 'Kemitraan', value: 'Direct via WhatsApp' },
  ];

  const sectors = [
    {
      title: 'Pertanian & Hasil Bumi',
      description:
        'Beras pilihan, jagung, sayur mayur segar, serta komoditas perkebunan yang dipanen langsung dari tanah Loning.',
    },
    {
      title: 'Kuliner & Snack Olahan',
      description:
        'Jajanan tradisional, camilan kering renyah, dan olahan makanan khas rumahan racikan ibu-ibu warga desa.',
    },
    {
      title: 'Jasa & Perdagangan Usaha',
      description:
        'Layanan perbengkelan, penjahit pakaian, warung sembako, dan jasa kebutuhan harian yang ramah dan tepercaya.',
    },
  ];

  const principles = [
    {
      title: 'Informasi terpusat & akurat',
      description:
        'Seluruh profil usaha, katalog produk, alamat lokasi, dan kontak pemilik dikumpulkan secara rapi dan mudah diakses siapa saja.',
    },
    {
      title: 'Interaksi langsung tanpa perantara',
      description:
        'Pengunjung berinteraksi dan bertransaksi langsung via WhatsApp tanpa ada potongan komisi atau biaya transaksi pihak ketiga.',
    },
    {
      title: 'Murni untuk pemberdayaan warga',
      description:
        'Dikembangkan khusus untuk mendukung pertumbuhan usaha mikro warga Desa Loning agar semakin dikenal dan berdaya saing.',
    },
  ];

  return (
    <article>
      {/* Hero */}
      <header className="border-b border-line bg-sunken">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <Eyebrow>Karya & potensi lokal</Eyebrow>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink text-balance md:text-5xl lg:text-6xl">
                Dari <span className="font-light italic text-brand">jantung Petarukan</span>
              </h1>
              <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-ink-muted md:text-lg">
                Desa Loning adalah desa yang kaya akan tradisi, ketahanan pangan, dan hasil industri
                lokal di Kabupaten Pemalang. Loning Maju hadir sebagai direktori etalase digital untuk
                membawa karya warga langsung ke genggaman Anda.
              </p>

              <dl className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label} className="bg-surface p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <figure className="border border-line bg-surface p-8">
                <blockquote className="font-display text-xl italic leading-relaxed text-brand">
                  “Kemandirian ekonomi warga tumbuh saat karya dari rumah dan hasil sawah serta
                  industri desa mendapat panggung yang layak dan dipercaya masyarakat luas.”
                </blockquote>
                <figcaption className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm text-ink-muted">
                  <span className="font-medium text-ink">Stephen Michael</span>
                  <span>Desa Loning © {new Date().getFullYear()}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </header>

      {/* Galeri */}
      <section aria-label="Potret usaha Desa Loning" className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Eyebrow>Potret kegiatan usaha</Eyebrow>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Etalase kehidupan & karya warga
              </h2>
            </div>
            <p className="max-w-md text-sm text-ink-muted">
              Dokumentasi nyata kegiatan UMKM dan produk olahan masyarakat Desa Loning.
            </p>
          </div>

          {gallery.isPending ? (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="aspect-[4/5] w-full" />
              ))}
            </div>
          ) : (gallery.data ?? []).length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {(gallery.data ?? []).map((umkm) => (
                <figure key={umkm.id} className="group relative">
                  <MediaImage
                    src={umkm.imageUrl}
                    alt={umkm.altText ?? `Kegiatan dan produk ${umkm.name}`}
                    ratio="aspect-[4/5]"
                  />
                  <figcaption className="mt-2">
                    <p className="text-xs text-accent-ink">{umkm.category}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm font-medium text-ink">{umkm.name}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-center border border-line bg-sunken p-10">
              <div className="text-center">
                <MapPin size={28} strokeWidth={1.5} className="mx-auto text-accent-ink" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-ink">Desa Loning · Petarukan</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sektor */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="max-w-2xl">
            <Eyebrow>Kekayaan potensi desa</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Sektor utama UMKM Desa Loning
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-muted">
              Berbagai bidang usaha yang menggerakkan roda perekonomian dan kesejahteraan warga lokal.
            </p>
          </div>

          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-3">
            {sectors.map((sector) => (
              <div key={sector.title} className="bg-surface p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                  {sector.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-ink-muted">{sector.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prinsip */}
      <section className="bg-brand text-on-brand">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="text-accent-ink">Niat & tujuan platform</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Prinsip kerja direktori Loning Maju
            </h2>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {principles.map((principle, index) => (
              <div key={principle.title}>
                <EditorialNumber value={String(index + 1).padStart(2, '0')} className="text-on-brand/60" />
                <h3 className="mt-4 font-display text-xl font-semibold">{principle.title}</h3>
                <p className="mt-3 text-sm leading-7 text-on-brand/75">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
        <div className="border border-line bg-surface p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <Eyebrow>Jelajahi Desa Loning</Eyebrow>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink md:text-4xl">
                Temukan lokasi & produk usaha warga sekarang
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
                Gunakan peta interaktif untuk melihat sebaran lokasi UMKM Desa Loning, atau telusuri
                produk pilihan favorit Anda secara langsung.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:col-span-5 sm:flex-row md:flex-col">
              <ButtonLink to="/v2/peta-umkm" size="lg">
                Buka Peta Lokasi UMKM
              </ButtonLink>
              <ButtonLink to="/v2/produk" variant="outline" size="lg">
                Lihat Katalog Produk
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
