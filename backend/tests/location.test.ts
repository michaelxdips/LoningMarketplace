import { describe, expect, it } from 'vitest';
import { normalizeCoordinates, parsePgNumeric } from '../src/domain/location.js';

describe('location domain', () => {
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
    expect(normalizeCoordinates(-0, -0)).toEqual({ latitude: 0, longitude: 0 });
    expect(Object.is(normalizeCoordinates(-0, 0)!.latitude, -0)).toBe(false);
  });

  it.each([
    ['latitude above range', 90.000001, 0],
    ['latitude below range', -90.000001, 0],
    ['longitude above range', 0, 180.000001],
    ['longitude below range', 0, -180.000001],
  ])('rejects %s', (_label, lat, lng) => {
    expect(normalizeCoordinates(lat, lng)).toBeUndefined();
  });

  it.each([
    ['string latitude', '-6.89', 109.38],
    ['string longitude', -6.89, '109.38'],
    ['NaN', Number.NaN, 0],
    ['Infinity', Number.POSITIVE_INFINITY, 0],
    ['negative Infinity', 0, Number.NEGATIVE_INFINITY],
    ['null', null, 0],
    ['undefined', undefined, 0],
    ['boolean', true, 0],
    ['object', {}, 0],
  ])('rejects non-numeric input: %s', (_label, lat, lng) => {
    expect(normalizeCoordinates(lat, lng)).toBeUndefined();
  });

  it('requires both coordinates together at the API boundary', () => {
    expect(normalizeCoordinates(undefined, 109)).toBeUndefined();
    expect(normalizeCoordinates(-6.8, undefined)).toBeUndefined();
  });

  it.each([
    ['-6.891235', -6.891235],
    ['109.382145', 109.382145],
    ['0', 0],
    ['-0.000000', 0],
    [42, 42],
  ])('parses PostgreSQL numeric output %s safely', (input, expected) => {
    expect(parsePgNumeric(input)).toBe(expected);
    expect(Object.is(parsePgNumeric(input), -0)).toBe(false);
  });

  it.each([null, undefined, '', 'not-a-number', 'Infinity', Number.NaN])('parses %s as null', (input) => {
    expect(parsePgNumeric(input as string | null | undefined)).toBeNull();
  });
});
