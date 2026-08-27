import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

/**
 * Footer V2 (mobile) — selaras dengan footer UI lama, satu kolom.
 *
 * Mobile tidak punya navbar penuh, jadi footer ini adalah satu-satunya jalan
 * ke halaman sekunder (FAQ, tentang, riwayat versi, login) selain link inline.
 */
export default function Footer() {
  const [isDeveloperDialogOpen, setIsDeveloperDialogOpen] = useState(false);

  return (
    <>
      <footer className="mt-16 border-t border-line bg-sunken pb-28">
        <div className="px-4 py-10">
          <Link
            to="/m"
            aria-label={`${brand.name} — beranda`}
            className="focus-ring-v2 inline-block rounded font-display text-2xl font-semibold tracking-tight text-ink"
          >
            Loning<span className="font-light italic text-accent-ink">Maju</span>
          </Link>

          <p className="mt-4 text-sm leading-7 text-ink-muted">
            Direktori resmi dan etalase digital produk UMKM Desa Loning. Setiap produk
            dihubungkan langsung ke pelaku usaha melalui WhatsApp, tanpa perantara.
          </p>

          <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted">
            <MapPin size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-accent-ink" aria-hidden="true" />
            <span>Desa Loning, Kec. Petarukan, Kab. Pemalang, Jawa Tengah 52362</span>
          </p>

          <nav aria-label="Peta situs" className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Link to="/m/produk" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Katalog Produk</Link>
            <Link to="/m/umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Profil Pelaku UMKM</Link>
            <Link to="/m/peta-umkm" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Peta Lokasi UMKM</Link>
            <Link to="/m/tersimpan" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tersimpan</Link>
            <Link to="/m/tentang-desa" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Desa Loning</Link>
            <Link to="/m/faq" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Pertanyaan Umum</Link>
            <Link to="/m/tentang-kami" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Tentang Kami</Link>
            <Link to="/m/version-history" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Riwayat Versi</Link>
            <Link to="/m/login" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Masuk Pengelola</Link>
          </nav>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">Dikembangkan oleh</p>
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

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-xs text-ink-subtle">
              &copy; {new Date().getFullYear()} {brand.name}. KKN Reguler Tim II UNDIP 2026, Desa Loning.
            </p>
            <Link
              to="/"
              className="focus-ring-v2 mt-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-accent-ink transition-colors hover:text-ink"
            >
              Kembali ke tampilan klasik
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
