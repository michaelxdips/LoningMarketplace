import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { getCategoryShortLabel, type Product } from '@loning/shared';
import {
  ApiError,
  getProduct,
  getRelatedProducts,
  getUMKM,
  PUBLIC_DETAIL_STALE_TIME,
} from '@loning/shared/lib/api';
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
 * Detail produk V2 — pasangan fitur dari /produk/:identifier UI lama.
 *
 * Yang dipertahankan penuh: galeri gambar, breadcrumb, ketersediaan, harga,
 * tautan ke profil UMKM, dialog WhatsApp, produk terkait, dan pelacakan
 * product_view. Yang berubah hanya styling (editorial, tanpa kartu ber-shadow).
 */
export default function ProductDetailPage() {
  const { identifier = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productQuery = useQuery({
    queryKey: ['product', identifier],
    queryFn: () => getProduct(identifier),
    enabled: Boolean(identifier),
    staleTime: PUBLIC_DETAIL_STALE_TIME,
  });
  const merchantQuery = useQuery({
    queryKey: ['umkm', productQuery.data?.umkmId],
    queryFn: () => getUMKM(productQuery.data?.umkmId ?? ''),
    enabled: Boolean(productQuery.data?.umkmId),
    staleTime: PUBLIC_DETAIL_STALE_TIME,
  });
  const detail = productQuery.data;
  const relatedQuery = useQuery({
    queryKey: ['products', 'related', detail?.slug, 4],
    queryFn: () => getRelatedProducts(detail?.slug ?? '', { limit: 4 }),
    enabled: Boolean(detail?.slug),
    staleTime: PUBLIC_DETAIL_STALE_TIME,
  });

  const product: Product | undefined = detail && { ...detail, umkmName: detail.umkm.name };
  const merchantData = detail?.umkmId
    ? merchantQuery.data
    : detail
      ? {
          id: '',
          slug: '',
          name: detail.umkm.name || 'Penjual Mandiri',
          owner: 'Penjual Mandiri',
          description: '',
          phone: detail.umkm.phone || '6280000000000',
          category: detail.category,
          imageUrl: '',
          address: 'Desa Loning',
          latitude: null,
          longitude: null,
        }
      : undefined;

  // Canonical slug redirect (identifier -> slug), sama seperti UI lama.
  useEffect(() => {
    if (detail && identifier !== detail.slug) {
      navigate(`/v2/produk/${encodeURIComponent(detail.slug)}${location.search}${location.hash}`, {
        replace: true,
      });
    }
  }, [detail, identifier, location.hash, location.search, navigate]);

  useEffect(() => {
    if (detail) {
      trackPublicEvent({ eventType: 'product_view', productId: detail.id, umkmId: detail.umkmId ?? undefined, source: 'product_page' });
    }
  }, [detail?.id, detail?.umkmId]);

  const description = detail?.description ?? 'Informasi produk lokal Desa Loning.';
  usePageMetadata(
    detail
      ? {
          title: `${detail.name} — ${detail.umkm.name} | Loning Maju`,
          description,
          image: detail.imageUrl,
          type: 'product',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: detail.name,
            description,
            image: detail.imageUrl,
            category: detail.category,
            offers: {
              '@type': 'Offer',
              availability: detail.isAvailable
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              ...(detail.price !== null ? { price: detail.price, priceCurrency: 'IDR' } : {}),
              url: buildSiteUrl(`/produk/${detail.slug}`),
            },
            brand: { '@type': 'Brand', name: detail.umkm.name },
          },
        }
      : { title: 'Detail Produk — Loning Maju', description },
  );

  if (productQuery.isPending) return <DetailSkeleton />;
  if (productQuery.error) {
    const notFound = productQuery.error instanceof ApiError && [400, 404].includes(productQuery.error.status);
    return (
      <DetailState
        kind={notFound ? 'not-found' : 'error'}
        onRetry={notFound ? undefined : () => void productQuery.refetch()}
      />
    );
  }
  if (!detail || !product) return <DetailState kind="not-found" />;

  const images = detail.images?.length ? detail.images : null;
  const currentImage = images?.[activeImage];

  return (
    <>
      <article className="mx-auto max-w-[1400px] px-6 pb-2 pt-10 lg:px-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/v2" className="focus-ring-v2 rounded hover:text-ink">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} strokeWidth={1.5} />
            </li>
            <li>
              <Link
                to={`/v2/produk?category=${encodeURIComponent(detail.category)}`}
                className="focus-ring-v2 rounded hover:text-ink"
              >
                {getCategoryShortLabel(detail.category)}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} strokeWidth={1.5} />
            </li>
            <li>
              <span aria-current="page" className="font-medium text-ink">
                {detail.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Media */}
          <div className="lg:col-span-6">
            <MediaImage
              src={currentImage?.url ?? detail.imageUrl}
              alt={currentImage?.altText ?? detail.altText ?? detail.name}
              ratio="aspect-[4/3]"
            />
            {images && images.length > 1 ? (
              <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Lihat gambar ${index + 1} dari ${images.length}`}
                    aria-current={index === activeImage}
                    className={`focus-ring-v2 w-20 shrink-0 overflow-hidden border transition-colors ${
                      index === activeImage ? 'border-brand' : 'border-line hover:border-control-border'
                    }`}
                  >
                    <MediaImage
                      src={image.thumbUrl || image.url}
                      alt=""
                      ratio="aspect-[4/3]"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div className="flex flex-col lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Eyebrow>{getCategoryShortLabel(detail.category)}</Eyebrow>
              <Badge variant={detail.isAvailable ? 'success' : 'neutral'} icon={detail.isAvailable ? <CheckCircle2 size={13} strokeWidth={1.5} /> : undefined}>
                {detail.isAvailable ? 'Tersedia' : 'Belum tersedia'}
              </Badge>
            </div>

            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance sm:text-4xl">
              {detail.name}
            </h1>

            {detail.umkm.slug ? (
              <Link
                to={`/v2/umkm/${encodeURIComponent(detail.umkm.slug)}`}
                className="focus-ring-v2 mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
              >
                Oleh {detail.umkm.name}
                <ChevronRight size={15} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            ) : (
              <p className="mt-3 text-sm font-medium text-accent-ink">Oleh {detail.umkm.name}</p>
            )}

            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-ink-muted">
              {detail.description}
            </p>

            <div className="mt-6 border-y border-line py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                Informasi harga
              </p>
              <p className="numeric mt-2 font-display text-3xl font-semibold text-brand">
                {formatPrice(detail.price, 'Hubungi penjual')}
                {detail.unit ? (
                  <span className="ml-2 font-body text-base font-normal text-ink-muted">/ {detail.unit}</span>
                ) : null}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Harga merupakan informasi awal. Konfirmasi harga akhir dan ketersediaan langsung
                kepada penjual.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                disabled={!merchantData || !detail.isAvailable}
                leadingIcon={<MessageSquare size={17} strokeWidth={1.5} />}
                onClick={() => setInquiryOpen(true)}
              >
                Tanya Produk
              </Button>
              <ShareButton title={detail.name} text={`Lihat ${detail.name} dari ${detail.umkm.name} di Loning Maju.`} />
            </div>

            {merchantQuery.isError ? (
              <p className="mt-4 text-sm text-danger-ink">
                Kontak usaha belum dapat dimuat. Coba muat ulang halaman.
              </p>
            ) : null}
          </div>
        </div>
      </article>

      {/* Produk terkait */}
      <section
        aria-labelledby="related-title"
        aria-busy={relatedQuery.isPending}
        className="mt-20 border-t border-line"
      >
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
          <Eyebrow>Rekomendasi</Eyebrow>
          <h2 id="related-title" className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Produk terkait
          </h2>

          {relatedQuery.isError ? (
            <ErrorState className="mt-8" />
          ) : relatedQuery.isPending ? (
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="mt-4 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (relatedQuery.data ?? []).length === 0 ? (
            <EmptyState
              className="mt-8"
              title="Belum ada produk terkait"
              description="Produk lain dari kategori yang sama akan tampil di sini bila tersedia."
              action={<ButtonLink to="/v2/produk" variant="outline">Jelajahi katalog</ButtonLink>}
            />
          ) : (
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {(relatedQuery.data ?? []).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {merchantData && product ? (
        <WhatsAppInquiryDialog
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          product={product}
          umkm={merchantData}
          source="product_detail"
        />
      ) : null}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-2 pt-10 lg:px-10">
      <Skeleton className="h-4 w-64" />
      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <Skeleton className="aspect-[4/3] w-full" />
        </div>
        <div className="lg:col-span-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-5 h-9 w-3/4" />
          <Skeleton className="mt-4 h-4 w-1/2" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-8 h-12 w-48" />
        </div>
      </div>
    </div>
  );
}

function DetailState({
  kind,
  onRetry,
}: {
  kind: 'not-found' | 'error';
  onRetry?: () => void;
}) {
  return kind === 'not-found' ? (
    <div className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10">
      <EmptyState
        title="Produk tidak ditemukan"
        description="Produk yang Anda cari mungkin sudah tidak tersedia atau tautannya berubah."
        action={<ButtonLink to="/v2/produk" size="lg">Lihat katalog</ButtonLink>}
      />
    </div>
  ) : (
    <div className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10">
      <ErrorState
        action={
          onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              Coba lagi
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
