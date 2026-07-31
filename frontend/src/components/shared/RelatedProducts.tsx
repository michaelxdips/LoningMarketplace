import { Product } from '../../types';
import ProductCard from '../product/ProductCard';

export default function RelatedProducts({ products, isLoading = false }: { products: Product[]; isLoading?: boolean }) {
  if (!isLoading && !products.length) return null;
  return (
    <section aria-labelledby="related-products-title" aria-busy={isLoading} className="border-t border-sage-border bg-cream-card/30 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:mb-8 sm:flex-row sm:items-end">
          <div>
            <p className="editorial-label text-terracotta">Rekomendasi</p>
            <h2 id="related-products-title" className="mt-1 text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
              Produk terkait
            </h2>
          </div>
        </div>
        {isLoading && <p className="text-sm text-warm-gray">Memuat produk terkait…</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((item) => <ProductCard key={item.id} product={item} variant="related" />)}
        </div>
      </div>
    </section>
  );
}

