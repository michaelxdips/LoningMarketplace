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

export type SurfaceVariant = 'plain' | 'outline' | 'raised';

const VARIANTS: Record<SurfaceVariant, string> = {
  plain: 'bg-transparent',
  outline: 'border border-line bg-surface',
  // Shadow diberi nada hangat (bukan hitam murni) agar menyatu dengan canvas krem.
  raised: 'bg-surface shadow-[0_1px_2px_rgba(28,36,33,0.06),0_8px_24px_rgba(28,36,33,0.06)]',
};

export interface SurfaceProps {
  variant?: SurfaceVariant;
  /** Menambah afordansi hover/aktif. Pakai HANYA kalau seluruh area diklik. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

export function Surface({ variant = 'plain', interactive = false, className, children }: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-none',
        VARIANTS[variant],
        interactive &&
          cn(
            'transition-[border-color,background-color,transform] duration-200',
            'hover:border-control-border active:translate-y-px',
          ),
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Daftar berpemisah hairline — pengganti tumpukan kartu.
 * Ini pola pengelompokan default arah editorial: satu garis tipis antar baris,
 * bukan enam kotak putih bertumpuk.
 */
export function HairlineList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('divide-y divide-line', className)}>{children}</div>;
}
