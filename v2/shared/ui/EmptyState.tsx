import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * EmptyState & ErrorState V2.
 *
 * Keduanya WAJIB memberi jalan keluar — kondisi kosong tanpa petunjuk langkah
 * berikutnya dihitung sebagai pekerjaan belum selesai, bukan pilihan desain.
 * Komposisinya editorial (judul serif + hairline), bukan ilustrasi generik.
 */

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  /** Jalan keluar: bersihkan filter, tambah data, kembali ke katalog. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-t border-line py-14 text-center', className)}>
      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Data gagal dimuat',
  description = 'Sambungan ke server terputus. Periksa koneksi internet Anda, lalu coba lagi.',
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    // role="alert" supaya kegagalan diumumkan, tidak hanya terlihat.
    <div role="alert" className={cn('border-t border-danger/30 py-14 text-center', className)}>
      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
