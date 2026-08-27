import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

/**
 * Footer V2 (desktop).
 *
 * Selaras dengan footer UI lama (parity): peta situs lengkap (termasuk Tentang
 * Kami, Riwayat Versi, dan Pengelola), credit developer + tombol Hubungi
 * Developer, kembalikan ke atas, dan copyright. Bedanya hanya styling V2.
 *
 * Di sini juga letak SWITCH kembali ke tampilan klasik — pasangan dari tombol
 * "Coba tampilan baru" di footer UI lama. Mekanisme migrasi bertahap.
 */
export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="mt-24 border-t border-line bg-sunken">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Brand + developer */}
            <div className="lg:col-span-6">
              <Link
                to="/v2"
                onClick={scrollToTop}
                aria-label={`${brand.name} — beranda`}
                className="focus-ring-v2 inline-block rounded font-display text-3xl font-semibold tracking-tight text-ink transition-colors hover:text-brand"
              >
                Loning<span className="font-light italic text-accent-ink">Maju</span>
              </Link>

              <p className="mt-5 max-w-md text-sm leading-7 text-ink-muted">
                Direktori resmi dan etalase digital produk UMKM Desa Loning. Setiap produk
                dihubungkan langsung ke pelaku usaha melalui WhatsApp, tanpa perantara.
              </p>

              <p className="mt-5 flex items-start gap-2 text-sm text-ink-muted">
                <MapPin size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-accent-ink" aria-hidden="true" />
                <span>Desa Loning, Kec. Petarukan, Kab. Pemalang, Jawa Tengah 52362</span>
              </p>

              <div className="mt-8 border-t border-line pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                  Dikembangkan oleh
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Stephen Michael &middot; KKN Reguler Tim II UNDIP 2026 &middot; Desa Loning
                </p>
                <button
                  type="button"
                  onClick={() => setIsDeveloperDialogOpen(true)}
                  className="focus-ring-v2 mt-2 inline-flex items-center gap-1.5 rounded text-xs font-medium text-accent-ink transition-colors hover:text-ink"
                >
                  Hubungi Developer
                  <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Jelajahi */}
            <div className="lg:col-span-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Jelajahi
              </h2>
              <nav aria-label="Peta situs" className="mt-5 grid gap-3 text-sm">
                <Link to="/v2/produk" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Katalog Produk</Link>
                <Link to="/v2/umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Profil Pelaku UMKM</Link>
                <Link to="/v2/peta-umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Peta Lokasi UMKM</Link>
                <Link to="/v2/tersimpan" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tersimpan</Link>
                <Link to="/v2/tentang-desa" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Desa Loning</Link>
                <Link to="/v2/faq" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Pertanyaan Umum (FAQ)</Link>
              </nav>
            </div>

            {/* Informasi & akses */}
            <div className="lg:col-span-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Informasi & Akses
              </h2>
              <nav aria-label="Informasi dan akses" className="mt-5 grid gap-3 text-sm">
                <Link to="/v2/version-history" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Riwayat Versi</Link>
                <Link to="/v2/tentang-kami" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Kami</Link>
                <Link to="/v2/login" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Masuk Pengelola</Link>
              </nav>
            </div>
          </div>

          {/* Bottom credits */}
          <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {brand.name}. KKN Reguler Tim II UNDIP 2026, Desa Loning.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* Saklar kembali ke UI lama. Tautan biasa (bukan tombol) supaya bisa
                  dibuka di tab baru dan di-bookmark selama masa transisi. */}
              <Link
                to="/"
                className="focus-ring-v2 inline-flex items-center gap-1.5 rounded text-accent-ink transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
                Kembali ke tampilan klasik
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="focus-ring-v2 rounded text-ink-subtle transition-colors hover:text-ink"
              >
                Kembali ke atas &uarr;
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-xs leading-6 text-ink-subtle">
              {brand.name} bukan toko online. Tidak ada keranjang, pembayaran, atau pengiriman di
              situs ini. Seluruh transaksi berlangsung langsung antara pembeli dan pelaku usaha.
            </p>
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
