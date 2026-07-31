import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, MapPin, MessageSquare, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import PublicDetailState from '../components/shared/PublicDetailState';
import ShareButton from '../components/shared/ShareButton';
import WhatsAppInquiryDialog from '../components/shared/WhatsAppInquiryDialog';
import { ProductImage } from '../components/product/ProductImage';
import { ApiError, getProducts, getUMKM } from '../lib/api';
import { formatPrice } from '../lib/price';
import { usePageMetadata } from '../lib/seo';
import { buildSiteUrl } from '../lib/siteUrl';
import { trackPublicEvent } from '../lib/analytics';

export default function UMKMDetailPage() {
  const { identifier = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  // ponytail: no AbortSignal — a StrictMode/Suspense remount would otherwise cancel the
  // in-flight fetch (net::ERR_ABORTED). Upgrade path: pass signal when real cancellation is needed.
  const umkmQuery = useQuery({ queryKey: ['umkm', identifier], queryFn: () => getUMKM(identifier), enabled: Boolean(identifier) });
  const umkm = umkmQuery.data;
  const productsQuery = useQuery({ queryKey: ['products', { umkmId: umkm?.id }], queryFn: () => getProducts({ umkmId: umkm!.id }), enabled: Boolean(umkm?.id) });
  useEffect(() => { if (umkm && identifier !== umkm.slug) navigate(`/umkm/${encodeURIComponent(umkm.slug)}${location.search}${location.hash}`, { replace: true }); }, [identifier, location.hash, location.search, navigate, umkm]);
  useEffect(() => { if (umkm) trackPublicEvent({ eventType: 'umkm_view', umkmId: umkm.id, source: 'umkm_page' }); }, [umkm?.id]);
  const description = umkm?.description ?? 'Profil pelaku UMKM Desa Loning.';
  usePageMetadata(umkm ? { title: `${umkm.name} — Profil UMKM | Loning Maju`, description, image: umkm.imageUrl, jsonLd: { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: umkm.name, description, image: umkm.imageUrl, telephone: umkm.phone, url: buildSiteUrl(`/umkm/${umkm.slug}`), address: { '@type': 'PostalAddress', streetAddress: umkm.address, addressLocality: 'Loning', addressRegion: 'Jawa Tengah', addressCountry: 'ID' }, openingHours: umkm.workingHours } } : { title: 'Profil UMKM — Loning Maju', description });
  if (umkmQuery.isPending) return <PublicPageShell><PublicDetailState state="loading"/></PublicPageShell>;
  if (umkmQuery.error) { const notFound = umkmQuery.error instanceof ApiError && [400, 404].includes(umkmQuery.error.status); return <PublicPageShell><PublicDetailState state={notFound ? 'not-found' : 'error'} onRetry={notFound ? undefined : () => void umkmQuery.refetch()}/></PublicPageShell>; }
  if (!umkm) return <PublicPageShell><PublicDetailState state="not-found"/></PublicPageShell>;
  return <PublicPageShell>
    <article><header className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:py-20 lg:grid-cols-12 lg:items-center"><div className="overflow-hidden rounded-2xl border border-sage-border bg-cream-tint lg:col-span-6"><img src={umkm.imageUrl} alt={umkm.altText || umkm.name} className="aspect-[4/3] h-full w-full object-cover"/></div><div className="lg:col-span-5 lg:col-start-8"><p className="editorial-label">{umkm.category} · Profil Usaha</p><h1 className="text-balance mt-4 text-4xl font-extrabold tracking-[-0.04em] text-charcoal sm:text-6xl">{umkm.name}</h1><p className="mt-3 text-sm font-bold text-forest">Dikelola oleh {umkm.owner}</p><p className="mt-7 whitespace-pre-line text-sm leading-7 text-warm-gray">{umkm.description}</p><dl className="mt-8 grid gap-4 border-y border-sage-border py-6 text-sm"><div className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-terracotta" size={17}/><div><dt className="text-[10px] font-bold uppercase tracking-widest text-warm-gray">Alamat</dt><dd className="mt-1 leading-6 text-charcoal">{umkm.address}</dd></div></div>{umkm.workingHours && <div className="flex gap-3"><Clock3 className="mt-0.5 shrink-0 text-terracotta" size={17}/><div><dt className="text-[10px] font-bold uppercase tracking-widest text-warm-gray">Jam operasional</dt><dd className="mt-1 text-charcoal">{umkm.workingHours}</dd></div></div>}</dl><div className="mt-7 flex flex-wrap gap-3"><button id="umkm-page-inquiry" disabled={umkm.isContactValid === false} onClick={() => setInquiryOpen(true)} className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"><MessageSquare size={15}/> Hubungi via WhatsApp</button><ShareButton title={umkm.name} text={`Lihat profil ${umkm.name} di Loning Maju.`}/></div>{umkm.isContactVerificationFresh && <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-forest"><ShieldCheck size={14}/> Kontak telah diverifikasi pengelola.</p>}</div></header>
      <section aria-labelledby="catalog-title" className="border-t border-sage-border bg-cream-card"><div className="mx-auto max-w-7xl px-5 py-20"><div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="editorial-label">Etalase usaha</p><h2 id="catalog-title" className="mt-2 break-words text-3xl font-extrabold tracking-tight text-charcoal">Produk yang dipublikasikan</h2></div><p className="text-xs text-warm-gray">{productsQuery.data?.length ?? 0} item katalog</p></div>{productsQuery.isPending ? <p className="text-sm text-warm-gray">Memuat katalog…</p> : productsQuery.isError ? <p className="text-sm text-terracotta">Katalog belum dapat dimuat.</p> : productsQuery.data?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{productsQuery.data.map((product) => <Link key={product.id} to={`/produk/${encodeURIComponent(product.slug)}`} className="focus-ring group overflow-hidden rounded-xl border border-sage-border bg-cream-bg transition-card hover:-translate-y-1 hover:shadow-md"><ProductImage src={product.imageUrl} alt={product.altText || product.name} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"/><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-terracotta">{product.category}</p><h3 className="mt-2 text-lg font-bold text-charcoal">{product.name}</h3><p className="mt-4 text-sm font-bold text-forest">{formatPrice(product.price, 'Hubungi pelaku usaha')}</p></div></Link>)}</div> : <div className="rounded-xl border border-dashed border-sage-border p-10 text-center text-sm text-warm-gray">Belum ada produk yang dipublikasikan. Hubungi pelaku usaha untuk informasi terbaru.</div>}</div></section>
    </article><WhatsAppInquiryDialog isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} umkm={umkm} source="umkm_detail"/>
  </PublicPageShell>;
}
