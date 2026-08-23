import { cn } from './cn';

/**
 * Kelas visual bersama untuk Button (<button>) dan ButtonLink (<a>/<Link>).
 *
 * Dipisah ke file sendiri supaya keduanya tidak pernah menyimpang tampilannya,
 * TANPA membuat satu komponen polimorfik. Alasannya semantik: tombol yang
 * berpindah halaman harus tetap elemen tautan (bisa dibuka di tab baru,
 * di-bookmark, dibaca sebagai "link" oleh pembaca layar), sementara aksi
 * seperti submit/toggle harus tetap <button>. Prop `as` menyamarkan perbedaan
 * itu, jadi sengaja tidak dipakai.
 *
 * Setiap pasangan warna sudah lolos `node scripts/v2-contrast-check.mjs`:
 *   primary  on-brand/brand               12.06:1
 *   accent   on-accent-fill/accent-fill     5.42:1
 *   danger   on-danger/danger               6.54:1
 *   outline  control-border/canvas          3.35:1 (batas kontrol, WCAG 1.4.11)
 *   link     accent-ink/canvas              6.61:1
 *
 * `accent` mentah TIDAK dipakai sebagai latar: label putih di atasnya hanya
 * 4.17:1 — gagal untuk teks normal. Itu sebab token `accent-fill` ada.
 */

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover',
  accent: 'bg-accent-fill text-on-accent-fill hover:bg-accent-fill-hover',
  outline: 'border border-control-border text-ink hover:bg-sunken',
  ghost: 'text-ink hover:bg-sunken',
  link: 'text-accent-ink underline underline-offset-4 hover:no-underline',
  danger: 'bg-danger text-on-danger hover:brightness-95',
};

/**
 * Ukuran menyimpang sadar dari tabel skill (32/40/48): `md` dinaikkan ke 44px
 * agar memenuhi target sentuh minimum. Pengguna utama aplikasi ini warga desa
 * non-teknis di perangkat mobile, jadi 40px terlalu kecil sebagai default.
 * `sm` (36px) hanya untuk konteks padat seperti toolbar dashboard.
 */
export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-7 text-base',
  icon: 'min-h-11 min-w-11 px-0',
};

export function buttonClass(
  variant: ButtonVariant,
  size: ButtonSize,
  extra?: string | false | null,
): string {
  return cn(
    'focus-ring-v2 inline-flex items-center justify-center gap-2',
    // whitespace-nowrap: label CTA wajib satu baris (aturan anti-slop).
    'whitespace-nowrap rounded-control font-medium',
    'transition-[background-color,color,border-color,opacity] duration-150',
    // Umpan balik taktil tanpa menggeser layout elemen sekitar.
    'active:translate-y-px',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra,
  );
}
