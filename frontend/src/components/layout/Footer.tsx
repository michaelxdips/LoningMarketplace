/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { Compass, MapPin, Clock, MessageSquare, ArrowUpRight, Code2 } from 'lucide-react';
import { brand } from '../../config/brand';
import DeveloperContactDialog from '../shared/DeveloperContactDialog';

export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="border-t border-white/10 bg-charcoal pb-8 pt-12 text-cream-tint">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Grid */}
          <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Column 1: Brand & Village Address */}
            <div className="space-y-4">
              <Link
                to="/"
                onClick={scrollToTop}
                className="focus-ring flex w-fit items-center gap-2 rounded text-white transition-opacity hover:opacity-90"
              >
                <Compass size={24} className="text-terracotta" />
                <span className="text-base font-extrabold uppercase tracking-wide" aria-label={brand.name}>
                  Loning<span className="text-terracotta">Maju</span>
                </span>
              </Link>

              <p className="text-xs leading-relaxed text-cream-tint/70">
                Direktori resmi dan etalase digital produk UMKM Desa Loning, Kecamatan Petarukan, Kabupaten Pemalang, Jawa Tengah.
              </p>

              <div className="flex items-start gap-2 pt-2 text-xs text-cream-tint/80">
                <MapPin size={16} className="mt-0.5 shrink-0 text-terracotta" />
                <span>Desa Loning, Kec. Petarukan, Kab. Pemalang, Jawa Tengah 52362</span>
              </div>
            </div>

            {/* Column 2: Quick Navigation (Peta Situs) */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Peta Situs & Navigasi</h2>
              <nav aria-label="Peta situs" className="mt-4 flex flex-col gap-2.5 text-xs">
                <a href="/#featured-products" className="focus-ring flex items-center gap-1.5 rounded text-cream-tint/70 transition-colors hover:text-white">
                  <span>Katalog Produk</span>
                  <ArrowUpRight size={12} className="text-cream-tint/40" />
                </a>
                <a href="/#umkm" className="focus-ring flex items-center gap-1.5 rounded text-cream-tint/70 transition-colors hover:text-white">
                  <span>Profil Pelaku UMKM</span>
                  <ArrowUpRight size={12} className="text-cream-tint/40" />
                </a>
                <Link to="/peta-umkm" className="focus-ring rounded text-cream-tint/70 transition-colors hover:text-white">
                  Peta Lokasi UMKM
                </Link>
                <Link to="/tentang-desa" className="focus-ring rounded text-cream-tint/70 transition-colors hover:text-white">
                  Tentang Desa Loning
                </Link>
                <Link to="/faq" className="focus-ring rounded text-cream-tint/70 transition-colors hover:text-white">
                  Pertanyaan Umum (FAQ)
                </Link>
                <Link to="/login" className="focus-ring rounded text-cream-tint/70 transition-colors hover:text-terracotta font-medium">
                  Masuk Pengelola
                </Link>
              </nav>
            </div>

            {/* Column 3: Operational & Information & Developer Contact */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Jam Layanan & Kontak</h2>
              <div className="space-y-3 text-xs text-cream-tint/75">
                <div className="flex items-start gap-2">
                  <Clock size={16} className="mt-0.5 shrink-0 text-terracotta" />
                  <div>
                    <p className="font-semibold text-white">Jam Operasional Usaha</p>
                    <p className="text-[11px] text-cream-tint/60">Senin – Minggu: 08.00 – 17.00 WIB</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare size={16} className="mt-0.5 shrink-0 text-terracotta" />
                  <div>
                    <p className="font-semibold text-white">Pesan Langsung UMKM</p>
                    <p className="text-[11px] text-cream-tint/60">Tanya stok dan negosiasi langsung via WhatsApp.</p>
                  </div>
                </div>
                
                {/* Developer Contact Button */}
                <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                  <Code2 size={16} className="mt-0.5 shrink-0 text-terracotta" />
                  <div>
                    <p className="font-semibold text-white">Bantuan Teknikal & Error</p>
                    <button
                      type="button"
                      onClick={() => setIsDeveloperDialogOpen(true)}
                      className="focus-ring text-[11px] text-terracotta hover:underline font-semibold flex items-center gap-1 mt-0.5 text-left"
                    >
                      <span>Hubungi Developer (Michael)</span>
                      <MessageSquare size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Direct Transaction Notice (Bebas Komisi) */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta">
                💡 Transaksi Bebas Komisi
              </h2>
              <p className="text-[11px] leading-relaxed text-cream-tint/70">
                Platform ini tidak memotong biaya atau memproses pembayaran. Transaksi dilakukan 100% secara langsung antara pembeli dan pelaku UMKM via WhatsApp.
              </p>
            </div>

          </div>

          {/* Bottom Credits & Copyright */}
          <div className="flex flex-col gap-3 pt-6 text-[11px] text-cream-tint/40 sm:flex-row sm:items-center sm:justify-between">
            <span>&copy; {new Date().getFullYear()} {brand.name}. Hak Cipta Dilindungi.</span>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => setIsDeveloperDialogOpen(true)}
                className="focus-ring rounded text-cream-tint/60 hover:text-white transition-colors underline underline-offset-2 flex items-center gap-1"
              >
                <span>Hubungi Developer</span>
                <MessageSquare size={10} />
              </button>
              <Link to="/login" className="focus-ring rounded text-cream-tint/60 hover:text-white transition-colors underline underline-offset-2">
                Masuk Pengelola
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="focus-ring rounded text-cream-tint/60 hover:text-white transition-colors underline underline-offset-2"
              >
                Kembali ke atas &uarr;
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Interactive Developer Form Chat Modal */}
      <DeveloperContactDialog
        isOpen={isDeveloperDialogOpen}
        onClose={() => setIsDeveloperDialogOpen(false)}
      />
    </>
  );
}
