import { MapPin } from 'lucide-react';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { Eyebrow, EditorialNumber } from '@v2-shared/ui/Eyebrow';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';

/**
 * Tentang Desa V2 mobile — satu kolom, tanpa kartu ber-shadow.
 */
export default function AboutVillagePage() {
  const gallery = useUMKMs({ limit: 4 });
  const description = 'Mengenal Desa Loning, Kecamatan Petarukan, Kabupaten Pemalang. Desa dengan potensi pertanian, hasil industri lokal, kuliner lokal, dan semangat kemandirian ekonomi warga.';
  usePageMetadata({ title: 'Tentang Desa Loning — Potensi & Direktori UMKM Loning Maju', description, jsonLd: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Tentang Desa Loning', description, about: { '@type': 'Place', name: 'Desa Loning', address: { '@type': 'PostalAddress', addressLocality: 'Petarukan', addressRegion: 'Kabupaten Pemalang, Jawa Tengah', postalCode: '52362', addressCountry: 'ID' } } } });

  const sectors = [
    { title: 'Pertanian & Hasil Bumi', description: 'Beras pilihan, jagung, sayur mayur segar, serta komoditas perkebunan yang dipanen langsung dari tanah Loning.' },
    { title: 'Kuliner & Snack Olahan', description: 'Jajanan tradisional, camilan kering renyah, dan olahan makanan khas rumahan racikan ibu-ibu warga desa.' },
    { title: 'Jasa & Perdagangan Usaha', description: 'Layanan perbengkelan, penjahit pakaian, warung sembako, dan jasa kebutuhan harian yang ramah dan tepercaya.' },
  ];

  const principles = [
    { title: 'Informasi terpusat & akurat', description: 'Seluruh profil usaha, katalog produk, alamat lokasi, dan kontak pemilik dikumpulkan secara rapi dan mudah diakses siapa saja.' },
    { title: 'Interaksi langsung tanpa perantara', description: 'Pengunjung berinteraksi dan bertransaksi langsung via WhatsApp tanpa ada potongan komisi atau biaya transaksi pihak ketiga.' },
    { title: 'Murni untuk pemberdayaan warga', description: 'Dikembangkan khusus untuk mendukung pertumbuhan usaha mikro warga Desa Loning agar semakin dikenal dan berdaya saing.' },
  ];

  return (
    <article>
      {/* Hero */}
      <header className="border-b border-line bg-sunken px-4 py-12">
        <Eyebrow>Karya & potensi lokal</Eyebrow>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink text-balance">Dari <span className="font-light italic text-brand">jantung Petarukan</span></h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Desa Loning adalah desa yang kaya akan tradisi, ketahanan pangan, dan hasil industri lokal di Kabupaten Pemalang. Loning Maju hadir sebagai direktori etalase digital untuk membawa karya warga langsung ke genggaman Anda.
        </p>
        <figure className="mt-6 border border-line bg-surface p-6">
          <blockquote className="font-display text-lg italic leading-relaxed text-brand">
            “Kemandirian ekonomi warga tumbuh saat karya dari rumah dan hasil sawah serta industri desa mendapat panggung yang layak dan dipercaya masyarakat luas.”
          </blockquote>
          <figcaption className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm text-ink-muted">
            <span className="font-medium text-ink">Stephen Michael</span>
            <span>Desa Loning © {new Date().getFullYear()}</span>
          </figcaption>
        </figure>
      </header>

      {/* Galeri */}
      <section aria-label="Potret usaha Desa Loning" className="border-b border-line px-4 py-10">
        <Eyebrow>Potret kegiatan usaha</Eyebrow>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">Etalase kehidupan & karya warga</h2>
        {gallery.isPending ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="aspect-[4/5] w-full" />)}
          </div>
        ) : (gallery.data ?? []).length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(gallery.data ?? []).map((umkm) => (
              <figure key={umkm.id}>
                <MediaImage src={umkm.imageUrl} alt={umkm.altText ?? `Kegiatan dan produk ${umkm.name}`} ratio="aspect-[4/5]" />
                <figcaption className="mt-2">
                  <p className="text-xs text-accent-ink">{umkm.category}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-medium text-ink">{umkm.name}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center border border-line bg-sunken p-8">
            <div className="text-center">
              <MapPin size={24} strokeWidth={1.5} className="mx-auto text-accent-ink" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium text-ink">Desa Loning · Petarukan</p>
            </div>
          </div>
        )}
      </section>

      {/* Sektor */}
      <section className="border-b border-line px-4 py-10">
        <Eyebrow>Kekayaan potensi desa</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Sektor utama UMKM Desa Loning</h2>
        <div className="mt-5 grid gap-px border border-line bg-line">
          {sectors.map((sector) => (
            <div key={sector.title} className="bg-surface p-6">
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{sector.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-muted">{sector.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prinsip */}
      <section className="bg-brand px-4 py-12 text-on-brand">
        <Eyebrow className="text-accent-ink">Niat & tujuan platform</Eyebrow>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Prinsip kerja direktori Loning Maju</h2>
        <div className="mt-8 grid gap-8">
          {principles.map((principle, index) => (
            <div key={principle.title}>
              <EditorialNumber value={String(index + 1).padStart(2, '0')} className="text-on-brand/60" />
              <h3 className="mt-3 font-display text-lg font-semibold">{principle.title}</h3>
              <p className="mt-2 text-sm leading-7 text-on-brand/75">{principle.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-10">
        <Eyebrow>Jelajahi Desa Loning</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Temukan lokasi & produk usaha warga</h2>
        <div className="mt-5 flex flex-col gap-3">
          <ButtonLink to="/m/peta-umkm" size="lg">Buka Peta Lokasi UMKM</ButtonLink>
          <ButtonLink to="/m/produk" variant="outline" size="lg">Lihat Katalog Produk</ButtonLink>
        </div>
      </section>
    </article>
  );
}
