import { Link } from 'react-router';
import { getCategoryShortLabel, type Product } from '@loning/shared';
import { formatPrice } from '@loning/shared/lib/price';
import { Badge } from '@v2-shared/ui/Badge';
import { MediaImage } from '@v2-shared/ui/MediaImage';

/**
 * ProductCard V2 (desktop).
 *
 * Menyimpang sadar dari "kartu" konvensional: tanpa border penuh + shadow.
 * Struktur editorial -> gambar, lalu blok teks dipisah hairline di atas harga.
 * Seluruh permukaan bisa diklik lewat satu Link yang membungkus judul
 * (pola stretched-link), sehingga hanya ada SATU target untuk pembaca layar,
 * bukan tiga link ke tujuan yang sama.
 */
export default function ProductCard({ product }: { product: Product }) {
  const price = formatPrice(product.price);

  return (
    <article className="group relative flex flex-col">
      <MediaImage
        src={product.imageUrl}
        alt={product.altText ?? `Foto produk ${product.name}`}
        ratio="aspect-[4/3]"
      />

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-ink">
            {/* Stretched link: area klik seluas kartu, satu entri di daftar link. */}
            <Link
              to={`/v2/produk/${product.slug}`}
              className="focus-ring-v2 after:absolute after:inset-0 after:content-['']"
            >
              {product.name}
            </Link>
          </h3>
          {!product.isAvailable ? (
            <Badge variant="outline" className="mt-0.5">
              Kosong
            </Badge>
          ) : null}
        </div>

        <p className="mt-1.5 text-sm text-ink-muted">{product.umkmName}</p>

        <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-ink-subtle">Harga</span>
            <p className="numeric mt-0.5 text-base font-medium text-ink">
              {price}
              {product.unit ? (
                <span className="text-sm font-normal text-ink-muted"> / {product.unit}</span>
              ) : null}
            </p>
          </div>
          <span className="text-xs text-ink-subtle">{getCategoryShortLabel(product.category)}</span>
        </div>
      </div>
    </article>
  );
}
