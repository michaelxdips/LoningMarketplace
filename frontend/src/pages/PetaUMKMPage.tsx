import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, ExternalLink, Store, MessageCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import { UMKMImage } from '../components/business/UMKMImage';
import { ProductImage } from '../components/product/ProductImage';
import WhatsAppInquiryDialog from '../components/shared/WhatsAppInquiryDialog';
import { getUMKMs } from '../lib/api';
import { useUMKMs } from '../hooks/useUMKMs';
import { normalizeCoordinates, buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl, buildGoogleMapsDirectionsUrl } from '../lib/location';
import { usePageMetadata } from '../lib/seo';
import { getCategoryShortLabel, type UMKM } from '../types';

export default function PetaUMKMPage() {
  const [selectedUMKMId, setSelectedUMKMId] = useState<string | null>(null);
  const [inquiryUMKM, setInquiryUMKM] = useState<UMKM | null>(null);

  const description = 'Peta interaktif sebaran lokasi UMKM Desa Loning. Temukan titik lokasi usaha warga, lihat profil, dan hubungi pengelola secara langsung.';

  usePageMetadata({
    title: 'Peta UMKM Desa Loning — Loning Maju',
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Map',
      name: 'Peta UMKM Desa Loning',
      description
    }
  });

  const { data: umkms, isLoading, isError, error, refetch } = useUMKMs();

  // Separate UMKMs with valid coordinates from those without
  const { verifiedUMKMs, unmappedUMKMs } = useMemo(() => {
    if (!umkms) return { verifiedUMKMs: [], unmappedUMKMs: [] };
    const verified: Array<{ umkm: UMKM; lat: number; lng: number }> = [];
    const unmapped: UMKM[] = [];

    for (const u of umkms) {
      if (typeof u.latitude === 'number' && typeof u.longitude === 'number') {
        const coords = normalizeCoordinates(u.latitude, u.longitude);
        if (coords) {
          verified.push({ umkm: u, lat: coords.latitude, lng: coords.longitude });
          continue;
        }
      }
      unmapped.push(u);
    }
    return { verifiedUMKMs: verified, unmappedUMKMs: unmapped };
  }, [umkms]);

  // Active selected UMKM
  const activeVerified = useMemo(() => {
    if (!verifiedUMKMs.length) return null;
    if (!selectedUMKMId) return verifiedUMKMs[0];
    return verifiedUMKMs.find(item => item.umkm.id === selectedUMKMId) || verifiedUMKMs[0];
  }, [verifiedUMKMs, selectedUMKMId]);

  const activeUMKM = activeVerified?.umkm ?? null;

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="mb-6">
          <Link
            to="/#umkm"
            className="focus-ring inline-flex items-center gap-2 rounded-lg py-1.5 px-3 text-xs font-bold text-warm-gray hover:text-forest transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Page Hero Header */}
        <header className="mb-8 max-w-3xl">
          <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
            Jelajahi Sebaran Usaha
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
            Peta Lokasi UMKM Desa Loning
          </h1>
          <p className="mt-3 text-sm leading-6 text-warm-gray sm:text-base">
            Temukan lokasi fisik usaha warga Desa Loning yang telah terverifikasi. Pilih titik pada daftar atau peta untuk melihat informasi lengkap dan menghubungi pelaku usaha langsung melalui WhatsApp.
          </p>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-sage-border bg-cream-card py-20 text-center">
            <div className="size-10 animate-spin rounded-full border-4 border-sage-border border-t-forest" />
            <p className="mt-4 text-sm font-semibold text-warm-gray">Memuat data peta UMKM...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center" role="alert">
            <AlertCircle size={32} className="mx-auto text-red-600" />
            <h2 className="mt-3 text-base font-bold text-red-900">Gagal memuat peta lokasi UMKM</h2>
            <p className="mt-2 text-xs text-red-700 max-w-md mx-auto">
              {error instanceof Error ? error.message : 'Terjadi kendala koneksi ke server.'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="focus-ring touch-target mt-4 inline-flex items-center rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-forest-hover"
            >
              Muat Ulang Peta
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        {!isLoading && !isError && (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Map & Active UMKM Card (Left/Main Panel) */}
            <section aria-labelledby="map-section-heading" className="lg:col-span-8 space-y-6">
              <h2 id="map-section-heading" className="sr-only">Prinjauan Peta dan Usaha Terpilih</h2>

              {/* Interactive Map Container */}
              <div className="overflow-hidden rounded-2xl border border-sage-border bg-cream-card shadow-sm">
                <div className="border-b border-sage-border bg-sage-light/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-forest" />
                    <span className="text-xs font-bold text-charcoal">
                      {activeUMKM ? activeUMKM.name : 'Peta Sebaran Desa Loning'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-warm-gray">
                    {verifiedUMKMs.length} Lokasi Terverifikasi
                  </span>
                </div>

                {/* Map Embed Frame */}
                {activeVerified ? (
                  <div className="relative h-72 sm:h-96 w-full bg-sage-light/30">
                    <iframe
                      key={activeVerified.umkm.id}
                      src={buildGoogleMapsEmbedUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                      title={`Peta Lokasi ${activeVerified.umkm.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-full w-full border-0"
                    />
                  </div>
                ) : (
                  <div className="flex h-72 sm:h-96 w-full flex-col items-center justify-center p-6 text-center bg-sage-light/20">
                    <MapPin size={36} className="text-warm-gray/60" />
                    <p className="mt-3 text-sm font-semibold text-warm-gray">Belum ada UMKM dengan titik lokasi terverifikasi.</p>
                  </div>
                )}

                {/* Map Attribution Footer */}
                <div className="border-t border-sage-border bg-cream-bg px-4 py-2 text-[10px] text-warm-gray flex justify-between items-center">
                  <span>Data Peta © Google Maps</span>
                  {activeVerified && (
                    <div className="flex items-center gap-3">
                      <a
                        href={buildGoogleMapsSearchUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-forest inline-flex items-center gap-1"
                      >
                        <ExternalLink size={10} /> Google Maps
                      </a>
                      <a
                        href={buildGoogleMapsDirectionsUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-forest inline-flex items-center gap-1"
                      >
                        <Navigation size={10} /> Arah
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected UMKM Detailed Card */}
              {activeUMKM && (
                <article id={`active-umkm-card-${activeUMKM.id}`} className="rounded-2xl border border-sage-border bg-cream-card p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="h-36 w-full sm:w-44 shrink-0 overflow-hidden rounded-xl bg-sage-light">
                      <UMKMImage
                        src={activeUMKM.imageUrl}
                        alt={activeUMKM.altText || activeUMKM.name}
                        name={activeUMKM.name}
                        category={activeUMKM.category}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="badge-category">{getCategoryShortLabel(activeUMKM.category)}</span>
                          {activeUMKM.openingTime && activeUMKM.closingTime && (
                            <span className="badge-tag">{activeUMKM.openingTime} – {activeUMKM.closingTime} WIB</span>
                          )}
                          {!activeUMKM.openingTime && activeUMKM.workingHours && (
                            <span className="badge-tag">{activeUMKM.workingHours}</span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-charcoal">{activeUMKM.name}</h3>
                        <p className="mt-1 text-xs font-semibold text-warm-gray">Pengelola: {activeUMKM.owner}</p>

                        <p className="mt-3 text-xs leading-relaxed text-warm-gray line-clamp-2 sm:line-clamp-3">
                          {activeUMKM.description}
                        </p>

                        <p className="mt-3 flex items-start gap-1.5 text-xs text-warm-gray">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-forest" />
                          <span>{activeUMKM.address}</span>
                        </p>
                      </div>

                      {/* Action CTA Buttons */}
                      <div className="mt-5 flex flex-wrap items-center gap-3 pt-3 border-t border-sage-border/60">
                        <button
                          type="button"
                          onClick={() => setInquiryUMKM(activeUMKM)}
                          className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-forest-hover transition-colors"
                        >
                          <MessageCircle size={14} />
                          <span>Tanya via WhatsApp</span>
                        </button>

                        <Link
                          to={`/umkm/${encodeURIComponent(activeUMKM.slug)}`}
                          className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg border border-sage-border bg-cream-bg px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest hover:bg-sage-light transition-colors"
                        >
                          <Store size={14} />
                          <span>Lihat Profil UMKM</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}
            </section>

            {/* Business Selector & Fallback Directory List (Right Column) */}
            <aside aria-labelledby="directory-list-heading" className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-sage-border bg-cream-card p-5 shadow-sm">
                <h2 id="directory-list-heading" className="text-base font-bold text-charcoal mb-1">
                  Pilih Lokasi Usaha
                </h2>
                <p className="text-xs text-warm-gray mb-4">
                  Klik nama usaha untuk menampilkan posisi di peta:
                </p>

                {/* Verified Locations List */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {verifiedUMKMs.map(({ umkm }) => {
                    const isSelected = activeUMKM?.id === umkm.id;
                    return (
                      <button
                        key={umkm.id}
                        type="button"
                        onClick={() => setSelectedUMKMId(umkm.id)}
                        aria-pressed={isSelected}
                        className={`focus-ring w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-forest bg-sage-light/60 font-semibold shadow-xs'
                            : 'border-sage-border bg-cream-card hover:bg-sage-light/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-charcoal truncate min-w-0 flex-1">{umkm.name}</span>
                          <span className="badge-category text-[9.5px] py-0.5 px-2 shrink-0 whitespace-nowrap" title={umkm.category}>
                            {getCategoryShortLabel(umkm.category)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-warm-gray truncate">{umkm.address}</p>
                      </button>
                    );
                  })}

                  {verifiedUMKMs.length === 0 && (
                    <p className="py-6 text-center text-xs text-warm-gray">Belum ada UMKM dengan koordinat terverifikasi.</p>
                  )}
                </div>
              </div>

              {/* Unmapped UMKMs Section (Fallback accessibility) */}
              {unmappedUMKMs.length > 0 && (
                <div className="rounded-2xl border border-sage-border bg-cream-card p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-warm-gray mb-2">
                    UMKM Lainnya ({unmappedUMKMs.length})
                  </h3>
                  <p className="text-xs text-warm-gray mb-3">
                    Pelaku usaha yang titik lokasinya sedang diverifikasi oleh tim desa:
                  </p>
                  <div className="divide-y divide-sage-border/60">
                    {unmappedUMKMs.map((umkm) => (
                      <div key={umkm.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-charcoal truncate">{umkm.name}</p>
                          <p className="text-[11px] text-warm-gray truncate">{umkm.address}</p>
                        </div>
                        <Link
                          to={`/umkm/${encodeURIComponent(umkm.slug)}`}
                          className="focus-ring shrink-0 rounded-lg border border-sage-border px-2.5 py-1 text-[10px] font-bold text-forest hover:bg-sage-light"
                        >
                          Profil
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {/* WhatsApp Inquiry Modal Dialog */}
      {inquiryUMKM && (
        <WhatsAppInquiryDialog
          isOpen={Boolean(inquiryUMKM)}
          umkm={inquiryUMKM}
          source="umkm_detail"
          onClose={() => setInquiryUMKM(null)}
        />
      )}
    </PublicPageShell>
  );
}
