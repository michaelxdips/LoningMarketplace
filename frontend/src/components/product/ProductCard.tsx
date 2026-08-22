/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router';
import { MessageSquare, Eye, ArrowRight } from 'lucide-react';
import { getCategoryShortLabel, Product } from '../../types';
import { formatPrice } from '../../lib/price';
import { ProductImage } from './ProductImage';
import { ProductGallery, type GalleryImage } from './ProductGallery';

export type ProductViewSource = 'homepage_featured';
type ProductCardProps = { product: Product } & (
  | { variant?: 'catalog'; onInquire: (product: Product) => void; onViewMerchant: (merchantId: string) => void; onViewProduct: (product: Product, trigger: HTMLElement, source: ProductViewSource) => void }
  | { variant: 'related' }
);

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const { product } = props;
  const imageCount = product.images?.length ?? 0;
  const content = <>
    <div className="relative h-52 w-full overflow-hidden bg-cream-tint">
      <ProductImage src={product.imageUrl} alt={product.altText || product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent" />
      {imageCount > 1 && <span className="absolute left-3 top-3 bg-charcoal/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">📷 {imageCount}</span>}
      {product.unit && <span className="absolute right-3 top-3 bg-charcoal/75 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-full uppercase">/ {product.unit}</span>}
    </div>
    <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
      <div>
        <span title={product.category} className="mb-1.5 block truncate text-[11px] font-bold uppercase tracking-widest text-terracotta">{getCategoryShortLabel(product.category)}</span>
        {props.variant === 'related' ? <h3 title={product.name} className="line-clamp-1 font-serif text-base font-semibold text-charcoal transition-colors group-hover:text-forest">{product.name}</h3> : <h4 title={product.name} className="line-clamp-1 font-serif text-base font-semibold text-charcoal transition-colors group-hover:text-forest">{product.name}</h4>}
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-warm-gray">{product.description}</p>
      </div>
      <div className="mt-auto flex items-baseline justify-between border-t border-sage-border/60 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-warm-gray">Harga</span>
        <span className="font-serif text-lg font-semibold text-forest">{formatPrice(product.price, 'Hubungi Penjual')}</span>
      </div>
    </div>
  </>;
  return (
    <article id={`product-card-${product.id}`} className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-sage-border bg-cream-card transition-all duration-300 hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-md">
      {props.variant === 'related' ? (
        <Link to={`/produk/${encodeURIComponent(product.slug)}`} aria-label={`Buka produk terkait ${product.name}`} className="focus-ring block flex h-full w-full flex-col justify-between text-left">
          {content}
        </Link>
      ) : (
        <>
          <button type="button" aria-label={`Lihat detail ${product.name}`} onClick={(event) => props.onViewProduct(product, event.currentTarget, 'homepage_featured')} className="focus-ring block w-full cursor-pointer text-left flex flex-1 flex-col justify-between">
            {content}
          </button>
          <div className="flex items-center gap-2.5 px-5 pb-5">
            <Link to={`/produk/${encodeURIComponent(product.slug)}`} title="Buka halaman produk" className="focus-ring touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-sage-border text-forest transition-colors hover:border-forest/30 hover:bg-sage-light" aria-label={`Buka halaman ${product.name}`}>
              <Eye size={15} aria-hidden="true" />
            </Link>
            <button id={`product-cta-${product.id}`} type="button" onClick={() => props.onInquire(product)} className="focus-ring touch-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-forest px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-forest-hover">
              <MessageSquare size={13} aria-hidden="true" />
              <span className="truncate">Tanya Produk</span>
              <ArrowRight size={13} aria-hidden="true" className="shrink-0" />
            </button>
          </div>
        </>
      )}
    </article>
  );
};

export default ProductCard;
