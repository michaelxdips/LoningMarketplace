import { Landmark, MapPin, Users } from 'lucide-react';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';

/**
 * Tentang Kami V2 — pasangan fitur dari /tentang-kami UI lama.
 *
 * Konten KKN Reguler Tim II UNDIP 2026 Desa Loning dipertahankan; layout
 * editorial (hero forest + grid hairline kontribusi + banner developer).
 */
const CONTRIBUTIONS = [
  {
    title: 'Digitalisasi Potensi Desa',
    description:
      'Menghadirkan LoningMaju sebagai ruang digital untuk memperkenalkan UMKM dan produk lokal Desa Loning.',
  },
  {
    title: 'Kolaborasi Bersama Warga',
    description:
      'Membangun solusi melalui pendekatan partisipatif agar teknologi tetap relevan dengan kebutuhan masyarakat.',
  },
  {
    title: 'Dampak yang Berkelanjutan',
    description:
      'Menyusun platform yang dapat terus dimanfaatkan sebagai media informasi dan promosi setelah masa pengabdian.',
  },
];

export default function AboutTeamPage() {
  const description = 'Tentang KKN Reguler Tim II UNDIP 2026 Desa Loning dan kontribusinya melalui platform LoningMaju.';
  usePageMetadata({
    title: 'Tentang Kami — KKN Reguler Tim II UNDIP 2026 Desa Loning',
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'KKN Reguler Tim II UNDIP 2026 Desa Loning',
      description,
    },
  });

  return (
    <article>
      {/* Hero */}
      <header className="bg-brand text-on-brand">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="inline-flex items-center gap-2 border border-on-brand/15 bg-on-brand/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-on-brand">
                <Landmark size={14} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" />
                Universitas Diponegoro
              </p>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Mengabdi, berkolaborasi, dan{' '}
                <span className="font-light italic text-accent-ink">bertumbuh bersama.</span>
              </h1>
              <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-on-brand/75 md:text-lg">
                KKN Reguler Tim II UNDIP 2026 hadir di Desa Loning untuk belajar dari masyarakat,
                bekerja bersama warga, dan menghadirkan kontribusi yang bermanfaat bagi desa.
              </p>
            </div>

            <div className="border border-on-brand/15 bg-on-brand/10 p-6 lg:col-span-4">
              <div className="flex items-start gap-3">
                <MapPin size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-brand/70">
                    Lokasi pengabdian
                  </p>
                  <p className="mt-1 font-semibold">Desa Loning</p>
                  <p className="mt-0.5 text-sm text-on-brand/65">Petarukan, Pemalang, Jawa Tengah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tentang tim */}
      <section aria-labelledby="tentang-tim-heading" className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Eyebrow>Tentang tim</Eyebrow>
              <h2 id="tentang-tim-heading" className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                Teknologi sebagai jembatan potensi lokal
              </h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-ink-muted lg:col-span-7">
              <p>
                Kami adalah mahasiswa KKN Reguler Tim II Universitas Diponegoro tahun 2026 yang
                melaksanakan pengabdian di Desa Loning. Kegiatan kami berangkat dari semangat
                multidisiplin, gotong royong, dan kepedulian terhadap potensi masyarakat.
              </p>
              <p>
                Salah satu kontribusi tersebut adalah LoningMaju, etalase digital yang membantu
                informasi UMKM, produk, dan lokasi usaha warga tersaji dalam satu tempat yang mudah
                dijangkau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Kontribusi */}
      <section aria-labelledby="kontribusi-heading" className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="max-w-2xl">
            <Eyebrow>Kontribusi kami</Eyebrow>
            <h2 id="kontribusi-heading" className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
              Bertumbuh bersama Desa Loning
            </h2>
          </div>

          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
            {CONTRIBUTIONS.map((contribution) => (
              <div key={contribution.title} className="bg-surface p-7">
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {contribution.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{contribution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="bg-ink p-8 text-on-brand md:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-accent-ink">
                <Users size={18} strokeWidth={1.5} aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Di balik platform</span>
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                LoningMaju dikembangkan oleh Stephen Michael
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-on-brand/65">
                Sebagai bagian dari KKN Reguler Tim II UNDIP 2026 Desa Loning, platform ini dibangun
                untuk mendukung visibilitas dan kemandirian digital UMKM lokal.
              </p>
            </div>
            <ButtonLink to="/v2" variant="accent" size="lg" className="shrink-0">
              Jelajahi LoningMaju
            </ButtonLink>
          </div>
        </div>
      </section>
    </article>
  );
}
