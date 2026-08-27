import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

/**
 * Footer V2 (desktop) — proporsional & ringkas.
 */
export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="mt-16 border-t border-line bg-sunken">
        <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Brand + Alamat & Credit Ringkas */}
            <div className="lg:col-span-5">
              <Link
                to="/v2"
                onClick={scrollToTop}
                aria-label={`${brand.name} — beranda`}
                className="focus-ring-v2 inline-block rounded font-display text-2xl font-semibold tracking-tight text-ink transition-colors hover:text-brand"
              >
                Loning<span className="font-light italic text-accent-ink">Maju</span>
              </Link>

              <p className="mt-3 max-w-sm text-xs leading-relaxed text-ink-muted">
                Direktori resmi dan etalase digital produk UMKM Desa Loning. Terhubung langsung ke pelaku usaha via WhatsApp tanpa perantara.
              </p>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted">
                <MapPin size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                <span>Desa Loning, Kec. Petarukan, Kab. Pemalang, Jawa Tengah 52362</span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                <span>Dikembangkan oleh <strong className="font-medium text-ink">Stephen Michael</strong> (KKN Tim II UNDIP)</span>
                <span>&middot;</span>
                <button
                  type="button"
                  onClick={() => setIsDeveloperDialogOpen(true)}
                  className="focus-ring-v2 inline-flex items-center gap-1 rounded font-medium text-accent-ink transition-colors hover:text-ink"
                >
                  Hubungi Developer
                  <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Jelajahi */}
            <div className="lg:col-span-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Jelajahi Direktori
              </h2>
              <nav aria-label="Peta situs" className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <Link to="/v2/produk" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Katalog Produk</Link>
                <Link to="/v2/umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Profil UMKM</Link>
                <Link to="/v2/peta-umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Peta Lokasi</Link>
                <Link to="/v2/tersimpan" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tersimpan</Link>
                <Link to="/v2/tentang-desa" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Desa</Link>
                <Link to="/v2/faq" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">FAQ</Link>
              </nav>
            </div>

            {/* Informasi & Akses */}
            <div className="lg:col-span-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Informasi & Akses
              </h2>
              <nav aria-label="Informasi dan akses" className="mt-3 grid gap-2 text-xs">
                <Link to="/v2/version-history" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Riwayat Versi</Link>
                <Link to="/v2/tentang-kami" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Tim KKN</Link>
                <Link to="/v2/login" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Masuk Pengelola</Link>
              </nav>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Switcher, Disclaimer Singkat */}
          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 text-[11px] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {brand.name} &middot; Non-transaksional (pemesanan langsung via WhatsApp).
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link
                to="/"
                className="focus-ring-v2 inline-flex items-center gap-1 text-accent-ink transition-colors hover:text-ink"
              >
                <ArrowLeft size={12} strokeWidth={1.5} aria-hidden="true" />
                Tampilan klasik
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="focus-ring-v2 rounded transition-colors hover:text-ink"
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
