import { describe, expect, it } from 'vitest';
import { isOpenNow } from './businessHours';

describe('businessHours -> isOpenNow', () => {
  it('returns false with unknown status when no hours provided', () => {
    const res = isOpenNow();
    expect(res.isOpen).toBe(false);
    expect(res.label).toBe('Jam operasional belum tersedia');
  });

  it('correctly detects open/closed for regular daytime hours ("08:00" - "17:00")', () => {
    // 09:00 WIB (02:00 UTC) -> Open
    const atOpen = new Date('2026-08-27T02:00:00Z');
    const openRes = isOpenNow('08:00', '17:00', null, atOpen);
    expect(openRes.isOpen).toBe(true);
    expect(openRes.label).toBe('Buka Sekarang');
    expect(openRes.detail).toContain('08:00–17:00 WIB');

    // 18:00 WIB (11:00 UTC) -> Closed
    const atClosed = new Date('2026-08-27T11:00:00Z');
    const closedRes = isOpenNow('08:00', '17:00', null, atClosed);
    expect(closedRes.isOpen).toBe(false);
    expect(closedRes.label).toContain('Tutup · Buka besok pukul 08.00');

    // 07:00 WIB (00:00 UTC) -> Closed (earlier today)
    const atEarly = new Date('2026-08-27T00:00:00Z');
    const earlyRes = isOpenNow('08:00', '17:00', null, atEarly);
    expect(earlyRes.isOpen).toBe(false);
    expect(earlyRes.label).toContain('Tutup · Buka pukul 08.00');
  });

  it('supports workingHours text format "08:00 - 17:00"', () => {
    // 10:00 WIB (03:00 UTC) -> Open
    const atOpen = new Date('2026-08-27T03:00:00Z');
    const openRes = isOpenNow(null, null, '08:00 - 17:00', atOpen);
    expect(openRes.isOpen).toBe(true);
    expect(openRes.label).toBe('Buka Sekarang');

    // 20:00 WIB (13:00 UTC) -> Closed
    const atClosed = new Date('2026-08-27T13:00:00Z');
    const closedRes = isOpenNow(null, null, '08:00 - 17:00', atClosed);
    expect(closedRes.isOpen).toBe(false);
  });

  it('supports overnight business hours ("18:00" - "02:00")', () => {
    // 23:00 WIB (16:00 UTC) -> Open
    const atLateNight = new Date('2026-08-27T16:00:00Z');
    const openRes1 = isOpenNow('18:00', '02:00', null, atLateNight);
    expect(openRes1.isOpen).toBe(true);
    expect(openRes1.label).toBe('Buka Sekarang');

    // 01:00 WIB (18:00 UTC previous day) -> Open
    const atEarlyMorning = new Date('2026-08-27T18:00:00Z');
    const openRes2 = isOpenNow('18:00', '02:00', null, atEarlyMorning);
    expect(openRes2.isOpen).toBe(true);
    expect(openRes2.label).toBe('Buka Sekarang');

    // 12:00 WIB (05:00 UTC) -> Closed
    const atNoon = new Date('2026-08-27T05:00:00Z');
    const closedRes = isOpenNow('18:00', '02:00', null, atNoon);
    expect(closedRes.isOpen).toBe(false);
    expect(closedRes.label).toContain('Tutup · Buka pukul 18.00');
  });
});
