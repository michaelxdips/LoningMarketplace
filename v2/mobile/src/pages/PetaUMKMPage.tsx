import { useMemo, useState } from 'react';
import { ExternalLink, Locate, MapPin, MessageSquare, Navigation, Store } from 'lucide-react';
import { Link } from 'react-router';
import { getCategoryShortLabel, type UMKM } from '@loning/shared';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import { buildGoogleMapsDirectionsUrl, buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl, normalizeCoordinates } from '@loning/shared/lib/location';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { calculateDistanceKm, formatDistance } from '@v2-shared/lib/distance';
import { Badge } from '@v2-shared/ui/Badge';
import { Button } from '@v2-shared/ui/Button';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { ErrorState } from '@v2-shared/ui/EmptyState';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { Skeleton } from '@v2-shared/ui/Skeleton';
import { cn } from '@v2-shared/ui/cn';
import WhatsAppInquiryDialog from '@v2-shared/components/WhatsAppInquiryDialog';

/**
 * Peta UMKM V2 mobile — peta di atas, selektor lokasi + daftar belum terpetakan.
 */
export default function PetaUMKMPage() {
  const [selectedUMKMId, setSelectedUMKMId] = useState<string | null>(null);
  const [inquiryUMKM, setInquiryUMKM] = useState<UMKM | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const description = 'Peta interaktif sebaran lokasi UMKM Desa Loning. Temukan titik lokasi usaha warga, lihat profil, dan hubungi pengelola secara langsung.';
  usePageMetadata({ title: 'Peta UMKM Desa Loning — Loning Maju', description, jsonLd: { '@context': 'https://schema.org', '@type': 'Map', name: 'Peta UMKM Desa Loning', description } });

  const { data: umkms, isPending, isError, refetch } = useUMKMs();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Izin akses lokasi ditolak.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Informasi lokasi tidak tersedia.');
        } else {
          setLocationError('Gagal memperoleh lokasi Anda.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const { verifiedUMKMs, unmappedUMKMs } = useMemo(() => {
    if (!umkms) return { verifiedUMKMs: [], unmappedUMKMs: [] as UMKM[] };
    const verified: Array<{ umkm: UMKM; lat: number; lng: number; distanceKm?: number }> = [];
    const unmapped: UMKM[] = [];
    for (const u of umkms) {
      if (typeof u.latitude === 'number' && typeof u.longitude === 'number') {
        const coords = normalizeCoordinates(u.latitude, u.longitude);
        if (coords) {
          const distanceKm = userCoords
            ? calculateDistanceKm(userCoords.latitude, userCoords.longitude, coords.latitude, coords.longitude)
            : undefined;
          verified.push({ umkm: u, lat: coords.latitude, lng: coords.longitude, distanceKm });
          continue;
        }
      }
      unmapped.push(u);
    }

    if (userCoords) {
      verified.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return { verifiedUMKMs: verified, unmappedUMKMs: unmapped };
  }, [umkms, userCoords]);

  const activeVerified = useMemo(() => {
    if (!verifiedUMKMs.length) return null;
    if (!selectedUMKMId) return verifiedUMKMs[0];
    return verifiedUMKMs.find((item) => item.umkm.id === selectedUMKMId) ?? verifiedUMKMs[0];
  }, [verifiedUMKMs, selectedUMKMId]);

  const activeUMKM = activeVerified?.umkm ?? null;

  return (
    <>
      <div className="px-4 pb-1 pt-8">
        <Eyebrow>Jelajahi sebaran usaha</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance">Peta lokasi UMKM Desa Loning</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">Temukan lokasi fisik usaha warga yang telah terverifikasi. Pilih titik pada daftar untuk melihat informasi lengkap.</p>
      </div>

      {isError ? (
        <div className="px-4 py-10">
          <ErrorState title="Gagal memuat peta lokasi UMKM" action={<Button variant="outline" onClick={() => void refetch()}>Muat ulang peta</Button>} />
        </div>
      ) : (
        <div className="px-4 py-8">
          {isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : activeVerified ? (
            <div className="border border-line">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-sunken px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-ink">{activeUMKM ? activeUMKM.name : 'Peta Sebaran Desa Loning'}</span>
                  {activeVerified.distanceKm !== undefined ? (
                    <Badge variant="accent" icon={<MapPin size={11} strokeWidth={1.5} />}>
                      {formatDistance(activeVerified.distanceKm)}
                    </Badge>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-ink-subtle"><span className="numeric">{verifiedUMKMs.length}</span> lokasi</span>
              </div>
              <iframe
                key={activeVerified.umkm.id}
                src={buildGoogleMapsEmbedUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                title={`Peta Lokasi ${activeVerified.umkm.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0"
              />
              <div className="flex items-center justify-between gap-2 border-t border-line bg-sunken px-3 py-2">
                <span className="text-xs text-ink-subtle">© Google Maps</span>
                <div className="flex items-center gap-3">
                  <a href={buildGoogleMapsSearchUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })} target="_blank" rel="noopener noreferrer" className="focus-ring-v2 inline-flex items-center gap-1 text-xs text-accent-ink underline underline-offset-4">
                    <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" /> Maps
                  </a>
                  <a href={buildGoogleMapsDirectionsUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })} target="_blank" rel="noopener noreferrer" className="focus-ring-v2 inline-flex items-center gap-1 text-xs text-accent-ink underline underline-offset-4">
                    <Navigation size={12} strokeWidth={1.5} aria-hidden="true" /> Arah
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center border border-line bg-sunken p-6 text-center">
              <MapPin size={28} strokeWidth={1.5} className="text-ink-subtle" aria-hidden="true" />
              <p className="mt-3 text-sm text-ink-muted">Belum ada UMKM dengan titik lokasi terverifikasi.</p>
            </div>
          )}

          {activeUMKM ? (
            <article className="mt-5 border-t border-line pt-5">
              <div className="flex gap-4">
                <div className="w-24 shrink-0">
                  <MediaImage src={activeUMKM.imageUrl} alt={activeUMKM.altText ?? activeUMKM.name} ratio="aspect-square" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-accent-ink">{getCategoryShortLabel(activeUMKM.category)}</p>
                    {activeVerified?.distanceKm !== undefined ? (
                      <Badge variant="accent" icon={<MapPin size={11} strokeWidth={1.5} />}>
                        {formatDistance(activeVerified.distanceKm)} dari Anda
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold leading-snug tracking-tight text-ink">{activeUMKM.name}</h3>
                  <p className="mt-1 text-sm text-ink-muted">Pengelola: {activeUMKM.owner}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">{activeUMKM.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button leadingIcon={<MessageSquare size={15} strokeWidth={1.5} />} onClick={() => setInquiryUMKM(activeUMKM)}>
                  Tanya via WhatsApp
                </Button>
                <ButtonLink to={`/m/umkm/${encodeURIComponent(activeUMKM.slug)}`} variant="outline" leadingIcon={<Store size={15} strokeWidth={1.5} />}>
                  Lihat Profil
                </ButtonLink>
              </div>
            </article>
          ) : null}

          {/* Selektor */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Pilih lokasi usaha</h2>
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<Locate size={14} strokeWidth={1.5} />}
                isLoading={isLocating}
                loadingLabel="Mencari"
                onClick={handleGetLocation}
              >
                {userCoords ? 'Perbarui' : 'Lokasi Saya'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {userCoords
                ? 'Diurutkan berdasarkan terdekat dari Anda.'
                : 'Pilih titik pada daftar atau cari terdekat.'}
            </p>

            {locationError ? (
              <p className="mt-2 text-xs text-danger" role="alert">
                {locationError}
              </p>
            ) : null}

            {isPending ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : verifiedUMKMs.length === 0 ? (
              <p className="mt-3 py-4 text-sm text-ink-muted">Belum ada UMKM dengan koordinat terverifikasi.</p>
            ) : (
              <div className="mt-3 border-t border-line">
                {verifiedUMKMs.map(({ umkm, distanceKm }) => {
                  const isSelected = activeUMKM?.id === umkm.id;
                  return (
                    <button
                      key={umkm.id}
                      type="button"
                      onClick={() => setSelectedUMKMId(umkm.id)}
                      aria-pressed={isSelected}
                      className={cn('focus-ring-v2 block w-full border-b border-line px-3 py-3 text-left transition-colors', isSelected ? 'bg-sunken' : 'hover:bg-sunken/50')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink">{umkm.name}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {distanceKm !== undefined ? (
                            <span className="text-xs font-medium text-accent-ink">
                              {formatDistance(distanceKm)}
                            </span>
                          ) : null}
                          <span className="shrink-0 text-xs text-ink-subtle">{getCategoryShortLabel(umkm.category)}</span>
                        </div>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">{umkm.address}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {unmappedUMKMs.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">UMKM lainnya ({unmappedUMKMs.length})</h3>
                <p className="mt-2 text-sm text-ink-muted">Pelaku usaha yang titik lokasinya sedang diverifikasi oleh tim desa:</p>
                <div className="mt-2 border-t border-line">
                  {unmappedUMKMs.map((umkm) => (
                    <div key={umkm.id} className="flex items-center justify-between gap-2 border-b border-line py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{umkm.name}</p>
                        <p className="truncate text-xs text-ink-muted">{umkm.address}</p>
                      </div>
                      <Link to={`/m/umkm/${encodeURIComponent(umkm.slug)}`} className="focus-ring-v2 shrink-0 text-sm font-medium text-accent-ink">
                        Profil
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {inquiryUMKM ? (
        <WhatsAppInquiryDialog isOpen={Boolean(inquiryUMKM)} umkm={inquiryUMKM} source="umkm_detail" onClose={() => setInquiryUMKM(null)} />
      ) : null}
    </>
  );
}
