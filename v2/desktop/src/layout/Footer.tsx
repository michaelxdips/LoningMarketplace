import { Link } from 'react-router';
import { ArrowLeft, MapPin } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';

/**
 * Footer V2 (desktop).
 *
 * Di sini letak SWITCH kembali ke tampilan klasik — pasangan dari tombol
 * "Coba tampilan baru" di footer UI lama. Ini mekanisme migrasi bertahap:
 * pengguna bisa pulang kapan saja, jadi V2 tidak pernah menjadi jebakan.
 */
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sunken">
      <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-display text-3xl font-semibold tracking-tight text-ink">
              Loning<span className="font-light italic text-accent-ink">Maju</span>
            </p>
            <p className="mt-5 max-w-md text-sm leading-7 text-ink-muted">
              Direktori dan etalase digital produk UMKM Desa Loning. Setiap produk terhubung
              langsung ke pelaku usaha lewat WhatsApp, tanpa perantara.
            </p>
            <p className="mt-5 flex items-start gap-2 text-sm text-ink-muted">
              <MapPin size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-accent-ink" aria-hidden="true" />
              <span>Desa Loning, Kec. Petarukan, Kab. Pemalang, Jawa Tengah 52362</span>
            </p>
          </div>

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
              <Link to="/v2/faq" className="focus-ring-v2 text-ink-muted transition-colors hover:text-ink">Pertanyaan Umum</Link>
            </nav>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
              Tampilan
            </h2>
            <p className="mt-5 text-sm leading-6 text-ink-muted">
              Anda sedang memakai tampilan baru yang masih dalam pengembangan.
            </p>
            {/* Link biasa, bukan tombol: bisa dibuka di tab baru & di-bookmark. */}
            <Link
              to="/"
              className="focus-ring-v2 mt-4 inline-flex min-h-11 items-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink transition-colors hover:bg-surface"
            >
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
              Kembali ke tampilan klasik
            </Link>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="text-xs leading-6 text-ink-subtle">
            {brand.name} bukan toko online. Tidak ada keranjang, pembayaran, atau pengiriman di
            situs ini. Seluruh transaksi berlangsung langsung antara pembeli dan pelaku usaha.
          </p>
        </div>
      </div>
    </footer>
  );
}
