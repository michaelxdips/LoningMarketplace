import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import PublicDetailState from '../components/shared/PublicDetailState';
import ShareButton from '../components/shared/ShareButton';
import WhatsAppInquiryDialog from '../components/shared/WhatsAppInquiryDialog';
import { ProductImage } from '../components/product/ProductImage';
import { ProductGallery, type GalleryImage } from '../components/product/ProductGallery';
import { ApiError, getProduct, getRelatedProducts, getUMKM, PUBLIC_DETAIL_STALE_TIME } from '../lib/api';
import { formatPrice } from '../lib/price';
import { usePageMetadata } from '../lib/seo';
import { buildSiteUrl } from '../lib/siteUrl';
import { trackPublicEvent } from '../lib/analytics';
import type { Product } from '../types';
import RelatedProducts from '../components/shared/RelatedProducts';

export default function ProductDetailPage() {
  const { identifier = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  // ponytail: no AbortSignal — a StrictMode/Suspense remount would otherwise cancel the
  // in-flight fetch (net::ERR_ABORTED). Upgrade path: pass signal when real cancellation is needed.
  const productQuery = useQuery({ queryKey: ['product', identifier], queryFn: () => getProduct(identifier), enabled: Boolean(identifier), staleTime: PUBLIC_DETAIL_STALE_TIME });
  const merchantQuery = useQuery({ queryKey: ['umkm', productQuery.data?.umkmId], queryFn: () => getUMKM(productQuery.data?.umkmId ?? ''), enabled: Boolean(productQuery.data?.umkmId), staleTime: PUBLIC_DETAIL_STALE_TIME });
  const detail = productQuery.data;
  const relatedQuery = useQuery({ queryKey: ['products', 'related', detail?.slug, 4], queryFn: () => getRelatedProducts(detail?.slug ?? '', { limit: 4 }), enabled: Boolean(detail?.slug), staleTime: PUBLIC_DETAIL_STALE_TIME });
  const product: Product | undefined = detail && { ...detail, umkmName: detail.umkm.name };
  const merchantData = detail?.umkmId
    ? merchantQuery.data
    : detail
      ? { id: '', slug: '', name: detail.umkm.name || 'Penjual Mandiri', owner: 'Penjual Mandiri', description: '', phone: detail.umkm.phone || '6280000000000', category: detail.category, imageUrl: null, address: 'Desa Loning', workingHours: undefined, openingTime: undefined, closingTime: undefined, latitude: null, longitude: null }
      : undefined;

  useEffect(() => { if (detail && identifier !== detail.slug) navigate(`/produk/${encodeURIComponent(detail.slug)}${location.search}${location.hash}`, { replace: true }); }, [detail, identifier, location.hash, location.search, navigate]);
  useEffect(() => { if (detail) trackPublicEvent({ eventType: 'product_view', productId: detail.id, umkmId: detail.umkmId ?? null, source: 'product_page' }); }, [detail?.id, detail?.umkmId]);
  const description = detail?.description ?? 'Informasi produk lokal Desa Loning.';
  usePageMetadata(detail ? { title: `${detail.name} — ${detail.umkm.name} | Loning Maju`, description, image: detail.imageUrl, type: 'product', jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: detail.name, description, image: detail.imageUrl, category: detail.category, offers: { '@type': 'Offer', availability: detail.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', ...(detail.price !== null ? { price: detail.price, priceCurrency: 'IDR' } : {}), url: buildSiteUrl(`/produk/${detail.slug}`) } , brand: { '@type': 'Brand', name: detail.umkm.name } } } : { title: 'Detail Produk — Loning Maju', description });
  if (productQuery.isPending) return <PublicPageShell><PublicDetailState state="loading"/></PublicPageShell>;
  if (productQuery.error) { const notFound = productQuery.error instanceof ApiError && [400, 404].includes(productQuery.error.status); return <PublicPageShell><PublicDetailState state={notFound ? 'not-found' : 'error'} onRetry={notFound ? undefined : () => void productQuery.refetch()}/></PublicPageShell>; }
  if (!detail || !product) return <PublicPageShell><PublicDetailState state="not-found"/></PublicPageShell>;
  return <PublicPageShell>
    <article className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-warm-gray">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="focus-ring rounded hover:text-forest">Beranda</Link>
          </li>
          <li aria-hidden="true" className="text-sage-border">/</li>
          <li>
            <Link to={`/?category=${encodeURIComponent(detail.category)}#featured-products`} className="focus-ring rounded hover:text-forest">
              {detail.category}
            </Link>
          </li>
          <li aria-hidden="true" className="text-sage-border">/</li>
          <li>
            <span aria-current="page" className="font-semibold text-charcoal">{detail.name}</span>
          </li>
        </ol>
      </nav>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="overflow-hidden rounded-2xl border border-sage-border bg-cream-tint lg:col-span-6">
          {detail.images && detail.images.length > 0 ? (
            <ProductGallery images={detail.images as GalleryImage[]} className={`${'aspect-[4/3]'} h-full w-full`} />
          ) : (
            <ProductImage src={detail.imageUrl} alt={detail.altText || detail.name} className="aspect-[4/3] h-full w-full object-cover"/>
          )}
        </div>
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="editorial-label">{detail.category}</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${detail.isAvailable ? 'text-forest' : 'text-warm-gray'}`}>
              <CheckCircle2 size={14}/>
              {detail.isAvailable ? 'Tersedia' : 'Belum tersedia'}
            </span>
          </div>
          <h1 className="text-balance mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight text-charcoal sm:text-4xl">{detail.name}</h1>
          {detail.umkm.slug ? (
            <Link to={`/umkm/${encodeURIComponent(detail.umkm.slug)}`} className="focus-ring mt-2 flex w-fit items-center gap-2 rounded text-sm font-bold text-forest hover:text-terracotta">Oleh {detail.umkm.name}<ArrowRight size={14}/></Link>
          ) : (
            <span className="mt-2 text-sm font-bold text-forest">Oleh {detail.umkm.name}</span>
          )}
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-warm-gray">{detail.description}</p>
          <div className="mt-5 border-y border-sage-border py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-warm-gray">Informasi harga</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-forest">{formatPrice(detail.price, 'Hubungi penjual')}{detail.unit && <span className="ml-2 text-sm font-medium text-warm-gray">/ {detail.unit}</span>}</p>
            <p className="mt-1.5 text-xs leading-5 text-warm-gray">Harga merupakan informasi awal. Konfirmasi harga akhir dan ketersediaan langsung kepada penjual.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button id="product-page-inquiry" disabled={!merchantData || !detail.isAvailable} onClick={() => setInquiryOpen(true)} className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-50"><MessageSquare size={15}/> Tanya Produk</button>
            <ShareButton title={detail.name} text={`Lihat ${detail.name} dari ${detail.umkm.name} di Loning Maju.`}/>
          </div>
          {merchantQuery.isError && <p className="mt-3 text-xs text-terracotta">Kontak usaha belum dapat dimuat. Coba muat ulang halaman.</p>}
        </div>
      </div>
    </article>
    <RelatedProducts products={relatedQuery.data ?? []} isLoading={relatedQuery.isPending} />
    {merchantData && <WhatsAppInquiryDialog isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} product={product} umkm={merchantData} source="product_detail"/>}
  </PublicPageShell>;
}
