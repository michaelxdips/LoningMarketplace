import { Product } from '../../types';
import ProductCard from '../product/ProductCard';

export default function RelatedProducts({ products, isLoading = false }: { products: Product[]; isLoading?: boolean }) {
  if (!isLoading && !products.length) return null;
  return <section aria-labelledby="related-products-title" aria-busy={isLoading} className="mt-16 border-t border-sage-border pt-12">
    <h2 id="related-products-title" className="text-2xl font-extrabold tracking-tight text-charcoal">Produk terkait</h2>
    {isLoading && <p className="mt-4 text-sm text-warm-gray">Memuat produk terkait…</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((item) => <ProductCard key={item.id} product={item} variant="related" />)}
    </div>
  </section>;
}
