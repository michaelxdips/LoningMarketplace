import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Badge V2.
 *
 * Setiap varian HANYA memakai pasangan warna yang sudah lolos
 * `node scripts/v2-contrast-check.mjs`:
 *   neutral  bg-sunken      + text-ink            14.32:1
 *   brand    bg-brand       + text-on-brand       12.06:1
 *   accent   bg-accent-fill + text-on-accent-fill  5.42:1
 *   danger   bg-danger      + text-on-danger       6.54:1
 *
 * `success` dan `warning` SENGAJA bergaya teks+garis, bukan solid: token
 * `on-success` / `on-warning` tidak ada, jadi versi solid berarti mengarang
 * pasangan warna yang belum terverifikasi. Yang terverifikasi adalah
 * success-ink/canvas (7.71:1) dan warning-ink/canvas (5.46:1) sebagai TEKS.
 *
 * `accent` mentah tidak pernah jadi latar badge: putih di atasnya hanya 4.17:1.
 */

export type BadgeVariant = 'neutral' | 'brand' | 'accent' | 'danger' | 'success' | 'warning' | 'outline';

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-sunken text-ink',
  brand: 'bg-brand text-on-brand',
  accent: 'bg-accent-fill text-on-accent-fill',
  danger: 'bg-danger text-on-danger',
  success: 'border border-success-ink/40 text-success-ink',
  warning: 'border border-warning-ink/40 text-warning-ink',
  outline: 'border border-control-border text-ink',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  /**
   * Ikon status opsional. Wajib diisi kalau badge menyampaikan status —
   * warna saja tidak boleh jadi satu-satunya penanda makna (WCAG 1.4.1).
   */
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', className, icon, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap',
        // Badge = label, bukan kontrol: radius kecil, bukan pill penuh.
        'rounded-sm px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
