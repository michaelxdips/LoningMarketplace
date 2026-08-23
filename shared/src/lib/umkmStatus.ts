const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

type Minutes = number;
type OpeningWindow = { start: Minutes; end: Minutes; raw: string };

function parseClock(value: string): Minutes | null {
  const match = value.trim().match(/^(\d{1,2})[.:](\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function parseWorkingHours(value?: string | null): OpeningWindow | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}[.:]\d{2})\s*[-–—]\s*(\d{1,2}[.:]\d{2})$/);
  if (!match) return null;
  const start = parseClock(match[1]);
  const end = parseClock(match[2]);
  return start === null || end === null ? null : { start, end, raw: value.trim() };
}

/** Builds an opening window from structured openingTime/closingTime fields. */
export function buildOpeningWindow(openingTime?: string | null, closingTime?: string | null): OpeningWindow | null {
  if (!openingTime || !closingTime) return null;
  const start = parseClock(openingTime);
  const end = parseClock(closingTime);
  if (start === null || end === null) return null;
  return { start, end, raw: `${openingTime}–${closingTime}` };
}

/** Resolves the best available opening window: structured fields first, then free-text workingHours. */
export function resolveOpeningWindow(workingHours?: string | null, openingTime?: string | null, closingTime?: string | null): OpeningWindow | null {
  if (openingTime && closingTime) {
    const window = buildOpeningWindow(openingTime, closingTime);
    if (window) return window;
  }
  return parseWorkingHours(workingHours);
}

function jakartaParts(at: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TIME_ZONE,
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(value.hour) * 60 + Number(value.minute);
}

const clockLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')}`;

export type BusinessOpenStatus = { kind: 'open' | 'closed' | 'unknown'; label: string; detail: string };

export function getBusinessOpenStatus(workingHours?: string | null, at = new Date(), openingTime?: string | null, closingTime?: string | null): BusinessOpenStatus {
  const window = resolveOpeningWindow(workingHours, openingTime, closingTime);
  if (!window) return { kind: 'unknown', label: 'Jam operasional belum tersedia', detail: 'Hubungi UMKM untuk memastikan waktu layanan.' };
  const now = jakartaParts(at);
  const overnight = window.end <= window.start;
  const open = overnight ? now >= window.start || now < window.end : now >= window.start && now < window.end;
  if (open) return { kind: 'open', label: 'Buka sekarang', detail: `Berdasarkan jam operasional ${window.raw} WIB.` };
  const opensTomorrow = overnight ? now >= window.end && now < window.start : now >= window.end;
  return {
    kind: 'closed',
    label: opensTomorrow ? `Tutup · Buka besok pukul ${clockLabel(window.start)}` : `Tutup · Buka pukul ${clockLabel(window.start)}`,
    detail: `Berdasarkan jam operasional ${window.raw} WIB.`,
  };
}

/** Extracts a display-friendly hours label from structured fields or free-text. */
export function formatOperatingHours(workingHours?: string | null, openingTime?: string | null, closingTime?: string | null): string | null {
  if (openingTime && closingTime) return `${openingTime} – ${closingTime} WIB`;
  if (workingHours) return workingHours;
  return null;
}

export function formatPublicUpdatedAt(value?: string | Date | null, at = new Date()): string | null {
  if (!value) return null;
  const updated = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(updated.getTime())) return null;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA_TIME_ZONE }).format;
  const today = day(at);
  const yesterday = day(new Date(at.getTime() - 86_400_000));
  const target = day(updated);
  if (target === today) return 'Diperbarui hari ini';
  if (target === yesterday) return 'Diperbarui kemarin';
  const difference = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${target}T00:00:00Z`)) / 86_400_000);
  if (difference > 1 && difference <= 7) return `Diperbarui ${difference} hari lalu`;
  return `Diperbarui ${new Intl.DateTimeFormat('id-ID', { timeZone: JAKARTA_TIME_ZONE, dateStyle: 'long' }).format(updated)}`;
}

export function profileCompleteness(umkm: {
  name?: string | null; description?: string | null; category?: string | null; imageUrl?: string | null;
  isContactValid?: boolean; phone?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null;
  workingHours?: string | null; openingTime?: string | null; closingTime?: string | null; assignedProductCount?: number; publishedProductCount?: number;
}) {
  const checks = [
    ['Nama UMKM', Boolean(umkm.name?.trim())], ['Deskripsi', Boolean(umkm.description?.trim())], ['Kategori', Boolean(umkm.category)],
    ['Foto usaha', Boolean(umkm.imageUrl)], ['Nomor WhatsApp valid', umkm.isContactValid ?? /^628\d{7,12}$/.test(umkm.phone ?? '')],
    ['Alamat', Boolean(umkm.address?.trim())], ['Lokasi usaha', umkm.latitude != null && umkm.longitude != null],
    ['Jam operasional', Boolean(resolveOpeningWindow(umkm.workingHours, umkm.openingTime, umkm.closingTime))],
    ['Minimal satu produk', Number(umkm.assignedProductCount ?? 0) > 0],
    ['Minimal satu produk terbit', Number(umkm.publishedProductCount ?? 0) > 0],
  ] as const;
  const completed = checks.filter(([, ready]) => ready).length;
  return { completed, total: checks.length, percent: Math.round(completed / checks.length * 100), missing: checks.filter(([, ready]) => !ready).map(([label]) => label) };
}
