import { Link } from 'react-router';
import { getCategoryShortLabel, type Product } from '@loning/shared';
import { formatPrice } from '@loning/shared/lib/price';
import { Badge } from '@v2-shared/ui/Badge';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import FavoriteButton from '@v2-shared/components/FavoriteButton';

/**
 * ProductCard V2 mobile — varian mobile dari kartu produk.
 *
 * Satu kolom penuh, gambar 4:3, tap area besar (44px+). Stretched-link tunggal
 * supaya seluruh kartu satu target untuk pembaca layar; tombol favorit di
 * pojok gambar (z-10) adalah interaksi tambahan.
 */
export default function ProductCard({ product }: { product: Product }) {
  const price = formatPrice(product.price);
  return (
    <article className="group relative">
      <div className="relative">
        <MediaImage src={product.imageUrl} alt={product.altText ?? `Foto produk ${product.name}`} ratio="aspect-[4/3]" />
        <FavoriteButton kind="product" slug={product.slug} name={`produk ${product.name}`} className="absolute right-2 top-2" />
      </div>
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-ink">
            <Link to={`/m/produk/${product.slug}`} className="focus-ring-v2 after:absolute after:inset-0 after:content-['']">
              {product.name}
            </Link>
          </h3>
          {!product.isAvailable ? <Badge variant="outline">Kosong</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{product.umkmName}</p>
        <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-line pt-2">
          <span className="numeric text-base font-medium text-ink">
            {price}
            {product.unit ? <span className="text-sm font-normal text-ink-muted"> / {product.unit}</span> : null}
          </span>
          <span className="text-xs text-ink-subtle">{getCategoryShortLabel(product.category)}</span>
        </div>
      </div>
    </article>
  );
}
