import { useState } from 'react';
import { ImagePlus, Star, Trash2, Upload } from 'lucide-react';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { cn } from '@v2-shared/ui/cn';

/**
 * GalleryManager V2 — pasangan fitur dari GalleryManager UI lama.
 *
 * Galeri multi-foto produk (maks 5), gambar pertama otomatis cover. Styling
 * editorial: sudut tajam, hairline, tanpa gradient hover.
 */
export interface GalleryEntry {
  id: string;
  url: string;
  thumbUrl: string;
  altText: string | null;
}

interface GalleryManagerProps {
  images: GalleryEntry[];
  maxImages?: number;
  onAdd: (file: File) => Promise<GalleryEntry | null>;
  onRemove: (imageId: string) => Promise<void>;
  onSetPrimary: (imageId: string) => Promise<void>;
  disabled?: boolean;
}

export default function GalleryManager({ images, maxImages = 5, onAdd, onRemove, onSetPrimary, disabled }: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (images.length >= maxImages) return;
    setUploading(true);
    setUploadError(null);
    try {
      await onAdd(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
          Galeri Produk ({images.length}/{maxImages})
        </span>
        {images.length < maxImages && (
          <label
            className={cn(
              'focus-ring-v2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control border border-dashed border-control-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand hover:bg-sunken',
              disabled || uploading ? 'pointer-events-none opacity-50' : '',
            )}
          >
            <ImagePlus size={14} strokeWidth={1.5} aria-hidden="true" />
            Tambah Gambar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      {uploadError ? <p className="text-sm text-danger-ink" role="alert">{uploadError}</p> : null}

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed border-control-border bg-sunken p-6 text-center">
          <ImagePlus size={24} strokeWidth={1.5} className="text-ink-subtle" aria-hidden="true" />
          <p className="text-sm text-ink-muted">Belum ada gambar di galeri</p>
          <label
            className={cn(
              'focus-ring-v2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover',
              disabled ? 'pointer-events-none opacity-50' : '',
            )}
          >
            <Upload size={14} strokeWidth={1.5} aria-hidden="true" />
            Upload Gambar Pertama
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={cn('group relative overflow-hidden border-2', i === 0 ? 'border-brand' : 'border-line')}
            >
              <MediaImage src={img.url} alt={img.altText || `Gambar ${i + 1}`} ratio="aspect-square" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 py-0.5 text-xs font-medium text-on-brand">Cover</span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-2">
                {i > 0 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void onSetPrimary(img.id)}
                    title="Jadikan cover"
                    className="focus-ring-v2 touch-44 inline-flex items-center justify-center rounded-control border border-control-border bg-surface p-1.5 text-ink transition-colors hover:bg-sunken disabled:opacity-50"
                  >
                    <Star size={14} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void onRemove(img.id)}
                  title="Hapus gambar"
                  className="focus-ring-v2 touch-44 inline-flex items-center justify-center rounded-control border border-danger/40 bg-surface p-1.5 text-danger-ink transition-colors hover:bg-sunken disabled:opacity-50"
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-ink-subtle">
        Gambar pertama otomatis menjadi cover. Maks {maxImages} gambar, format JPEG/PNG/WebP.
      </p>
    </div>
  );
}
