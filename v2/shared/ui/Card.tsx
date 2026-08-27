import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Surface V2 (pengganti "Card" generik).
 *
 * MENYIMPANG SADAR dari component-specs.md skill (default: shadow-sm + border):
 * arah desain ini editorial, dan aturan anti-slop melarang "kartu berbingkai +
 * shadow" sebagai wadah default. Jadi:
 *   - default `plain`  -> tanpa border/shadow, pengelompokan lewat spasi
 *   - `outline`        -> hairline 1px (paling sering dipakai)
 *   - `raised`         -> shadow bernada hangat, HANYA saat elevasi bermakna
 *
 * Radius mengikuti shape lock: editorial = tajam (rounded-none). Pill hanya
 * untuk kontrol interaktif, bukan untuk wadah konten.
 */

/**
 * Daftar berpemisah hairline — pengganti tumpukan kartu.
 * Ini pola pengelompokan default arah editorial: satu garis tipis antar baris,
 * bukan enam kotak putih bertumpuk.
 */
export function HairlineList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('divide-y divide-line', className)}>{children}</div>;
}
