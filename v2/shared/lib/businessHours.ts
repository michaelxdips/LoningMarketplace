import { resolveOpeningWindow } from '@loning/shared/lib/umkmStatus';

const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

function jakartaMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return Number(map.hour) * 60 + Number(map.minute);
}

const clockLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')}`;

export interface BusinessHoursStatus {
  isOpen: boolean;
  label: string;
  detail: string;
}

/**
 * Cek status buka/tutup UMKM real-time berdasarkan zona waktu WIB (Asia/Jakarta).
 */
export function isOpenNow(
  openingTime?: string | null,
  closingTime?: string | null,
  workingHours?: string | null,
  at: Date = new Date(),
): BusinessHoursStatus {
  const window = resolveOpeningWindow(workingHours, openingTime, closingTime);
  if (!window) {
    return {
      isOpen: false,
      label: 'Jam operasional belum tersedia',
      detail: 'Hubungi UMKM untuk memastikan waktu layanan.',
    };
  }

  const now = jakartaMinutes(at);
  const overnight = window.end <= window.start;
  const isOpen = overnight
    ? now >= window.start || now < window.end
    : now >= window.start && now < window.end;

  if (isOpen) {
    return {
      isOpen: true,
      label: 'Buka Sekarang',
      detail: `Berdasarkan jam operasional ${window.raw} WIB.`,
    };
  }

  const opensTomorrow = overnight ? now >= window.end && now < window.start : now >= window.end;
  return {
    isOpen: false,
    label: (opensTomorrow && !overnight)
      ? `Tutup · Buka besok pukul ${clockLabel(window.start)}`
      : `Tutup · Buka pukul ${clockLabel(window.start)}`,
    detail: `Berdasarkan jam operasional ${window.raw} WIB.`,
  };
}
