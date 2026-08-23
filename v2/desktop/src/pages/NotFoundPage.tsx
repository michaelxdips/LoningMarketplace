import { usePageMetadata } from '@loning/shared/lib/seo';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';

export default function NotFoundPage() {
  usePageMetadata({
    title: 'Halaman tidak ditemukan — Loning Maju',
    description: 'Halaman yang Anda cari tidak tersedia.',
  });

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10">
      <p className="numeric text-sm text-ink-subtle">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-ink-muted">
        Tautan mungkin sudah berubah atau halaman telah dipindahkan. Kembali ke beranda untuk
        menelusuri produk dan pelaku usaha Desa Loning.
      </p>
      <div className="mt-8">
        <ButtonLink to="/v2" size="lg">
          Kembali ke beranda
        </ButtonLink>
      </div>
    </div>
  );
}
