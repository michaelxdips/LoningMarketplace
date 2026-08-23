import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock3, ExternalLink, MapPin, MessageSquare, Navigation } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { getCategoryShortLabel } from '@loning/shared';
import { ApiError, getProducts, getUMKM, PUBLIC_DETAIL_STALE_TIME } from '@loning/shared/lib/api';
import { buildLocalBusinessJsonLd, usePageMetadata } from '@loning/shared/lib/seo';
import { buildGoogleMapsDirectionsUrl, buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl, normalizeCoordinates } from '@loning/shared/lib/location';
import { formatOperatingHours, formatPublicUpdatedAt, getBusinessOpenStatus } from '@loning/shared/lib/umkmStatus';
import { trackPublicEvent } from '@loning/shared/lib/analytics';
import { Button } from '@v2-shared/ui/Button';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { EmptyState, ErrorState } from '@v2-shared/ui/EmptyState';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import { buttonClass } from '@v2-shared/ui/buttonStyles';
import WhatsAppInquiryDialog from '@v2-shared/components/WhatsAppInquiryDialog';
import ShareButton from '@v2-shared/components/ShareButton';
import ProductCard from '../components/ProductCard';

/**
 * Detail UMKM V2 mobile — profil, jam operasional, peta, etalase, sticky CTA.
 */
