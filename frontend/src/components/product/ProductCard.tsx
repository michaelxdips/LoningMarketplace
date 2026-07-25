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

export type ProductViewSource = 'homepage_featured';
type ProductCardProps = {
  product: Product;
  onInquire: (product: Product) => void;
  onViewMerchant: (merchantId: string) => void;
  onViewProduct: (product: Product, trigger: HTMLElement, source: ProductViewSource) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onInquire, onViewMerchant, onViewProduct }) => {
  const openDetail = (event: React.MouseEvent<HTMLButtonElement>) => onViewProduct(product, event.currentTarget, 'homepage_featured');
  return (
    <article id={`product-card-${product.id}`} className="self-start bg-cream-card border border-sage-border rounded-xl overflow-hidden flex flex-col transition-card hover:border-forest/30 hover:shadow-md group">
      <button type="button" aria-label={`Lihat detail ${product.name}`} onClick={openDetail} className="focus-ring block w-full cursor-pointer text-left">
        <div className="h-44 w-full overflow-hidden bg-cream-tint relative">
          <ProductImage src={product.imageUrl} alt={product.altText || product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103" />
          {product.unit && <span className="absolute top-3 right-3 bg-charcoal/85 text-white text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase">/ {product.unit}</span>}
        </div>
        <div className="p-4 space-y-1">
          <span className="text-[9px] font-bold text-terracotta uppercase tracking-widest block">{product.category}</span>
          <h4 className="text-sm font-semibold text-charcoal line-clamp-1 group-hover:text-forest transition-colors">{product.name}</h4>
          <p className="text-[11px] text-warm-gray/80 line-clamp-2 leading-relaxed pt-1.5">{product.description}</p>
          <div className="pt-3 flex items-center gap-2.5">
            <span className="text-[9px] font-semibold text-warm-gray uppercase tracking-widest">Harga</span>
            <span className="text-xs font-bold text-forest">{formatPrice(product.price, 'Hubungi Penjual')}</span>
          </div>
        </div>
      </button>
      <div className="mt-auto px-4 pb-4 flex items-center gap-2.5">
        <Link to={`/produk/${encodeURIComponent(product.slug)}`} className="focus-ring touch-target inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-sage-border text-forest transition-colors hover:border-forest/30 hover:bg-cream-tint" aria-label={`Buka halaman ${product.name}`}>
          <Eye size={14} aria-hidden="true" />
        </Link>
        <button id={`product-cta-${product.id}`} type="button" onClick={() => onInquire(product)} className="focus-ring touch-target flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-forest px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-forest-hover">
          <MessageSquare size={12} aria-hidden="true" />
          <span>Tanya Produk</span>
          <ArrowRight size={12} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
