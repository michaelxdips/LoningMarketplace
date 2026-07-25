import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import PublicDetailState from '../components/shared/PublicDetailState';
import ShareButton from '../components/shared/ShareButton';
import WhatsAppInquiryDialog from '../components/shared/WhatsAppInquiryDialog';
import { ProductImage } from '../components/product/ProductImage';
import { ApiError, getProduct, getUMKM } from '../lib/api';
import { formatPrice } from '../lib/price';
import { usePageMetadata } from '../lib/seo';
import { buildSiteUrl } from '../lib/siteUrl';
import { trackPublicEvent } from '../lib/analytics';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { identifier = '' } = useParams();
  const navigate = useNavigate();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  // ponytail: no AbortSignal — a StrictMode/Suspense remount would otherwise cancel the
  // in-flight fetch (net::ERR_ABORTED). Upgrade path: pass signal when real cancellation is needed.
  const productQuery = useQuery({ queryKey: ['product', identifier], queryFn: () => getProduct(identifier), enabled: Boolean(identifier) });
  const merchantQuery = useQuery({ queryKey: ['umkm', productQuery.data?.umkmId], queryFn: () => getUMKM(productQuery.data!.umkmId), enabled: Boolean(productQuery.data?.umkmId) });
  const detail = productQuery.data;
  const product: Product | undefined = detail && { ...detail, umkmName: detail.umkm.name };
  useEffect(() => { if (detail && identifier !== detail.slug) navigate(`/produk/${encodeURIComponent(detail.slug)}`, { replace: true }); }, [detail, identifier, navigate]);
  useEffect(() => { if (detail) trackPublicEvent({ eventType: 'product_view', productId: detail.id, umkmId: detail.umkmId, source: 'product_page' }); }, [detail?.id, detail?.umkmId]);
  const description = detail?.description ?? 'Informasi produk lokal Desa Loning.';
  usePageMetadata(detail ? { title: `${detail.name} — ${detail.umkm.name} | Loning Maju`, description, image: detail.imageUrl, type: 'product', jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: detail.name, description, image: detail.imageUrl, category: detail.category, offers: { '@type': 'Offer', availability: detail.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', ...(detail.price !== null ? { price: detail.price, priceCurrency: 'IDR' } : {}), url: buildSiteUrl(`/produk/${detail.slug}`) } , brand: { '@type': 'Brand', name: detail.umkm.name } } } : { title: 'Detail Produk — Loning Maju', description });
  if (productQuery.isPending) return <PublicPageShell><PublicDetailState state="loading"/></PublicPageShell>;
  if (productQuery.error) { const notFound = productQuery.error instanceof ApiError && [400, 404].includes(productQuery.error.status); return <PublicPageShell><PublicDetailState state={notFound ? 'not-found' : 'error'} onRetry={notFound ? undefined : () => void productQuery.refetch()}/></PublicPageShell>; }
  if (!detail || !product) return <PublicPageShell><PublicDetailState state="not-found"/></PublicPageShell>;
  return <PublicPageShell>
    <article className="mx-auto max-w-7xl px-5 py-12 sm:py-20"><nav aria-label="Breadcrumb" className="mb-8 text-xs text-warm-gray"><Link to="/" className="focus-ring rounded hover:text-forest">Beranda</Link><span aria-hidden="true"> / </span><span>{detail.category}</span></nav>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16"><div className="overflow-hidden rounded-2xl border border-sage-border bg-cream-tint"><ProductImage src={detail.imageUrl} alt={detail.altText || detail.name} className="aspect-[4/3] h-full w-full object-cover"/></div><div className="flex flex-col justify-center"><div className="flex flex-wrap items-center justify-between gap-4"><p className="editorial-label">{detail.category}</p><span className={`inline-flex items-center gap-1.5 text-xs font-bold ${detail.isAvailable ? 'text-forest' : 'text-warm-gray'}`}><CheckCircle2 size={14}/>{detail.isAvailable ? 'Tersedia' : 'Belum tersedia'}</span></div><h1 className="text-balance mt-5 text-4xl font-extrabold tracking-[-0.035em] text-charcoal sm:text-5xl">{detail.name}</h1><Link to={`/umkm/${encodeURIComponent(detail.umkm.slug)}`} className="focus-ring mt-4 flex w-fit items-center gap-2 rounded text-sm font-bold text-forest hover:text-terracotta">Oleh {detail.umkm.name}<ArrowRight size={14}/></Link><p className="mt-8 whitespace-pre-line text-sm leading-7 text-warm-gray">{detail.description}</p><div className="mt-8 border-y border-sage-border py-5"><p className="text-[10px] font-bold uppercase tracking-widest text-warm-gray">Informasi harga</p><p className="mt-1 text-2xl font-extrabold text-forest">{formatPrice(detail.price, 'Hubungi pelaku usaha')}{detail.unit && <span className="ml-2 text-sm font-medium text-warm-gray">/ {detail.unit}</span>}</p><p className="mt-2 text-xs leading-5 text-warm-gray">Harga merupakan informasi awal. Konfirmasi harga akhir dan ketersediaan langsung kepada pelaku usaha.</p></div><div className="mt-7 flex flex-wrap gap-3"><button id="product-page-inquiry" disabled={!merchantQuery.data || !detail.isAvailable} onClick={() => setInquiryOpen(true)} className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-50"><MessageSquare size={15}/> Tanya Produk</button><ShareButton title={detail.name} text={`Lihat ${detail.name} dari ${detail.umkm.name} di Loning Maju.`}/></div>{merchantQuery.isError && <p className="mt-3 text-xs text-terracotta">Kontak usaha belum dapat dimuat. Coba muat ulang halaman.</p>}</div></div>
    </article>
    {merchantQuery.data && <WhatsAppInquiryDialog isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} product={product} umkm={merchantQuery.data} source="product_detail"/>}
  </PublicPageShell>;
}
