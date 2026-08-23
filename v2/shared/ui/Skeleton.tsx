import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Skeleton V2.
 *
 * Aturan: bentuknya harus MENIRU layout akhir, bukan spinner bundar generik.
 * Karena itu tidak ada komponen "Spinner" di folder ini — pemakai diarahkan
 * menyusun skeleton yang sebentuk dengan konten sebenarnya.
 *
 * Animasi tidak perlu digerbangi manual: tokens.css sudah mematikan seluruh
 * animasi di dalam [data-ui="v2"] saat prefers-reduced-motion: reduce.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse bg-sunken', className)} />;
}

/**
 * Pembungkus daerah yang sedang memuat.
 * `aria-busy` + teks sr-only supaya pembaca layar tahu ada proses, sementara
 * skeleton-nya sendiri disembunyikan dari accessibility tree.
 */
export function LoadingRegion({
  label = 'Memuat konten',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div aria-busy="true" role="status" className={cn('relative', className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
