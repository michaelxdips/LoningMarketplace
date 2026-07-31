import { describe, expect, it, vi } from 'vitest';
import { buildLocalBusinessJsonLd } from './seo';
import type { UMKM } from '../types';

vi.stubGlobal('window', { location: { origin: 'https://site.example.invalid', pathname: '/' } });
const umkm: UMKM = { id: '1', slug: 'dapur-loning', name: 'Dapur Loning', owner: 'Sri', description: 'Kuliner', phone: '628123456789', category: 'Kuliner', imageUrl: '/umkm.webp', address: 'Dusun Loning', latitude: -6.8912346, longitude: 109.3821454 };

describe('LocalBusiness geo JSON-LD', () => {
  it('includes normalized GeoCoordinates only for a valid pair', () => {
    expect(buildLocalBusinessJsonLd(umkm)).toMatchObject({ geo: { '@type': 'GeoCoordinates', latitude: -6.891235, longitude: 109.382145 }, address: { streetAddress: 'Dusun Loning' } });
  });
  it('omits geo for null, partial, or invalid coordinates', () => {
    for (const values of [{ latitude: null, longitude: null }, { latitude: -6.8, longitude: null }, { latitude: -96, longitude: 109 }]) {
      expect(buildLocalBusinessJsonLd({ ...umkm, ...values } as UMKM)).not.toHaveProperty('geo');
    }
  });
});
