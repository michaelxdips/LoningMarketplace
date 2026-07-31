import { describe, expect, it } from 'vitest';
import { buildGoogleMapsDirectionsUrl, buildGoogleMapsSearchUrl, buildOsmEmbedUrl, parseLocationInput } from './location';

describe('parseLocationInput', () => {
  it.each([
    ['direct pair', '-6.891235, 109.382145', { latitude: -6.891235, longitude: 109.382145 }],
    ['google @ path', 'https://www.google.com/maps/place/Warung/@-6.891235,109.382145,17z', { latitude: -6.891235, longitude: 109.382145 }],
    ['google @ data path', 'https://www.google.com/maps/@-6.8912346,109.3821454,15z/data=!3m1!4b1', { latitude: -6.891235, longitude: 109.382145 }],
    ['google query param', 'https://www.google.com/maps/search/?api=1&query=-6.891235,109.382145', { latitude: -6.891235, longitude: 109.382145 }],
    ['google maps host', 'https://maps.google.com/?q=-6.891235,109.382145', { latitude: -6.891235, longitude: 109.382145 }],
    ['osm hash', 'https://www.openstreetmap.org/#map=17/-6.891235/109.382145', { latitude: -6.891235, longitude: 109.382145 }],
    ['osm marker', 'https://www.openstreetmap.org/?mlat=-6.891235&mlon=109.382145#map=17/-6.891235/109.382145', { latitude: -6.891235, longitude: 109.382145 }],
  ])('accepts %s', (_label, input, expected) => {
    const result = parseLocationInput(input);
    expect(result).toEqual({ ok: true, coordinates: expected });
  });

  it.each([
    ['short goo.gl link', 'https://maps.app.goo.gl/AbCdEfGh', 'short-link'],
    ['goo.gl/maps link', 'https://goo.gl/maps/AbCdEfGh', 'short-link'],
    ['http URL', 'http://www.google.com/maps/@-6.89,109.38,17z', 'insecure'],
    ['javascript scheme', 'javascript:alert(1)', 'insecure'],
    ['data scheme', 'data:text/html,<script>1</script>', 'insecure'],
    ['unrelated host', 'https://example.com/@-6.89,109.38', 'unsupported-host'],
    ['google URL without coordinates', 'https://www.google.com/maps/place/Warung+Loning', 'no-coordinates'],
    ['malformed URL', 'https://', 'malformed'],
    ['garbage text', 'bukan koordinat', 'malformed'],
    ['out-of-range pair', '-96.5,109.3', 'malformed'],
    ['encoded hostile host', 'https://www.google.com.evil.test/@-6.89,109.38', 'unsupported-host'],
    ['NaN pair', 'NaN,109.3', 'malformed'],
  ])('rejects %s', (_label, input, reason) => {
    expect(parseLocationInput(input)).toEqual({ ok: false, reason });
  });

  it('rejects oversized URLs', () => {
    expect(parseLocationInput(`https://www.google.com/maps/${'a'.repeat(3000)}`)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects out-of-range coordinates inside supported URLs', () => {
    expect(parseLocationInput('https://www.openstreetmap.org/#map=17/-96.5/109.3')).toEqual({ ok: false, reason: 'invalid-coordinates' });
    expect(parseLocationInput('https://www.google.com/maps/@-6.89,189.38,17z')).toEqual({ ok: false, reason: 'invalid-coordinates' });
  });
});

describe('generated URLs use normalized coordinates only', () => {
  const c = { latitude: -6.891235, longitude: 109.382145 };
  it('builds the OSM embed URL around the point', () => {
    const url = buildOsmEmbedUrl(c);
    expect(url).toContain('https://www.openstreetmap.org/export/embed.html?bbox=');
    expect(url).toContain('marker=-6.891235,109.382145');
  });
  it('builds Google Maps search and directions URLs', () => {
    expect(buildGoogleMapsSearchUrl(c)).toBe('https://www.google.com/maps/search/?api=1&query=-6.891235,109.382145');
    expect(buildGoogleMapsDirectionsUrl(c)).toBe('https://www.google.com/maps/dir/?api=1&destination=-6.891235,109.382145');
  });
});
