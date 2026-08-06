import { describe, expect, it } from 'vitest';
import { formatPublicUpdatedAt, getBusinessOpenStatus, parseWorkingHours, profileCompleteness } from './umkmStatus';

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
  it('formats freshness deterministically', () => {
    const now = new Date('2026-08-07T05:00:00Z');
    expect(formatPublicUpdatedAt('2026-08-07T01:00:00Z', now)).toBe('Diperbarui hari ini');
    expect(formatPublicUpdatedAt('2026-08-06T01:00:00Z', now)).toBe('Diperbarui kemarin');
    expect(formatPublicUpdatedAt('invalid', now)).toBeNull();
  });
  it('reports equal-weight profile completeness with missing details', () => {
    const value = profileCompleteness({ name: 'Usaha', description: 'Deskripsi', category: 'Kuliner', imageUrl: '/x.webp', phone: '628123456789', address: 'Loning', latitude: -6, longitude: 109, workingHours: '08:00-17:00', assignedProductCount: 1, publishedProductCount: 1 });
    expect(value.percent).toBe(100);
    expect(value.missing).toEqual([]);
  });
});
