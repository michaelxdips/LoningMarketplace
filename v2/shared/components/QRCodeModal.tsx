import { useId, useMemo } from 'react';
import { Download, Printer, QrCode, X } from 'lucide-react';
import { generateQRCodeSVG } from '@v2-shared/lib/qrcode';
import { Button } from '@v2-shared/ui/Button';

export default function QRCodeModal({
  isOpen,
  onClose,
  title,
  subtitle,
  url,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url: string;
}) {
  const headingId = useId();
  const svgContent = useMemo(() => generateQRCodeSVG(url, { size: 240 }), [url]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `qrcode-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak QR Code — ${title}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; margin: 0; padding: 20px; }
            .card { border: 2px solid #123E25; border-radius: 12px; padding: 32px; max-width: 380px; width: 100%; box-sizing: border-box; }
            h1 { font-size: 20px; margin: 0 0 8px; color: #123E25; }
            p { font-size: 13px; color: #555; margin: 0 0 24px; }
            .footer { font-size: 11px; color: #888; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${title}</h1>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
            <div>${svgContent}</div>
            <div class="footer">Katalog Digital UMKM Desa Loning</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      <div className="relative w-full max-w-sm border border-line bg-surface p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog QR Code"
          className="focus-ring-v2 touch-44 absolute right-3 top-3 inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2 text-brand">
          <QrCode size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">
            QR Code Etalase
          </span>
        </div>

        <h2 id={headingId} className="mt-2 font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>}

        <div className="my-6 flex justify-center rounded border border-line bg-canvas p-4" dangerouslySetInnerHTML={{ __html: svgContent }} />

        <p className="text-center text-[11px] text-ink-subtle">
          Arahkan kamera HP ke kode QR di atas untuk membuka halaman profil ini secara langsung.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" leadingIcon={<Download size={14} />} onClick={handleDownload}>
            Unduh SVG
          </Button>
          <Button variant="primary" leadingIcon={<Printer size={14} />} onClick={handlePrint}>
            Cetak
          </Button>
        </div>
      </div>
    </div>
  );
}
