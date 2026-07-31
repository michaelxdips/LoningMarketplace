import { describe, expect, it } from 'vitest';
import { normalizeCoordinates } from './location';

// Shared normalization vectors: keep numeric behavior aligned with backend/src/domain/location.ts.
describe('shared coordinate normalization vectors', () => {
  it.each([
    [-6.8912346, 109.3821454, -6.891235, 109.382145],
    [-6.8912344, 109.3821455, -6.891234, 109.382146],
    [-6.5, 109.5, -6.5, 109.5],
    [90, 180, 90, 180],
    [-90, -180, -90, -180],
    [0, 0, 0, 0],
  ])('rounds half away from zero to six decimals (%d, %d)', (lat, lng, expectedLat, expectedLng) => {
    expect(normalizeCoordinates(lat, lng)).toEqual({ latitude: expectedLat, longitude: expectedLng });
  });

  it('normalizes negative zero to positive zero', () => {
    const result = normalizeCoordinates(-0, -0);
    expect(result).toEqual({ latitude: 0, longitude: 0 });
    expect(Object.is(result!.latitude, -0)).toBe(false);
  });

  it.each([
    [90.000001, 0], [-90.000001, 0], [0, 180.000001], [0, -180.000001],
    [Number.NaN, 0], [Number.POSITIVE_INFINITY, 0], [0, Number.NEGATIVE_INFINITY],
  ])('rejects out-of-range or non-finite input (%d, %d)', (lat, lng) => {
    expect(normalizeCoordinates(lat, lng)).toBeUndefined();
  });
});
