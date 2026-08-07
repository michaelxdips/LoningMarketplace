/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router';
import { MessageSquare, Eye, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
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
    <div className="h-44 w-full overflow-hidden bg-cream-tint relative">
      <ProductImage src={product.imageUrl} alt={product.altText || product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {imageCount > 1 && <span className="absolute top-3 left-3 bg-charcoal/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">📷 {imageCount}</span>}
      {product.unit && <span className="absolute top-3 right-3 bg-charcoal/80 backdrop-blur-xs text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-xs">/ {product.unit}</span>}
    </div>
    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
      <div>
        <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">{product.category}</span>
        {props.variant === 'related' ? <h3 title={product.name} className="text-sm font-bold text-charcoal line-clamp-1 group-hover:text-forest transition-colors">{product.name}</h3> : <h4 title={product.name} className="text-sm font-bold text-charcoal line-clamp-1 group-hover:text-forest transition-colors">{product.name}</h4>}
        <p className="text-xs text-warm-gray line-clamp-2 leading-relaxed mt-1">{product.description}</p>
      </div>
      <div className="pt-3 border-t border-sage-border/50 flex items-center justify-between mt-auto">
        <span className="text-[10px] font-bold text-warm-gray uppercase tracking-wider">Harga</span>
        <span className="text-[13px] font-extrabold text-forest">{formatPrice(product.price, 'Hubungi Penjual')}</span>
      </div>
    </div>
  </>;
  return (
    <article id={`product-card-${product.id}`} className="h-full bg-cream-card border border-sage-border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-forest/30 hover:shadow-md hover:-translate-y-0.5 group">
      {props.variant === 'related' ? (
        <Link to={`/produk/${encodeURIComponent(product.slug)}`} aria-label={`Buka produk terkait ${product.name}`} className="focus-ring block w-full text-left h-full flex flex-col justify-between">
          {content}
        </Link>
      ) : (
        <>
          <button type="button" aria-label={`Lihat detail ${product.name}`} onClick={(event) => props.onViewProduct(product, event.currentTarget, 'homepage_featured')} className="focus-ring block w-full cursor-pointer text-left flex-1 flex flex-col justify-between">
            {content}
          </button>
          <div className="mt-auto px-4 pb-4 flex items-center gap-2.5">
            <Link to={`/produk/${encodeURIComponent(product.slug)}`} title="Buka halaman produk" className="focus-ring touch-target inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-sage-border text-forest transition-colors hover:border-forest/30 hover:bg-sage-light" aria-label={`Buka halaman ${product.name}`}>
              <Eye size={14} aria-hidden="true" />
            </Link>
            <button id={`product-cta-${product.id}`} type="button" onClick={() => props.onInquire(product)} className="focus-ring touch-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-forest px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-forest-hover">
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