export default function UMKMDetailPage() {
  const { identifier = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const umkmQuery = useQuery({ queryKey: ['umkm', identifier], queryFn: () => getUMKM(identifier), enabled: Boolean(identifier), staleTime: PUBLIC_DETAIL_STALE_TIME });
  const umkm = umkmQuery.data;
  const openStatus = getBusinessOpenStatus(umkm?.workingHours, new Date(), umkm?.openingTime, umkm?.closingTime);
  const hoursLabel = formatOperatingHours(umkm?.workingHours, umkm?.openingTime, umkm?.closingTime);
  const updatedLabel = formatPublicUpdatedAt(umkm?.catalogUpdatedAt ?? umkm?.updatedAt);

  const productsQuery = useQuery({ queryKey: ['products', { umkmId: umkm?.id }], queryFn: () => getProducts({ umkmId: umkm!.id }), enabled: Boolean(umkm?.id), staleTime: PUBLIC_DETAIL_STALE_TIME });

  useEffect(() => {
    if (umkm && identifier !== umkm.slug) navigate(`/m/umkm/${encodeURIComponent(umkm.slug)}${location.search}${location.hash}`, { replace: true });
  }, [identifier, location.hash, location.search, navigate, umkm]);

  useEffect(() => {
    if (umkm) trackPublicEvent({ eventType: 'umkm_view', umkmId: umkm.id, source: 'umkm_page' });
  }, [umkm?.id]);

  const description = umkm?.description ?? 'Profil pelaku UMKM Desa Loning.';
  usePageMetadata(umkm ? { title: `${umkm.name} — Profil UMKM | Loning Maju`, description, image: umkm.imageUrl, jsonLd: buildLocalBusinessJsonLd(umkm, description) } : { title: 'Profil UMKM — Loning Maju', description });

  if (umkmQuery.isPending) return <DetailSkeleton />;
  if (umkmQuery.error) {
    const notFound = umkmQuery.error instanceof ApiError && [400, 404].includes(umkmQuery.error.status);
    return <DetailState kind={notFound ? 'not-found' : 'error'} onRetry={notFound ? undefined : () => void umkmQuery.refetch()} />;
  }
  if (!umkm) return <DetailState kind="not-found" />;

  const coordinates = typeof umkm.latitude === 'number' && typeof umkm.longitude === 'number' ? normalizeCoordinates(umkm.latitude, umkm.longitude) : undefined;
  const products = productsQuery.data ?? [];

  return (
    <>
      <MediaImage src={umkm.imageUrl} alt={umkm.altText ?? umkm.name} ratio="aspect-[4/3]" />

      <div className="px-4 pb-10 pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/m" className="focus-ring-v2 rounded hover:text-ink">Beranda</Link></li>
            <li aria-hidden="true"><ChevronRight size={14} strokeWidth={1.5} /></li>
            <li><Link to="/m/umkm" className="focus-ring-v2 rounded hover:text-ink">Profil UMKM</Link></li>
          </ol>
        </nav>

        <div className="mt-4">
          <Eyebrow>{`${getCategoryShortLabel(umkm.category)} · Profil Usaha`}</Eyebrow>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance">{umkm.name}</h1>
          <p className="mt-2 text-sm font-medium text-accent-ink">Dikelola oleh {umkm.owner}</p>
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink-muted">{umkm.description}</p>
        </div>

        <dl className="mt-5 grid gap-4 border-y border-line py-4 text-sm">
          <div className="flex gap-3">
            <MapPin size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Alamat</dt>
              <dd className="mt-1 leading-6 text-ink">{umkm.address}</dd>
            </div>
          </div>
          {hoursLabel ? (
            <div className="flex gap-3">
              <Clock3 size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Jam operasional</dt>
                <dd className="mt-1 text-ink">{hoursLabel}</dd>
              </div>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 border border-line bg-sunken p-4">
          <p className={openStatus.kind === 'open' ? 'text-sm font-semibold text-success-ink' : 'text-sm font-semibold text-ink'}>{openStatus.label}</p>
          <p className="mt-1 text-sm text-ink-muted">{openStatus.detail}</p>
          {updatedLabel ? <p className="mt-1 text-sm text-ink-muted">{updatedLabel}</p> : null}
        </div>

        <div className="mt-5 flex gap-3">
          <ShareButton title={umkm.name} text={`Lihat profil usaha ${umkm.name} di Loning Maju.`} />
        </div>
      </div>

      {/* Peta */}
      {coordinates ? (
        <section aria-labelledby="lokasi-heading" className="border-t border-line px-4 py-8">
          <Eyebrow>Lokasi</Eyebrow>
          <h2 id="lokasi-heading" className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">Temukan di peta</h2>
          <div className="mt-4 overflow-hidden border border-line">
            <iframe src={buildGoogleMapsEmbedUrl(coordinates)} loading="lazy" title={`Peta lokasi ${umkm.name}`} referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0" />
          </div>
          <p className="mt-2 text-xs text-ink-subtle">Data Peta © Google Maps</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={buildGoogleMapsSearchUrl(coordinates)} target="_blank" rel="noopener noreferrer" className={buttonClass('outline', 'md')}>
              <span aria-hidden="true"><ExternalLink size={15} strokeWidth={1.5} /></span>
              Google Maps
            </a>
            <a href={buildGoogleMapsDirectionsUrl(coordinates)} target="_blank" rel="noopener noreferrer" className={buttonClass('outline', 'md')}>
              <span aria-hidden="true"><Navigation size={15} strokeWidth={1.5} /></span>
              Arah
            </a>
          </div>
        </section>
      ) : null}

      {/* Etalase */}
      <section aria-labelledby="catalog-title" className="border-t border-line px-4 py-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>Etalase usaha</Eyebrow>
            <h2 id="catalog-title" className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">Produk yang dipublikasikan</h2>
          </div>
          <p className="text-sm text-ink-muted"><span className="numeric">{products.length}</span> item</p>
        </div>

        {productsQuery.isPending ? (
          <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i}><Skeleton className="aspect-[4/3] w-full" /><Skeleton className="mt-3 h-5 w-3/4" /></div>
            ))}
          </div>
        ) : productsQuery.isError ? (
          <ErrorState className="mt-5" title="Katalog belum dapat dimuat" />
        ) : products.length === 0 ? (
          <EmptyState className="mt-5" title="Belum ada produk dipublikasikan" description="Hubungi pelaku usaha untuk informasi produk terbaru." />
        ) : (
          <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <Button
          size="lg"
          className="w-full"
          disabled={umkm.isContactValid === false}
          leadingIcon={<MessageSquare size={17} strokeWidth={1.5} />}
          onClick={() => setInquiryOpen(true)}
        >
          Tanya via WhatsApp
        </Button>
      </div>

      <WhatsAppInquiryDialog isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} umkm={umkm} source="umkm_detail" />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="px-4 pt-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-9 w-3/4" />
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
      <EmptyState title="Usaha tidak ditemukan" description="Profil usaha yang Anda cari mungkin sudah tidak tersedia atau tautannya berubah." action={<ButtonLink to="/m/umkm" size="lg">Lihat direktori</ButtonLink>} />
    </div>
  ) : (
    <div className="px-4 py-24">
      <ErrorState action={onRetry ? <Button variant="outline" onClick={onRetry}>Coba lagi</Button> : undefined} />
    </div>
  );
}
