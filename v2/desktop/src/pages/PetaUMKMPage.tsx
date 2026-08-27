import { useMemo, useState } from 'react';
import { ExternalLink, Locate, MapPin, MessageSquare, Navigation, Store } from 'lucide-react';
import { Link } from 'react-router';
import { getCategoryShortLabel, type UMKM } from '@loning/shared';
import { useUMKMs } from '@loning/shared/hooks/useUMKMs';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  normalizeCoordinates,
} from '@loning/shared/lib/location';
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
 * Peta UMKM V2 — pasangan fitur dari /peta-umkm UI lama.
 *
 * Layout dipertahankan (peta kiri, selektor kanan, daftar belum terpetakan),
 * tapi kartu/panel tanpa shadow dan tanpa ikon-topper; selektor memakai hairline
 * list editorial.
 */
export default function PetaUMKMPage() {
  const [selectedUMKMId, setSelectedUMKMId] = useState<string | null>(null);
  const [inquiryUMKM, setInquiryUMKM] = useState<UMKM | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const description =
    'Peta interaktif sebaran lokasi UMKM Desa Loning. Temukan titik lokasi usaha warga, lihat profil, dan hubungi pengelola secara langsung.';

  usePageMetadata({
    title: 'Peta UMKM Desa Loning — Loning Maju',
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Map',
      name: 'Peta UMKM Desa Loning',
      description,
    },
  });

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
      <div className="mx-auto max-w-[1400px] px-6 pb-2 pt-14 lg:px-10">
        <Eyebrow>Jelajahi sebaran usaha</Eyebrow>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink text-balance md:text-5xl">
          Peta lokasi UMKM Desa Loning
        </h1>
        <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-ink-muted">
          Temukan lokasi fisik usaha warga yang telah terverifikasi. Pilih titik pada daftar atau
          peta untuk melihat informasi lengkap dan menghubungi pelaku usaha langsung via WhatsApp.
        </p>
      </div>

      {isError ? (
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
          <ErrorState
            title="Gagal memuat peta lokasi UMKM"
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Muat ulang peta
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Peta + usaha aktif */}
            <section aria-labelledby="map-section-heading" className="lg:col-span-8">
              <h2 id="map-section-heading" className="sr-only">
                Pratinjau peta dan usaha terpilih
              </h2>

              {isPending ? (
                <Skeleton className="h-72 w-full sm:h-96" />
              ) : activeVerified ? (
                <div className="border border-line">
                  <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {activeUMKM ? activeUMKM.name : 'Peta Sebaran Desa Loning'}
                      </span>
                      {activeVerified.distanceKm !== undefined ? (
                        <Badge variant="accent" icon={<MapPin size={12} strokeWidth={1.5} />}>
                          {formatDistance(activeVerified.distanceKm)} dari Anda
                        </Badge>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm text-ink-subtle">
                      <span className="numeric">{verifiedUMKMs.length}</span> lokasi terverifikasi
                    </span>
                  </div>
                  <iframe
                    key={activeVerified.umkm.id}
                    src={buildGoogleMapsEmbedUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                    title={`Peta Lokasi ${activeVerified.umkm.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-72 w-full border-0 sm:h-96"
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-line bg-sunken px-4 py-2">
                    <span className="text-xs text-ink-subtle">Data Peta © Google Maps</span>
                    <div className="flex items-center gap-4">
                      <a
                        href={buildGoogleMapsSearchUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring-v2 inline-flex items-center gap-1 text-xs text-accent-ink underline underline-offset-4"
                      >
                        <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
                        Google Maps
                      </a>
                      <a
                        href={buildGoogleMapsDirectionsUrl({ latitude: activeVerified.lat, longitude: activeVerified.lng })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring-v2 inline-flex items-center gap-1 text-xs text-accent-ink underline underline-offset-4"
                      >
                        <Navigation size={12} strokeWidth={1.5} aria-hidden="true" />
                        Arah
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center border border-line bg-sunken p-6 text-center sm:h-96">
                  <MapPin size={32} strokeWidth={1.5} className="text-ink-subtle" aria-hidden="true" />
                  <p className="mt-3 text-sm text-ink-muted">
                    Belum ada UMKM dengan titik lokasi terverifikasi.
                  </p>
                </div>
              )}

              {activeUMKM ? (
                <article className="mt-6 border-t border-line pt-6">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="w-full shrink-0 sm:w-44">
                      <MediaImage
                        src={activeUMKM.imageUrl}
                        alt={activeUMKM.altText ?? activeUMKM.name}
                        ratio="aspect-[4/3]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-accent-ink">
                          {getCategoryShortLabel(activeUMKM.category)}
                        </span>
                        {activeVerified?.distanceKm !== undefined ? (
                          <Badge variant="accent" icon={<MapPin size={12} strokeWidth={1.5} />}>
                            {formatDistance(activeVerified.distanceKm)} dari Anda
                          </Badge>
                        ) : null}
                        {activeUMKM.openingTime && activeUMKM.closingTime ? (
                          <span className="text-xs text-ink-subtle">
                            {activeUMKM.openingTime} – {activeUMKM.closingTime} WIB
                          </span>
                        ) : activeUMKM.workingHours ? (
                          <span className="text-xs text-ink-subtle">{activeUMKM.workingHours}</span>
                        ) : null}
                      </div>

                      <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
                        {activeUMKM.name}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">Pengelola: {activeUMKM.owner}</p>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                        {activeUMKM.description}
                      </p>
                      <p className="mt-3 flex items-start gap-1.5 text-sm text-ink-muted">
                        <MapPin size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                        <span>{activeUMKM.address}</span>
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5">
                        <Button
                          leadingIcon={<MessageSquare size={15} strokeWidth={1.5} />}
                          onClick={() => setInquiryUMKM(activeUMKM)}
                        >
                          Tanya via WhatsApp
                        </Button>
                        <ButtonLink
                          to={`/v2/umkm/${encodeURIComponent(activeUMKM.slug)}`}
                          variant="outline"
                          leadingIcon={<Store size={15} strokeWidth={1.5} />}
                        >
                          Lihat Profil UMKM
                        </ButtonLink>
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}
            </section>

            {/* Selektor lokasi */}
            <aside aria-labelledby="directory-list-heading" className="lg:col-span-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="directory-list-heading" className="font-display text-lg font-semibold tracking-tight text-ink">
                  Pilih lokasi usaha
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  leadingIcon={<Locate size={14} strokeWidth={1.5} />}
                  isLoading={isLocating}
                  loadingLabel="Mencari lokasi"
                  onClick={handleGetLocation}
                >
                  {userCoords ? 'Perbarui Lokasi' : 'Cari Terdekat'}
                </Button>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {userCoords
                  ? 'Daftar diurutkan berdasarkan jarak terdekat dari lokasi Anda.'
                  : 'Klik nama usaha atau cari UMKM terdekat dari posisi Anda.'}
              </p>

              {locationError ? (
                <p className="mt-2 text-xs text-danger" role="alert">
                  {locationError}
                </p>
              ) : null}

              {isPending ? (
                <div className="mt-5 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : verifiedUMKMs.length === 0 ? (
                <p className="mt-5 py-6 text-sm text-ink-muted">
                  Belum ada UMKM dengan koordinat terverifikasi.
                </p>
              ) : (
                <div className="mt-4 max-h-[480px] overflow-y-auto border-t border-line">
                  {verifiedUMKMs.map(({ umkm, distanceKm }) => {
                    const isSelected = activeUMKM?.id === umkm.id;
                    return (
                      <button
                        key={umkm.id}
                        type="button"
                        onClick={() => setSelectedUMKMId(umkm.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          'focus-ring-v2 block w-full border-b border-line px-3 py-3 text-left transition-colors',
                          isSelected ? 'bg-sunken' : 'hover:bg-sunken/50',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-ink">{umkm.name}</span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {distanceKm !== undefined ? (
                              <span className="text-xs font-medium text-accent-ink">
                                {formatDistance(distanceKm)}
                              </span>
                            ) : null}
                            <span className="text-xs text-ink-subtle">
                              {getCategoryShortLabel(umkm.category)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">{umkm.address}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {unmappedUMKMs.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                    UMKM lainnya ({unmappedUMKMs.length})
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">
                    Pelaku usaha yang titik lokasinya sedang diverifikasi oleh tim desa:
                  </p>
                  <div className="mt-3 border-t border-line">
                    {unmappedUMKMs.map((umkm) => (
                      <div key={umkm.id} className="flex items-center justify-between gap-2 border-b border-line py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{umkm.name}</p>
                          <p className="truncate text-xs text-ink-muted">{umkm.address}</p>
                        </div>
                        <Link
                          to={`/v2/umkm/${encodeURIComponent(umkm.slug)}`}
                          className="focus-ring-v2 shrink-0 text-sm font-medium text-accent-ink hover:underline"
                        >
                          Profil
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      )}

      {inquiryUMKM ? (
        <WhatsAppInquiryDialog
          isOpen={Boolean(inquiryUMKM)}
          umkm={inquiryUMKM}
          source="umkm_detail"
          onClose={() => setInquiryUMKM(null)}
        />
      ) : null}
    </>
  );
}
