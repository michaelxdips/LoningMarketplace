import { describe, expect, it } from 'vitest';
import { formatPublicUpdatedAt, getBusinessOpenStatus, parseWorkingHours, profileCompleteness, resolveOpeningWindow, formatOperatingHours, buildOpeningWindow } from './umkmStatus';

describe('UMKM public status', () => {
  it('parses common opening hours and rejects free text', () => {
    expect(parseWorkingHours('08:00-17:00')).toMatchObject({ start: 480, end: 1020 });
    expect(parseWorkingHours('setiap hari')).toBeNull();
  });
  it('uses Asia/Jakarta and handles exact/open/closed/overnight times', () => {
    expect(getBusinessOpenStatus('08:00-17:00', new Date('2026-08-07T01:00:00Z')).kind).toBe('open');
    expect(getBusinessOpenStatus('08:00-17:00', new Date('2026-08-07T10:00:00Z')).kind).toBe('closed');
    expect(getBusinessOpenStatus('18:00-02:00', new Date('2026-08-07T17:00:00Z')).kind).toBe('open');
    expect(getBusinessOpenStatus(undefined).kind).toBe('unknown');
  });
  it('builds opening window from structured time fields', () => {
    const window = buildOpeningWindow('07:30', '16:00');
    expect(window).not.toBeNull();
    expect(window!.start).toBe(450);
    expect(window!.end).toBe(960);
    expect(window!.raw).toBe('07:30–16:00');
    expect(buildOpeningWindow(null, '16:00')).toBeNull();
    expect(buildOpeningWindow('07:30', null)).toBeNull();
  });
  it('resolves best opening window: structured first, then free-text', () => {
    expect(resolveOpeningWindow('08:00-17:00', '07:30', '16:00')).toMatchObject({ start: 450, end: 960 });
    expect(resolveOpeningWindow('08:00-17:00', null, null)).toMatchObject({ start: 480, end: 1020 });
    expect(resolveOpeningWindow(null, null, null)).toBeNull();
  });
  it('formats operating hours from structured or free-text', () => {
    expect(formatOperatingHours(null, '07:30', '16:00')).toBe('07:30 – 16:00 WIB');
    expect(formatOperatingHours('Senin-Minggu', null, null)).toBe('Senin-Minggu');
    expect(formatOperatingHours(null, null, null)).toBeNull();
  });
  it('getBusinessOpenStatus respects structured openingTime/closingTime', () => {
    expect(getBusinessOpenStatus(undefined, new Date('2026-08-07T01:00:00Z'), '07:00', '16:00').kind).toBe('open');
    expect(getBusinessOpenStatus(undefined, new Date('2026-08-07T10:00:00Z'), '07:00', '16:00').kind).toBe('closed');
  });
  it('formats freshness deterministically', () => {
    const now = new Date('2026-08-07T05:00:00Z');
    expect(formatPublicUpdatedAt('2026-08-07T01:00:00Z', now)).toBe('Diperbarui hari ini');
    expect(formatPublicUpdatedAt('2026-08-06T01:00:00Z', now)).toBe('Diperbarui kemarin');
    expect(formatPublicUpdatedAt('invalid', now)).toBeNull();
  });
  it('reports equal-weight profile completeness with missing details', () => {
    const value = profileCompleteness({ name: 'Usaha', description: 'Deskripsi', category: 'Kuliner', imageUrl: '/x.webp', phone: '628123456789', address: 'Loning', latitude: -6, longitude: 109, workingHours: '08:00-17:00', openingTime: null, closingTime: null, assignedProductCount: 1, publishedProductCount: 1 });
    expect(value.percent).toBe(100);
    expect(value.missing).toEqual([]);
  });
  it('profile completeness uses structured time fields', () => {
    const value = profileCompleteness({ name: 'Usaha', description: 'Deskripsi', category: 'Kuliner', imageUrl: '/x.webp', phone: '628123456789', address: 'Loning', latitude: -6, longitude: 109, workingHours: null, openingTime: '08:00', closingTime: '17:00', assignedProductCount: 1, publishedProductCount: 1 });
    expect(value.percent).toBe(100);
    expect(value.missing).toEqual([]);
  });
});
