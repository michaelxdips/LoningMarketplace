/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { brand } from '../../config/brand';
import DeveloperContactDialog from '../shared/DeveloperContactDialog';

export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="border-t border-white/10 bg-charcoal pb-10 pt-16 text-cream-tint">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Editorial masthead — brand + one nav column, no boxed developer card */}
          <div className="grid gap-14 lg:grid-cols-12">
            {/* Brand */}
            <div className="lg:col-span-7">
              <Link
                to="/"
                onClick={scrollToTop}
                aria-label={`${brand.name} — beranda`}
                className="focus-ring inline-block rounded font-serif text-3xl font-semibold tracking-tight text-white transition-colors hover:text-terracotta-soft"
              >
                Loning<span className="font-light italic text-terracotta">Maju</span>
              </Link>

              <p className="mt-6 max-w-md text-sm leading-7 text-cream-tint/70">
                Direktori resmi dan etalase digital produk UMKM Desa Loning. Setiap produk
                dihubungkan langsung ke pelaku usaha melalui WhatsApp — tanpa perantara.
              </p>

              <div className="mt-6 flex items-start gap-2 text-sm text-cream-tint/70">
                <MapPin size={16} className="mt-1 shrink-0 text-terracotta" />
                <span>Desa Loning, Kec. Petarukan, Kab. Pemalang, Jawa Tengah 52362</span>
              </div>
            </div>

            {/* Peta situs */}
            <div className="lg:col-span-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">
                Peta Situs
              </h2>
              <nav aria-label="Peta situs" className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <Link to="/#featured-products" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Katalog Produk</Link>
                <Link to="/#umkm" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Profil Pelaku UMKM</Link>
                <Link to="/peta-umkm" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Peta Lokasi UMKM</Link>
                <Link to="/tentang-desa" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Tentang Desa Loning</Link>
                <Link to="/faq" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Pertanyaan Umum (FAQ)</Link>
                <Link to="/version-history" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Riwayat Versi (Version History)</Link>
                <Link to="/tentang-kami" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Tentang Kami</Link>
                <Link to="/login" className="focus-ring rounded text-cream-tint/75 transition-colors hover:text-white">Pengelola</Link>
              </nav>

              {/* Developer credit — quiet editorial line, not a box */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">Dikembangkan oleh</p>
                <p className="mt-2 text-sm text-cream-tint/80">
                  Stephen Michael &middot; KKN Reguler Tim II UNDIP 2026 &middot; Desa Loning
                </p>
                <button
                  type="button"
                  onClick={() => setIsDeveloperDialogOpen(true)}
                  className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded text-xs text-terracotta transition-colors hover:text-white"
                >
                  Hubungi Developer
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom credits */}
          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-cream-tint/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {brand.name}. KKN Reguler Tim II UNDIP 2026, Desa Loning.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* Saklar ke UI V2. Tautan biasa (bukan tombol) supaya bisa
                  dibuka di tab baru dan di-bookmark selama masa transisi. */}
              <Link
                to="/v2"
                className="focus-ring rounded text-terracotta transition-colors hover:text-white"
              >
                Coba tampilan baru &rarr;
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="focus-ring rounded text-cream-tint/60 transition-colors hover:text-white"
              >
                Kembali ke atas &uarr;
              </button>
            </div>
          </div>
        </div>
      </footer>

      <DeveloperContactDialog
        isOpen={isDeveloperDialogOpen}
        onClose={() => setIsDeveloperDialogOpen(false)}
      />
    </>
  );
}
