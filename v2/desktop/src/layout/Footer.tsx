import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

/**
 * Footer V2 (desktop) — ultra-ramping, horizontal 4-kolom kompak.
 */
export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="mt-12 border-t border-line bg-sunken">
        <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
            {/* Kolom 1: Brand & Alamat */}
            <div className="space-y-2">
              <Link
                to="/v2"
                onClick={scrollToTop}
                aria-label={`${brand.name} — beranda`}
                className="focus-ring-v2 inline-block rounded font-display text-xl font-semibold tracking-tight text-ink transition-colors hover:text-brand"
              >
                Loning<span className="font-light italic text-accent-ink">Maju</span>
              </Link>
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
                <MapPin size={12} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                <span>Desa Loning, Kec. Petarukan, Kab. Pemalang 52362</span>
              </p>
            </div>

            {/* Kolom 2: Jelajahi */}
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Jelajahi
              </h2>
              <nav aria-label="Peta situs direktori" className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <Link to="/v2/produk" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Produk</Link>
                <Link to="/v2/umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">UMKM</Link>
                <Link to="/v2/peta-umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Peta</Link>
                <Link to="/v2/tersimpan" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tersimpan</Link>
                <Link to="/v2/tentang-desa" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Desa Loning</Link>
                <Link to="/v2/faq" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">FAQ</Link>
              </nav>
            </div>

            {/* Kolom 3: Informasi */}
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Informasi
              </h2>
              <nav aria-label="Informasi dan akses" className="mt-2 grid gap-1 text-xs">
                <Link to="/v2/version-history" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Riwayat Versi</Link>
                <Link to="/v2/tentang-kami" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Tim KKN</Link>
                <Link to="/v2/login" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Masuk Pengelola</Link>
              </nav>
            </div>

            {/* Kolom 4: Developer & Kontak */}
            <div className="space-y-1.5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
                Pengembang
              </h2>
              <p className="text-xs text-ink-muted">
                Stephen Michael &middot; KKN UNDIP
              </p>
              <button
                type="button"
                onClick={() => setIsDeveloperDialogOpen(true)}
                className="focus-ring-v2 inline-flex items-center gap-1 rounded text-xs font-medium text-accent-ink transition-colors hover:text-ink"
              >
                Hubungi Developer
                <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Baris Bawah Ramping 1-Baris */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[11px] text-ink-subtle">
            <p>
              &copy; {new Date().getFullYear()} {brand.name} &middot; Direktori non-transaksional via WhatsApp.
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
