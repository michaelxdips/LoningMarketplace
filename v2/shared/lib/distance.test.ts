import { describe, expect, it } from 'vitest';
import { calculateDistanceKm, formatDistance } from './distance';

describe('calculateDistanceKm', () => {
  it('returns 0 for identical points', () => {
    const lat = -6.890123;
    const lon = 109.380456;
    expect(calculateDistanceKm(lat, lon, lat, lon)).toBe(0);
  });

  it('calculates approximate distance correctly between two known points', () => {
    // Jakarta Monas (-6.1754, 106.8272) to Bandung Gedung Sate (-6.9025, 107.6186)
    // Roughly ~119-120 km
    const dist = calculateDistanceKm(-6.1754, 106.8272, -6.9025, 107.6186);
    expect(dist).toBeGreaterThan(118);
    expect(dist).toBeLessThan(121);
  });

  it('calculates short distance in meters accurately', () => {
    // Two points roughly 500m apart in Loning / Petarukan
    const dist = calculateDistanceKm(-6.890000, 109.380000, -6.894500, 109.380000);
    expect(dist).toBeGreaterThan(0.48);
    expect(dist).toBeLessThan(0.52);
  });
});

describe('formatDistance', () => {
  it('formats distances less than 1 km in meters', () => {
    expect(formatDistance(0.35)).toBe('350 m');
    expect(formatDistance(0.05)).toBe('50 m');
    expect(formatDistance(0.001)).toBe('1 m');
    expect(formatDistance(0.999)).toBe('999 m');
  });

  it('formats distances 1 km or more with km suffix', () => {
    expect(formatDistance(1)).toBe('1 km');
    expect(formatDistance(1.0)).toBe('1 km');
    expect(formatDistance(2.4)).toBe('2.4 km');
    expect(formatDistance(12.345)).toBe('12.3 km');
    expect(formatDistance(100.4)).toBe('100 km');
  });

  it('handles zero or negative or invalid numbers', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(-5)).toBe('0 m');
    expect(formatDistance(NaN)).toBe('0 m');
  });
});
