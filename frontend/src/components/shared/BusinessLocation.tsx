import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { buildGoogleMapsDirectionsUrl, buildGoogleMapsSearchUrl, buildGoogleMapsEmbedUrl, normalizeCoordinates } from '../../lib/location';

export default function BusinessLocation({ umkmName, address, latitude, longitude, compact = false }: { umkmName: string; address: string; latitude: number | null | undefined; longitude: number | null | undefined; compact?: boolean }) {
  const coordinates = typeof latitude === 'number' && typeof longitude === 'number' ? normalizeCoordinates(latitude, longitude) : undefined;
  if (!coordinates) return null;
  const embedUrl = buildGoogleMapsEmbedUrl(coordinates);
  const searchUrl = buildGoogleMapsSearchUrl(coordinates);
  const directionsUrl = buildGoogleMapsDirectionsUrl(coordinates);
  return (
    <section aria-labelledby={compact ? undefined : 'lokasi-usaha-heading'} className={compact ? '' : 'border-t border-sage-border pt-4'}>
      <h4 id="lokasi-usaha-heading" className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-warm-gray">Lokasi Usaha</h4>
      <p className="mb-3 flex items-start gap-2 text-xs text-warm-gray"><MapPin size={14} className="mt-0.5 shrink-0 text-forest" /><span>{address}</span></p>
      <div className={`w-full overflow-hidden rounded-lg border border-sage-border ${compact ? 'h-40' : 'h-64 sm:h-80'}`}>
        <iframe
          src={embedUrl}
          loading="lazy"
          title={`Peta lokasi ${umkmName}`}
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>
      <p className="mt-2 text-[10px] text-warm-gray">
        Data Peta © Google Maps
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-sage-border bg-white px-4 text-xs font-bold text-forest"><ExternalLink size={14} /> Buka di Google Maps</a>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-sage-border bg-white px-4 text-xs font-bold text-forest"><Navigation size={14} /> Petunjuk Arah</a>
      </div>
    </section>
  );
}
