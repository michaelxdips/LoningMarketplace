import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

/**
 * Footer V2 (mobile) — ringkas & seimbang.
 */
export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  return (
    <>
      <footer className="mt-12 border-t border-line bg-sunken pb-24">
        <div className="px-4 py-8">
          <Link
            to="/m"
            aria-label={`${brand.name} — beranda`}
            className="focus-ring-v2 inline-block rounded font-display text-xl font-semibold tracking-tight text-ink"
          >
            Loning<span className="font-light italic text-accent-ink">Maju</span>
          </Link>

          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Direktori resmi dan etalase digital produk UMKM Desa Loning. Terhubung langsung via WhatsApp tanpa perantara.
          </p>

          <p className="mt-2.5 flex items-start gap-1.5 text-xs text-ink-muted">
            <MapPin size={13} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <span>Desa Loning, Kec. Petarukan, Kab. Pemalang 52362</span>
          </p>

          <nav aria-label="Peta situs" className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Link to="/m/produk" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Katalog Produk</Link>
            <Link to="/m/umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Profil UMKM</Link>
            <Link to="/m/peta-umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Peta Lokasi</Link>
            <Link to="/m/tersimpan" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tersimpan</Link>
            <Link to="/m/tentang-desa" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Desa</Link>
            <Link to="/m/faq" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">FAQ</Link>
            <Link to="/m/tentang-kami" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Kami</Link>
            <Link to="/m/version-history" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Riwayat Versi</Link>
            <Link to="/m/login" className="focus-ring-v2 col-span-2 text-ink-muted transition-colors hover:text-ink">Masuk Pengelola</Link>
          </nav>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs">
            <span className="text-ink-muted">Stephen Michael (KKN UNDIP)</span>
            <button
              type="button"
              onClick={() => setIsDeveloperDialogOpen(true)}
              className="focus-ring-v2 inline-flex items-center gap-1 font-medium text-accent-ink transition-colors hover:text-ink"
            >
              Hubungi Developer
              <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-ink-subtle">
            <span>&copy; {new Date().getFullYear()} {brand.name}</span>
            <Link
              to="/"
              className="focus-ring-v2 inline-flex items-center gap-1 text-accent-ink transition-colors hover:text-ink"
            >
              <ArrowLeft size={11} strokeWidth={1.5} aria-hidden="true" />
              Tampilan klasik
            </Link>
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
