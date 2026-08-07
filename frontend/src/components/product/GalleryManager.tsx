import { useState } from 'react';
import { ImagePlus, Star, Trash2, Upload } from 'lucide-react';
import { ProductImage } from './ProductImage';

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

  const primaryIndex = images.findIndex((img) => images.length === 1 || img.id === images[0]?.id) >= 0 ? 0 : -1;

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
        <span className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray">
          Galeri Produk ({images.length}/{maxImages})
        </span>
        {images.length < maxImages && (
          <label className={`focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-forest/40 px-3 py-1.5 text-[10px] font-bold text-forest transition-colors hover:border-forest hover:bg-forest/5 ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <ImagePlus size={12} />
            Tambah Gambar
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled || uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
          </label>
        )}
      </div>

      {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-sage-border bg-cream-tint p-6 text-center">
          <ImagePlus size={28} className="text-warm-gray/50" />
          <p className="text-xs text-warm-gray">Belum ada gambar di galeri</p>
          <label className={`focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-[10px] font-bold text-white transition-colors hover:bg-forest-hover ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload size={12} />
            Upload Gambar Pertama
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={img.id} className={`group relative overflow-hidden rounded-xl border-2 transition-colors ${i === 0 ? 'border-forest/60 bg-forest/5' : 'border-sage-border bg-cream-card'}`}>
              <ProductImage src={img.url} alt={img.altText || `Gambar ${i + 1}`} className="aspect-square w-full object-cover" />
              {i === 0 && <span className="absolute top-2 left-2 rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-charcoal/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {i > 0 && (
                  <button type="button" disabled={disabled} onClick={() => onSetPrimary(img.id)} title="Jadikan cover" className="rounded bg-white/90 p-1 text-forest transition-colors hover:bg-white">
                    <Star size={12} />
                  </button>
                )}
                <button type="button" disabled={disabled} onClick={() => onRemove(img.id)} title="Hapus gambar" className="rounded bg-white/90 p-1 text-red-600 transition-colors hover:bg-white">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-warm-gray/70">Gambar pertama otomatis menjadi cover. Maks {maxImages} gambar, format JPEG/PNG/WebP.</p>
    </div>
  );
}
