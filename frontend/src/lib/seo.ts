import { useEffect } from 'react';
import { brand } from '../config/brand';
import { buildSiteUrl } from './siteUrl';
import { normalizeCoordinates } from './location';
import type { UMKM } from '../types';

export type PageMetadata = { title: string; description: string; image?: string; type?: 'website' | 'product'; jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> };
const OWNED_SELECTOR = '[data-route-owned="true"]';
const upsertMeta = (selector: string, attributes: Record<string, string>) => { let element = document.head.querySelector<HTMLMetaElement>(selector); if (!element) { element = document.createElement('meta'); document.head.appendChild(element); } Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value)); element.setAttribute('data-route-owned', 'true'); return element; };

export function applyPageMetadata(metadata: PageMetadata) {
  document.head.querySelectorAll(OWNED_SELECTOR).forEach((node) => node.remove());
  document.title = metadata.title;
  upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: metadata.type ?? 'website' });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: metadata.image ? 'summary_large_image' : 'summary' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: metadata.description });
  const canonicalUrl = buildSiteUrl(window.location.pathname);
  if (canonicalUrl) {
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    const canonical = document.createElement('link');
    canonical.rel = 'canonical'; canonical.href = canonicalUrl; canonical.setAttribute('data-route-owned', 'true'); document.head.appendChild(canonical);
  }
  if (metadata.image) {
    const image = buildSiteUrl(metadata.image.startsWith('/') ? metadata.image : '/');
    if (image) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
    }
  }
  if (metadata.jsonLd) { const script = document.createElement('script'); script.id = 'route-json-ld'; script.type = 'application/ld+json'; script.text = JSON.stringify(metadata.jsonLd); script.setAttribute('data-route-owned', 'true'); document.head.appendChild(script); }
  return () => document.head.querySelectorAll(OWNED_SELECTOR).forEach((node) => node.remove());
}

export function usePageMetadata(metadata: PageMetadata) {
  useEffect(() => applyPageMetadata(metadata), [metadata.title, metadata.description, metadata.image, metadata.type, JSON.stringify(metadata.jsonLd)]);
}
export const defaultMetadata: PageMetadata = { title: brand.title, description: brand.description };

export function buildLocalBusinessJsonLd(umkm: UMKM, description = umkm.description): Record<string, unknown> {
  const coordinates = typeof umkm.latitude === 'number' && typeof umkm.longitude === 'number' ? normalizeCoordinates(umkm.latitude, umkm.longitude) : undefined;
  return {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: umkm.name, description, image: umkm.imageUrl,
    telephone: umkm.phone, url: buildSiteUrl(`/umkm/${umkm.slug}`),
    address: { '@type': 'PostalAddress', streetAddress: umkm.address, addressLocality: 'Loning', addressRegion: 'Jawa Tengah', addressCountry: 'ID' },
    openingHours: umkm.workingHours,
    ...(coordinates ? { geo: { '@type': 'GeoCoordinates', latitude: coordinates.latitude, longitude: coordinates.longitude } } : {}),
  };
}

