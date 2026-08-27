import { useEffect, useId, useState } from 'react';
import { Download, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { Button } from '@v2-shared/ui/Button';

export default function StoryCardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  priceText,
  imageUrl,
  sellerName,
  phone,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  priceText?: string | null;
  imageUrl?: string | null;
  sellerName?: string | null;
  phone?: string | null;
}) {
  const headingId = useId();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDataUrl(null);
      return;
    }

    setIsGenerating(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background Heritage Forest & Cream Palette
    ctx.fillStyle = '#123E25'; // Forest Green
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative inner border
    ctx.strokeStyle = '#C85C32'; // Terracotta
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, 1000, 1840);

    // Subtle header badge
    ctx.fillStyle = '#FCFAF7'; // Cream
    ctx.font = '600 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LONING MAJU • ETALASE UMKM DESA LONING', 540, 130);

    // Divider line
    ctx.strokeStyle = 'rgba(252, 250, 247, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 170);
    ctx.lineTo(980, 170);
    ctx.stroke();

    // 2. Product Image or Placeholder
    const drawContent = (img?: HTMLImageElement) => {
      if (img) {
        // Rounded image container
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(100, 240, 880, 880, 24);
        ctx.clip();
        ctx.drawImage(img, 100, 240, 880, 880);
        ctx.restore();
      } else {
        // Fallback pattern
        ctx.fillStyle = '#1B4D31';
        ctx.beginPath();
        ctx.roundRect(100, 240, 880, 880, 24);
        ctx.fill();
        ctx.fillStyle = '#FCFAF7';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Katalog Loning', 540, 680);
      }

      // 3. Information Card (Cream Background)
      ctx.fillStyle = '#FCFAF7';
      ctx.beginPath();
      ctx.roundRect(100, 1180, 880, 560, 24);
      ctx.fill();

      // Title
      ctx.fillStyle = '#123E25';
      ctx.font = 'bold 56px serif';
      ctx.textAlign = 'left';
      const truncatedTitle = title.length > 32 ? title.slice(0, 30) + '...' : title;
      ctx.fillText(truncatedTitle, 150, 1280);

      // Subtitle / Seller
      ctx.fillStyle = '#666666';
      ctx.font = '500 36px sans-serif';
      const providerLabel = sellerName ? `Oleh ${sellerName}` : subtitle || 'Produk Unggulan Desa Loning';
      ctx.fillText(providerLabel, 150, 1340);

      // Price Tag (if available)
      if (priceText) {
        ctx.fillStyle = '#C85C32';
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText(priceText, 150, 1430);
      }

      // WhatsApp Contact Box
      ctx.fillStyle = '#123E25';
      ctx.beginPath();
      ctx.roundRect(150, 1500, 780, 180, 16);
      ctx.fill();

      ctx.fillStyle = '#FCFAF7';
      ctx.font = '600 34px sans-serif';
      ctx.fillText('Pesan Sekarang Langsung via WhatsApp:', 190, 1565);

      ctx.fillStyle = '#FCFAF7'; // Clean cream
      ctx.font = 'bold 44px monospace';
      ctx.fillText(phone || 'Hubungi Kontak di Katalog', 190, 1630);

      // Footer
      ctx.fillStyle = 'rgba(252, 250, 247, 0.7)';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Kunjungi direktori: loning.desa.id', 540, 1820);

      setDataUrl(canvas.toDataURL('image/png'));
      setIsGenerating(false);
    };

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawContent(img);
      img.onerror = () => drawContent();
      img.src = imageUrl;
    } else {
      drawContent();
    }
  }, [isOpen, title, subtitle, priceText, imageUrl, sellerName, phone]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `story-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-sm flex-col border border-line bg-surface p-5 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pembuat kartu promosi"
          className="focus-ring-v2 touch-44 absolute right-3 top-3 inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2 text-brand">
          <Sparkles size={18} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
            Status WA / Story Promosi
          </span>
        </div>

        <h2 id={headingId} className="mt-1 font-display text-base font-semibold text-ink">
          Kartu Grafis 9:16 Siap Unduh
        </h2>

        {/* Preview Container */}
        <div className="my-4 flex flex-1 items-center justify-center overflow-hidden rounded border border-line bg-black/40 p-2">
          {dataUrl ? (
            <img src={dataUrl} alt="Preview Kartu Story" className="max-h-[50vh] w-auto rounded object-contain shadow" />
          ) : (
            <div className="flex h-64 w-full flex-col items-center justify-center text-ink-muted">
              <ImageIcon size={32} className="animate-pulse text-brand" />
              <span className="mt-2 text-xs">Membuat grafis beresolusi tinggi...</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!dataUrl || isGenerating}
            leadingIcon={<Download size={14} />}
            onClick={handleDownload}
          >
            Unduh Gambar
          </Button>
        </div>
      </div>
    </div>
  );
}
