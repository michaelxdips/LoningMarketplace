import { useState } from 'react';
import { cn } from './cn';

/**
 * MediaImage V2.
 *
 * Tiga hal yang ditegakkan di satu tempat supaya tidak terlupa per halaman:
 *   1. Rasio aspek dipesan lewat wrapper -> mencegah CLS (target < 0.1).
 *   2. Gagal muat TIDAK meninggalkan ikon "broken image": jatuh ke permukaan
 *      sunken polos. Foto UMKM sering berasal dari URL eksternal lama.
 *   3. alt wajib diisi pemakai. Untuk gambar dekoratif kirim alt="" secara
 *      sadar; tidak ada nilai default yang menyamarkan alt yang lupa ditulis.
 */
export function MediaImage({
  src,
  alt,
  ratio = 'aspect-[4/3]',
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  ratio?: string;
  className?: string;
  /** true untuk gambar di atas lipatan (hero) supaya tidak di-lazy-load. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={cn('relative overflow-hidden bg-sunken', ratio, className)}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : undefined}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}
