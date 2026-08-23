import { Landmark, MapPin, Users } from 'lucide-react';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';

/**
 * Tentang Kami V2 mobile — satu kolom.
 */
const CONTRIBUTIONS = [
  { title: 'Digitalisasi Potensi Desa', description: 'Menghadirkan LoningMaju sebagai ruang digital untuk memperkenalkan UMKM dan produk lokal Desa Loning.' },
  { title: 'Kolaborasi Bersama Warga', description: 'Membangun solusi melalui pendekatan partisipatif agar teknologi tetap relevan dengan kebutuhan masyarakat.' },
  { title: 'Dampak yang Berkelanjutan', description: 'Menyusun platform yang dapat terus dimanfaatkan sebagai media informasi dan promosi setelah masa pengabdian.' },
];

export default function AboutTeamPage() {
  const description = 'Tentang KKN Reguler Tim II UNDIP 2026 Desa Loning dan kontribusinya melalui platform LoningMaju.';
  usePageMetadata({ title: 'Tentang Kami — KKN Reguler Tim II UNDIP 2026 Desa Loning', description, jsonLd: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'KKN Reguler Tim II UNDIP 2026 Desa Loning', description } });

  return (
    <article>
      <header className="bg-brand px-4 py-12 text-on-brand">
        <p className="inline-flex items-center gap-2 border border-on-brand/15 bg-on-brand/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
          <Landmark size={14} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" />
          Universitas Diponegoro
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance">
          Mengabdi, berkolaborasi, dan <span className="font-light italic text-accent-ink">bertumbuh bersama.</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-on-brand/75">
          KKN Reguler Tim II UNDIP 2026 hadir di Desa Loning untuk belajar dari masyarakat, bekerja bersama warga, dan menghadirkan kontribusi yang bermanfaat bagi desa.
        </p>
        <div className="mt-6 border border-on-brand/15 bg-on-brand/10 p-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-brand/70">Lokasi pengabdian</p>
              <p className="mt-1 font-semibold">Desa Loning</p>
              <p className="mt-0.5 text-sm text-on-brand/65">Petarukan, Pemalang, Jawa Tengah</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="tentang-tim-heading" className="border-b border-line px-4 py-10">
        <Eyebrow>Tentang tim</Eyebrow>
        <h2 id="tentang-tim-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Teknologi sebagai jembatan potensi lokal</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-muted">
          <p>Kami adalah mahasiswa KKN Reguler Tim II Universitas Diponegoro tahun 2026 yang melaksanakan pengabdian di Desa Loning. Kegiatan kami berangkat dari semangat multidisiplin, gotong royong, dan kepedulian terhadap potensi masyarakat.</p>
          <p>Salah satu kontribusi tersebut adalah LoningMaju, etalase digital yang membantu informasi UMKM, produk, dan lokasi usaha warga tersaji dalam satu tempat yang mudah dijangkau.</p>
        </div>
      </section>

      <section aria-labelledby="kontribusi-heading" className="border-b border-line px-4 py-10">
        <Eyebrow>Kontribusi kami</Eyebrow>
        <h2 id="kontribusi-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Bertumbuh bersama Desa Loning</h2>
        <div className="mt-5 grid gap-px border border-line bg-line">
          {CONTRIBUTIONS.map((contribution) => (
            <div key={contribution.title} className="bg-surface p-6">
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{contribution.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{contribution.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="bg-ink p-6 text-on-brand">
          <p className="flex items-center gap-2 text-accent-ink">
            <Users size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Di balik platform</span>
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">LoningMaju dikembangkan oleh Stephen Michael</h2>
          <p className="mt-3 text-sm leading-relaxed text-on-brand/65">
            Sebagai bagian dari KKN Reguler Tim II UNDIP 2026 Desa Loning, platform ini dibangun untuk mendukung visibilitas dan kemandirian digital UMKM lokal.
          </p>
          <ButtonLink to="/m" variant="accent" size="lg" className="mt-5 w-full">Jelajahi LoningMaju</ButtonLink>
        </div>
      </section>
    </article>
  );
}
