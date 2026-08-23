import { cn } from './cn';

/**
 * Eyebrow — label kecil huruf besar di atas judul section.
 *
 * DISIPLIN PEMAKAIAN (aturan anti-slop paling sering dilanggar):
 *   Maksimum 1 eyebrow per 3 section. Kalau section A punya eyebrow, dua
 *   section berikutnya tidak boleh punya. UI lama punya 91 kemunculan pola
 *   `uppercase tracking` — itu justru yang membuatnya terasa templated.
 *   Batas ini tidak bisa dipaksakan oleh komponen; ia dijaga saat menyusun
 *   halaman, dan diperiksa lewat hitungan mekanis di audit anti-slop.
 *
 * Warna memakai `accent-ink` (6.61:1 di canvas), bukan `accent` mentah
 * (4.01:1 — gagal untuk teks kecil).
 */
export function Eyebrow({ className, children }: { className?: string; children: string }) {
  return (
    <p className={cn('flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink', className)}>
      <span aria-hidden="true" className="h-px w-8 bg-accent-ink/50" />
      {children}
    </p>
  );
}

/**
 * Angka editorial besar (01 / 02 / 03) — pengganti "icon-topper tile".
 * Ini pola pengganti langsung untuk grid tiga kartu ber-ikon yang dilarang.
 */
export function EditorialNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('font-display text-5xl font-light leading-none text-accent-ink/70', className)}>
      {value}
    </span>
  );
}
