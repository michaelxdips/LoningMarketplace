import { Product } from '../../types';
import ProductCard from '../product/ProductCard';

export default function RelatedProducts({ products, isLoading = false }: { products: Product[]; isLoading?: boolean }) {
  if (!isLoading && !products.length) return null;
  return (
    <section aria-labelledby="related-products-title" aria-busy={isLoading} className="border-t border-sage-border bg-cream-card/30 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-5">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="editorial-label text-terracotta">Rekomendasi</p>
            <h2 id="related-products-title" className="mt-1 font-serif text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
              Produk terkait
            </h2>
          </div>
        </div>
        {isLoading && <p className="text-sm text-warm-gray">Memuat produk terkait…</p>}
        <div
          className={`grid gap-5 ${
            products.length === 1
              ? 'max-w-xs'
              : products.length === 2
                ? 'max-w-xl sm:grid-cols-2'
                : products.length === 3
                  ? 'sm:grid-cols-2 lg:grid-cols-3'
                  : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {products.map((item) => <ProductCard key={item.id} product={item} variant="related" />)}
        </div>
      </div>
    </section>
  );
}

