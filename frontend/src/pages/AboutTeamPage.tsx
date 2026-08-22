/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, Landmark, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import { usePageMetadata } from '../lib/seo';

const contributions = [
  { title: 'Digitalisasi Potensi Desa', description: 'Menghadirkan LoningMaju sebagai ruang digital untuk memperkenalkan UMKM dan produk lokal Desa Loning.' },
  { title: 'Kolaborasi Bersama Warga', description: 'Membangun solusi melalui pendekatan partisipatif agar teknologi tetap relevan dengan kebutuhan masyarakat.' },
  { title: 'Dampak yang Berkelanjutan', description: 'Menyusun platform yang dapat terus dimanfaatkan sebagai media informasi dan promosi setelah masa pengabdian.' },
];

export default function AboutTeamPage() {
  const description = 'Tentang KKN Reguler Tim II UNDIP 2026 Desa Loning dan kontribusinya melalui platform LoningMaju.';
  usePageMetadata({ title: 'Tentang Kami — KKN Reguler Tim II UNDIP 2026 Desa Loning', description, jsonLd: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'KKN Reguler Tim II UNDIP 2026 Desa Loning', description } });

  return (
    <PublicPageShell>
      <article className="bg-cream-bg text-charcoal antialiased">
        <header className="relative overflow-hidden border-b border-sage-border bg-forest px-5 py-20 text-cream-tint md:py-28">
          <div className="relative mx-auto max-w-7xl">
            <Link to="/" className="focus-ring mb-10 inline-flex items-center gap-2 rounded text-xs font-bold uppercase tracking-wider text-cream-tint/70 transition-colors hover:text-white">
              <ArrowLeft size={15} aria-hidden="true" /> Kembali ke Beranda
            </Link>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="space-y-6 lg:col-span-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-cream-tint">
                  <Landmark size={14} className="text-terracotta" aria-hidden="true" /> Universitas Diponegoro
                </div>
                <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Mengabdi, berkolaborasi, dan <span className="font-light italic text-terracotta-soft">bertumbuh bersama.</span>
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-cream-tint/75 md:text-lg">
                  KKN Reguler Tim II UNDIP 2026 hadir di Desa Loning untuk belajar dari masyarakat, bekerja bersama warga, dan menghadirkan kontribusi yang bermanfaat bagi desa.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-6 lg:col-span-4">
                <div className="flex items-start gap-3"><MapPin size={20} className="mt-0.5 shrink-0 text-terracotta" aria-hidden="true" /><div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream-tint/70">Lokasi Pengabdian</p>
                  <p className="mt-1 font-bold text-white">Desa Loning</p><p className="mt-0.5 text-xs text-cream-tint/65">Petarukan, Pemalang, Jawa Tengah</p>
                </div></div>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20" aria-labelledby="tentang-tim-heading">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5"><p className="editorial-label">Tentang Tim</p><h2 id="tentang-tim-heading" className="mt-2 font-serif text-3xl font-semibold tracking-tight text-charcoal md:text-4xl">Teknologi sebagai jembatan potensi lokal</h2></div>
            <div className="space-y-4 text-sm leading-relaxed text-warm-gray lg:col-span-7 lg:text-base">
              <p>Kami adalah mahasiswa KKN Reguler Tim II Universitas Diponegoro tahun 2026 yang melaksanakan pengabdian di Desa Loning. Kegiatan kami berangkat dari semangat multidisiplin, gotong royong, dan kepedulian terhadap potensi masyarakat.</p>
              <p>Salah satu kontribusi tersebut adalah LoningMaju, etalase digital yang membantu informasi UMKM, produk, dan lokasi usaha warga tersaji dalam satu tempat yang mudah dijangkau.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-sage-border bg-cream-tint px-5 py-16" aria-labelledby="kontribusi-heading">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-2xl text-center"><p className="editorial-label">Kontribusi Kami</p><h2 id="kontribusi-heading" className="mt-2 font-serif text-3xl font-semibold tracking-tight text-charcoal">Bertumbuh bersama Desa Loning</h2></div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-sage-border bg-sage-border md:grid-cols-3">
              {contributions.map(({ title, description: itemDescription }) => (
                <div key={title} className="bg-cream-card p-7">
                  <h3 className="font-serif text-lg font-semibold text-charcoal">{title}</h3><p className="mt-3 text-sm leading-6 text-warm-gray">{itemDescription}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-charcoal p-8 text-cream-tint md:p-12">
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-terracotta"><Users size={18} aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-widest">Di Balik Platform</span></div>
                <h2 className="font-serif text-2xl font-semibold text-white md:text-3xl">LoningMaju dikembangkan oleh Stephen Michael</h2>
                <p className="mt-3 text-sm leading-relaxed text-cream-tint/65">Sebagai bagian dari KKN Reguler Tim II UNDIP 2026 Desa Loning, platform ini dibangun untuk mendukung visibilitas dan kemandirian digital UMKM lokal.</p>
              </div>
              <Link to="/" className="focus-ring inline-flex shrink-0 items-center justify-center rounded-xl bg-terracotta px-5 py-3 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">Jelajahi LoningMaju</Link>
            </div>
          </div>
        </section>
      </article>
    </PublicPageShell>
  );
}
