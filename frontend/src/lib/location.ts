export type Coordinates = { latitude: number; longitude: number };
export type LocationParseResult =
  | { ok: true; coordinates: Coordinates }
  | { ok: false; reason: 'empty' | 'malformed' | 'insecure' | 'unsupported-host' | 'short-link' | 'no-coordinates' | 'invalid-coordinates' };

export const SHORT_LINK_MESSAGE = 'Link pendek belum dapat dibaca otomatis. Buka link tersebut, salin alamat lengkap dari browser, atau masukkan koordinat secara manual.';

const LATITUDE_MIN = -90, LATITUDE_MAX = 90, LONGITUDE_MIN = -180, LONGITUDE_MAX = 180;
const MAX_URL_LENGTH = 2048;
// Supported hosts only; subdomains of google.* (maps.google.com, www.google.com/maps) and openstreetmap.org.
const GOOGLE_HOSTS = new Set(['maps.google.com', 'www.google.com', 'google.com', 'maps.google.co.id', 'www.google.co.id']);
const OSM_HOSTS = new Set(['www.openstreetmap.org', 'openstreetmap.org']);
const SHORT_LINK_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

const round6 = (value: number) => {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

export function normalizeCoordinates(latitude: number, longitude: number): Coordinates | undefined {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const lat = round6(latitude), lng = round6(longitude);
  if (lat < LATITUDE_MIN || lat > LATITUDE_MAX || lng < LONGITUDE_MIN || lng > LONGITUDE_MAX) return undefined;
  return { latitude: lat, longitude: lng };
}

const parsePair = (raw: string): Coordinates | undefined => {
  const match = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(raw.trim());
  if (!match) return undefined;
  return normalizeCoordinates(Number(match[1]), Number(match[2]));
};

export function parseLocationInput(input: string): LocationParseResult {
  const text = input.trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > MAX_URL_LENGTH) return { ok: false, reason: 'malformed' };
  const direct = parsePair(text);
  if (direct) return { ok: true, coordinates: direct };
  if (!/^https:\/\//i.test(text)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return { ok: false, reason: 'insecure' };
    return { ok: false, reason: 'malformed' };
  }
  let url: URL;
  try { url = new URL(text); } catch { return { ok: false, reason: 'malformed' }; }
  if (url.protocol !== 'https:') return { ok: false, reason: 'insecure' };
  const host = url.hostname.toLowerCase();
  if (SHORT_LINK_HOSTS.has(host)) return { ok: false, reason: 'short-link' };
  if (GOOGLE_HOSTS.has(host)) {
    const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(url.pathname + url.search + url.hash);
    if (at) {
      const coordinates = normalizeCoordinates(Number(at[1]), Number(at[2]));
      return coordinates ? { ok: true, coordinates } : { ok: false, reason: 'invalid-coordinates' };
    }
    const query = url.searchParams.get('query') ?? url.searchParams.get('q');
    if (query) {
      const pair = parsePair(query);
      if (pair) return { ok: true, coordinates: pair };
    }
    const ll = url.searchParams.get('ll');
    if (ll) {
      const pair = parsePair(ll);
      if (pair) return { ok: true, coordinates: pair };
    }
    return { ok: false, reason: 'no-coordinates' };
  }
  if (OSM_HOSTS.has(host)) {
    const map = /#map=\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/.exec(url.hash);
    if (map) {
      const coordinates = normalizeCoordinates(Number(map[1]), Number(map[2]));
      return coordinates ? { ok: true, coordinates } : { ok: false, reason: 'invalid-coordinates' };
    }
    const marker = url.searchParams.get('mlat') && url.searchParams.get('mlon') ? parsePair(`${url.searchParams.get('mlat')},${url.searchParams.get('mlon')}`) : undefined;
    if (marker) return { ok: true, coordinates: marker };
    return { ok: false, reason: 'no-coordinates' };
  }
  return { ok: false, reason: 'unsupported-host' };
}

const coordinatePath = ({ latitude, longitude }: Coordinates) => `${latitude},${longitude}`;

export function buildOsmEmbedUrl(c: Coordinates): string {
  const pad = 0.004;
  const bbox = `${c.longitude - pad},${c.latitude - pad},${c.longitude + pad},${c.latitude + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coordinatePath(c)}`;
}
export function buildGoogleMapsSearchUrl(c: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${coordinatePath(c)}`;
}
export function buildGoogleMapsDirectionsUrl(c: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinatePath(c)}`;
}
