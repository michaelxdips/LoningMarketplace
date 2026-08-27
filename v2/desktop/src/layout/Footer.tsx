import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

/**
 * Footer V2 (desktop) — Super-Compact Minimalist Bar (Ultra Hemat Ruang Vertikal).
 * Tinggi total hanya ~80px-90px.
 */
export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="mt-8 border-t border-line bg-sunken py-4">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 text-xs lg:px-10">
          {/* Baris 1: Brand, Navigasi Inti, Info Dev */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-line/60 pb-3">
            {/* Brand & Alamat Singkat */}
            <div className="flex items-center gap-3">
              <Link
                to="/v2"
                onClick={scrollToTop}
                aria-label={`${brand.name} — beranda`}
                className="focus-ring-v2 rounded font-display text-base font-semibold tracking-tight text-ink transition-colors hover:text-brand"
              >
                Loning<span className="font-light italic text-accent-ink">Maju</span>
              </Link>
              <span className="text-ink-subtle">&middot;</span>
              <span className="hidden items-center gap-1 text-[11px] text-ink-muted sm:inline-flex">
                <MapPin size={11} className="text-accent-ink" aria-hidden="true" />
                Desa Loning, Pemalang
              </span>
            </div>

            {/* Navigasi Horizontal Rapi */}
            <nav aria-label="Peta situs direktori" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              <Link to="/v2/produk" className="focus-ring-v2 hover:text-ink">Produk</Link>
              <span>&middot;</span>
              <Link to="/v2/umkm" className="focus-ring-v2 hover:text-ink">UMKM</Link>
              <span>&middot;</span>
              <Link to="/v2/peta-umkm" className="focus-ring-v2 hover:text-ink">Peta</Link>
              <span>&middot;</span>
              <Link to="/v2/tersimpan" className="focus-ring-v2 hover:text-ink">Tersimpan</Link>
              <span>&middot;</span>
              <Link to="/v2/tentang-desa" className="focus-ring-v2 hover:text-ink">Tentang</Link>
              <span>&middot;</span>
              <Link to="/v2/faq" className="focus-ring-v2 hover:text-ink">FAQ</Link>
              <span>&middot;</span>
              <Link to="/v2/version-history" className="focus-ring-v2 hover:text-ink">Versi</Link>
              <span>&middot;</span>
              <Link to="/v2/login" className="focus-ring-v2 hover:text-ink">Pengelola</Link>
            </nav>

            {/* Dev Contact */}
            <button
              type="button"
              onClick={() => setIsDeveloperDialogOpen(true)}
              className="focus-ring-v2 inline-flex items-center gap-1 text-[11px] font-medium text-accent-ink transition-colors hover:text-ink"
            >
              Hubungi Developer
              <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {/* Baris 2: Copyright, Disclaimer, Switcher Klasik */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-subtle">
            <p>
              &copy; {new Date().getFullYear()} {brand.name} &middot; KKN Tim II UNDIP 2026 &middot; Transaksi langsung via WhatsApp tanpa perantara.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="focus-ring-v2 inline-flex items-center gap-1 text-accent-ink transition-colors hover:text-ink"
              >
                <ArrowLeft size={11} strokeWidth={1.5} aria-hidden="true" />
                Tampilan klasik
              </Link>
              <button
                type="button"
                onClick={scrollToTop}
                className="focus-ring-v2 rounded transition-colors hover:text-ink"
              >
                Atas &uarr;
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
