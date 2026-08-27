import { useId, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useOrderDraft } from '@v2-shared/hooks/useOrderDraft';
import { formatPrice } from '@loning/shared/lib/price';
import { buildWhatsAppUrl } from '@v2-shared/lib/whatsapp';
import { Button } from '@v2-shared/ui/Button';

export default function OrderDraftDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const headingId = useId();
  const { items, groups, totalItems, updateQuantity, removeItem, clearUmkm } = useOrderDraft();
  const [buyerName, setBuyerName] = useState('');
  const [buyerNote, setBuyerNote] = useState('');

  if (!isOpen) return null;

  const handleSendWA = (group: (typeof groups)[0]) => {
    let orderLines = group.items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}* (${it.quantity} ${it.unit || 'item'})${
            it.price !== null ? ` — ${formatPrice(it.price * it.quantity)}` : ''
          }`,
      )
      .join('\n');

    let totalSection =
      group.totalPrice > 0 ? `\n\n💰 *Total Estimasi:* ${formatPrice(group.totalPrice)}` : '';

    let buyerSection = buyerName.trim() ? `\n👤 *Nama Pemesan:* ${buyerName.trim()}` : '';
    let noteSection = buyerNote.trim()
      ? `\n📝 *Catatan Tambahan:* ${buyerNote.trim()}`
      : '\n\nApakah pesanan di atas saat ini tersedia / siap dibuatkan?';

    const fullMessage = `Halo Kak (${group.umkmName}), saya ingin memesan produk dari etalase digital Desa Loning:\n\n${orderLines}${totalSection}${buyerSection}${noteSection}\n\nTerima kasih!`;

    const url = buildWhatsAppUrl(group.phone, fullMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-brand" />
            <h2 id={headingId} className="font-display text-base font-semibold text-ink">
              Catatan Pesanan ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup catatan pesanan"
            className="focus-ring-v2 touch-44 inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!items.length ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-ink-muted">
              <ShoppingBag size={36} strokeWidth={1.2} className="text-ink-subtle" />
              <p className="mt-3 text-sm font-medium text-ink">Belum ada produk di catatan</p>
              <p className="mt-1 max-w-xs text-xs text-ink-subtle">
                Buka halaman produk pilihan Anda, lalu klik "Tambah ke Catatan Pesanan" untuk memesan beberapa produk sekaligus.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Optional Buyer Name & Note */}
              <div className="space-y-3 rounded border border-line bg-canvas p-3">
                <div>
                  <label htmlFor="draft-buyer-name" className="block text-xs font-semibold text-ink">
                    Nama Pemesan (Opsional)
                  </label>
                  <input
                    id="draft-buyer-name"
                    type="text"
                    placeholder="Contoh: Ibu Siti"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="focus-ring-v2 mt-1.5 min-h-9 w-full rounded border border-control-border bg-surface px-3 text-xs text-ink placeholder:text-ink-subtle"
                  />
                </div>
                <div>
                  <label htmlFor="draft-buyer-note" className="block text-xs font-semibold text-ink">
                    Catatan Pesanan (Opsional)
                  </label>
                  <input
                    id="draft-buyer-note"
                    type="text"
                    placeholder="Contoh: Tolong bungkus terpisah & jangan pedas"
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    className="focus-ring-v2 mt-1.5 min-h-9 w-full rounded border border-control-border bg-surface px-3 text-xs text-ink placeholder:text-ink-subtle"
                  />
                </div>
              </div>

              {/* Grouped by UMKM */}
              {groups.map((group) => (
                <div key={group.umkmSlug} className="rounded border border-line bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-ink">
                        Toko / Penjual
                      </span>
                      <h3 className="font-display text-sm font-semibold text-ink">{group.umkmName}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearUmkm(group.umkmSlug)}
                      aria-label={`Kosongkan catatan untuk ${group.umkmName}`}
                      className="focus-ring-v2 text-xs text-danger-ink hover:underline"
                    >
                      Hapus semua
                    </button>
                  </div>

                  <div className="divide-y divide-line">
                    {group.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between py-2.5">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="truncate text-xs font-medium text-ink">{it.productName}</p>
                          <p className="text-[11px] text-accent-ink">
                            {it.price !== null ? formatPrice(it.price) : 'Hubungi penjual'}
                            {it.unit ? ` / ${it.unit}` : ''}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, it.quantity - 1)}
                            aria-label={`Kurangi jumlah ${it.productName}`}
                            className="focus-ring-v2 inline-flex h-7 w-7 items-center justify-center rounded border border-control-border text-ink hover:bg-sunken"
                          >
                            <Minus size={12} strokeWidth={1.5} />
                          </button>
                          <span className="w-6 text-center text-xs font-medium text-ink">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, it.quantity + 1)}
                            aria-label={`Tambah jumlah ${it.productName}`}
                            className="focus-ring-v2 inline-flex h-7 w-7 items-center justify-center rounded border border-control-border text-ink hover:bg-sunken"
                          >
                            <Plus size={12} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            aria-label={`Hapus ${it.productName}`}
                            className="focus-ring-v2 ml-1 inline-flex h-7 w-7 items-center justify-center rounded text-ink-subtle hover:text-danger-ink"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Group Subtotal & Action */}
                  <div className="mt-3 border-t border-line pt-3">
                    {group.totalPrice > 0 && (
                      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-ink">
                        <span>Total Estimasi:</span>
                        <span className="font-display text-sm text-accent-ink">{formatPrice(group.totalPrice)}</span>
                      </div>
                    )}
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleSendWA(group)}
                    >
                      Kirim Pesanan ke WhatsApp ({group.items.length} item)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
