import { usePageMetadata } from '@loning/shared/lib/seo';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';

/**
 * 404 V2 mobile.
 */
export default function NotFoundPage() {
  usePageMetadata({ title: 'Halaman tidak ditemukan — Loning Maju', description: 'Halaman yang Anda cari tidak tersedia.' });

  return (
    <div className="px-4 py-24">
      <p className="numeric text-sm text-ink-subtle">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">Tautan mungkin sudah berubah atau halaman telah dipindahkan. Kembali ke beranda untuk menelusuri produk dan pelaku usaha Desa Loning.</p>
      <div className="mt-6">
        <ButtonLink to="/m" size="lg">Kembali ke beranda</ButtonLink>
      </div>
    </div>
  );
}
