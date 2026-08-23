import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { getCategoryShortLabel, type Product } from '@loning/shared';
import { ApiError, getProduct, getRelatedProducts, getUMKM, PUBLIC_DETAIL_STALE_TIME } from '@loning/shared/lib/api';
import { formatPrice } from '@loning/shared/lib/price';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { buildSiteUrl } from '@loning/shared/lib/siteUrl';
import { trackPublicEvent } from '@loning/shared/lib/analytics';
import { Badge } from '@v2-shared/ui/Badge';
import { Button } from '@v2-shared/ui/Button';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { EmptyState, ErrorState } from '@v2-shared/ui/EmptyState';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import WhatsAppInquiryDialog from '@v2-shared/components/WhatsAppInquiryDialog';
import ShareButton from '@v2-shared/components/ShareButton';
import ProductCard from '../components/ProductCard';

/**
 * Detail produk V2 mobile — galeri, info, sticky CTA WhatsApp di bawah.
 */
export default function ProductDetailPage() {
  const { identifier = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productQuery = useQuery({ queryKey: ['product', identifier], queryFn: () => getProduct(identifier), enabled: Boolean(identifier), staleTime: PUBLIC_DETAIL_STALE_TIME });
  const merchantQuery = useQuery({ queryKey: ['umkm', productQuery.data?.umkmId], queryFn: () => getUMKM(productQuery.data?.umkmId ?? ''), enabled: Boolean(productQuery.data?.umkmId), staleTime: PUBLIC_DETAIL_STALE_TIME });
  const detail = productQuery.data;
  const relatedQuery = useQuery({ queryKey: ['products', 'related', detail?.slug, 4], queryFn: () => getRelatedProducts(detail?.slug ?? '', { limit: 4 }), enabled: Boolean(detail?.slug), staleTime: PUBLIC_DETAIL_STALE_TIME });

  const product: Product | undefined = detail && { ...detail, umkmName: detail.umkm.name };
  const merchantData = detail?.umkmId
    ? merchantQuery.data
    : detail
      ? { id: '', slug: '', name: detail.umkm.name || 'Penjual Mandiri', owner: 'Penjual Mandiri', description: '', phone: detail.umkm.phone || '6280000000000', category: detail.category, imageUrl: '', address: 'Desa Loning', latitude: null, longitude: null }
      : undefined;

  useEffect(() => {
    if (detail && identifier !== detail.slug) navigate(`/m/produk/${encodeURIComponent(detail.slug)}${location.search}${location.hash}`, { replace: true });
  }, [detail, identifier, location.hash, location.search, navigate]);

  useEffect(() => {
    if (detail) trackPublicEvent({ eventType: 'product_view', productId: detail.id, umkmId: detail.umkmId ?? undefined, source: 'product_page' });
  }, [detail?.id, detail?.umkmId]);

  const description = detail?.description ?? 'Informasi produk lokal Desa Loning.';
  usePageMetadata(detail ? { title: `${detail.name} — ${detail.umkm.name} | Loning Maju`, description, image: detail.imageUrl, type: 'product', jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: detail.name, description, image: detail.imageUrl, category: detail.category, offers: { '@type': 'Offer', availability: detail.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', ...(detail.price !== null ? { price: detail.price, priceCurrency: 'IDR' } : {}), url: buildSiteUrl(`/produk/${detail.slug}`) }, brand: { '@type': 'Brand', name: detail.umkm.name } } } : { title: 'Detail Produk — Loning Maju', description });

  if (productQuery.isPending) return <DetailSkeleton />;
  if (productQuery.error) {
    const notFound = productQuery.error instanceof ApiError && [400, 404].includes(productQuery.error.status);
    return <DetailState kind={notFound ? 'not-found' : 'error'} onRetry={notFound ? undefined : () => void productQuery.refetch()} />;
  }
  if (!detail || !product) return <DetailState kind="not-found" />;

  const images = detail.images?.length ? detail.images : null;
  const currentImage = images?.[activeImage];

  return (
    <>
      {/* Media */}
      <MediaImage src={currentImage?.url ?? detail.imageUrl} alt={currentImage?.altText ?? detail.altText ?? detail.name} ratio="aspect-[4/3]" />
      {images && images.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveImage(index)}
              aria-label={`Lihat gambar ${index + 1} dari ${images.length}`}
              aria-current={index === activeImage}
              className={`focus-ring-v2 w-16 shrink-0 overflow-hidden border ${index === activeImage ? 'border-brand' : 'border-line'}`}
            >
              <MediaImage src={image.thumbUrl || image.url} alt="" ratio="aspect-[4/3]" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="px-4 pb-10 pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/m" className="focus-ring-v2 rounded hover:text-ink">Beranda</Link></li>
            <li aria-hidden="true"><ChevronRight size={14} strokeWidth={1.5} /></li>
            <li><Link to={`/m/produk?category=${encodeURIComponent(detail.category)}`} className="focus-ring-v2 rounded hover:text-ink">{getCategoryShortLabel(detail.category)}</Link></li>
          </ol>
        </nav>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Eyebrow>{getCategoryShortLabel(detail.category)}</Eyebrow>
          <Badge variant={detail.isAvailable ? 'success' : 'neutral'} icon={detail.isAvailable ? <CheckCircle2 size={13} strokeWidth={1.5} /> : undefined}>
            {detail.isAvailable ? 'Tersedia' : 'Belum tersedia'}
          </Badge>
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance">{detail.name}</h1>

        {detail.umkm.slug ? (
          <Link to={`/m/umkm/${encodeURIComponent(detail.umkm.slug)}`} className="focus-ring-v2 mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
            Oleh {detail.umkm.name}
            <ChevronRight size={15} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        ) : (
          <p className="mt-2 text-sm font-medium text-accent-ink">Oleh {detail.umkm.name}</p>
        )}

        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink-muted">{detail.description}</p>

        <div className="mt-5 border-y border-line py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Informasi harga</p>
          <p className="numeric mt-1 font-display text-3xl font-semibold text-brand">
            {formatPrice(detail.price, 'Hubungi penjual')}
            {detail.unit ? <span className="ml-2 font-body text-base font-normal text-ink-muted">/ {detail.unit}</span> : null}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink-muted">Harga merupakan informasi awal. Konfirmasi harga akhir dan ketersediaan langsung kepada penjual.</p>
        </div>

        <div className="mt-5 flex gap-3">
          <ShareButton title={detail.name} text={`Lihat ${detail.name} dari ${detail.umkm.name} di Loning Maju.`} />
        </div>

        {merchantQuery.isError ? <p className="mt-3 text-sm text-danger-ink">Kontak usaha belum dapat dimuat. Coba muat ulang halaman.</p> : null}
      </div>

      {/* Produk terkait */}
      <section aria-labelledby="related-title" className="border-t border-line px-4 py-10">
        <Eyebrow>Rekomendasi</Eyebrow>
        <h2 id="related-title" className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">Produk terkait</h2>
        {relatedQuery.isPending ? (
          <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i}><Skeleton className="aspect-[4/3] w-full" /><Skeleton className="mt-3 h-5 w-3/4" /></div>
            ))}
          </div>
        ) : (relatedQuery.data ?? []).length === 0 ? (
          <EmptyState className="mt-5" title="Belum ada produk terkait" description="Produk lain dari kategori yang sama akan tampil di sini bila tersedia." action={<ButtonLink to="/m/produk" variant="outline">Jelajahi katalog</ButtonLink>} />
        ) : (
          <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {(relatedQuery.data ?? []).map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        )}
      </section>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <Button
          size="lg"
          className="w-full"
          disabled={!merchantData || !detail.isAvailable}
          leadingIcon={<MessageSquare size={17} strokeWidth={1.5} />}
          onClick={() => setInquiryOpen(true)}
        >
          Tanya Produk via WhatsApp
        </Button>
      </div>

      {merchantData && product ? (
        <WhatsAppInquiryDialog isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} product={product} umkm={merchantData} source="product_detail" />
      ) : null}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="px-4 pt-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <Skeleton className="mt-5 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
    </div>
  );
}

function DetailState({ kind, onRetry }: { kind: 'not-found' | 'error'; onRetry?: () => void }) {
  return kind === 'not-found' ? (
    <div className="px-4 py-24">
      <EmptyState title="Produk tidak ditemukan" description="Produk yang Anda cari mungkin sudah tidak tersedia atau tautannya berubah." action={<ButtonLink to="/m/produk" size="lg">Lihat katalog</ButtonLink>} />
    </div>
  ) : (
    <div className="px-4 py-24">
      <ErrorState action={onRetry ? <Button variant="outline" onClick={onRetry}>Coba lagi</Button> : undefined} />
    </div>
  );
}
