import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, RefreshCw, TrendingUp } from 'lucide-react';
import { managementApi } from '@loning/shared/lib/management';
import { ErrorNotice, EmptyPanel, LoadingPanel, PageHeader } from './Ui';
import { cn } from '@v2-shared/ui/cn';

/**
 * Insight inquiry V2 — pasangan fitur dari InquiryAnalyticsPage UI lama.
 * Preset rentang tanggal, angka serif, alur minat (intent rate), tabel rincian.
 */
const eventLabels: Record<string, string> = {
  umkm_view: 'Detail UMKM',
  product_view: 'Detail Produk',
  inquiry_started: 'Dialog Inquiry Dibuka',
  message_copied: 'Nomor WhatsApp Disalin',
  whatsapp_opened: 'Upaya Membuka WhatsApp',
};

const getPresetDates = (days: number) => {
  const toDate = new Date();
  const fromDate = new Date(toDate.getTime() - days * 86_400_000);
  return { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) };
};

export default function InquiryAnalyticsPage() {
  const initial = getPresetDates(30);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [activePreset, setActivePreset] = useState<number | 'custom'>(30);

  const handlePresetSelect = (days: number) => {
    const preset = getPresetDates(days);
    setFrom(preset.from);
    setTo(preset.to);
    setActivePreset(days);
  };

  const query = useQuery({
    queryKey: ['admin', 'analytics', from, to],
    queryFn: ({ signal }) => managementApi.analytics.get(from, to, signal),
    enabled: Boolean(from && to && from <= to),
  });

  const data = query.data;
  const isInvalidRange = Boolean(from && to && from > to);

  const productViews = data?.totals?.product_view ?? 0;
  const umkmViews = data?.totals?.umkm_view ?? 0;
  const inquiryStarted = data?.totals?.inquiry_started ?? 0;
  const messageCopied = data?.totals?.message_copied ?? 0;
  const whatsappOpened = data?.totals?.whatsapp_opened ?? 0;
  const totalViews = productViews + umkmViews;
  const intentRate = totalViews > 0 ? ((inquiryStarted / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <>
      <PageHeader
        title="Insight inquiry"
        description="Indikator penggunaan katalog dan upaya menghubungi UMKM. Tidak mengukur pesan terkirim atau penjualan."
      />

      <div className="mb-6 flex items-start gap-3 border border-warning-ink/40 bg-sunken p-4 text-sm text-warning-ink">
        <AlertCircle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>Catatan Analytics:</strong> Data ini menunjukkan aktivitas dan upaya inquiry pengunjung
          di platform. Hubungan transaksi terjadi secara langsung melalui WhatsApp di luar platform.
        </p>
      </div>

      <section className="mb-6 border-t border-line pt-5" aria-label="Filter tanggal">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar size={18} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-muted">Rentang Waktu:</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preset rentang tanggal">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handlePresetSelect(days)}
                  className={cn(
                    'focus-ring-v2 min-h-11 rounded-control border px-3 py-1.5 text-sm font-medium transition-colors',
                    activePreset === days ? 'border-brand bg-brand text-on-brand' : 'border-control-border text-ink hover:bg-sunken',
                  )}
                >
                  {days} Hari
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <label className="text-sm font-medium text-ink-muted">
              Dari
              <input
                id="analytics-from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setActivePreset('custom');
                }}
                className="focus-ring-v2 mt-1 block min-h-11 w-full rounded-control border border-control-border bg-surface px-3 text-sm text-ink"
              />
            </label>
            <label className="text-sm font-medium text-ink-muted">
              Sampai
              <input
                id="analytics-to"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setActivePreset('custom');
                }}
                className="focus-ring-v2 mt-1 block min-h-11 w-full rounded-control border border-control-border bg-surface px-3 text-sm text-ink"
              />
            </label>
            <button
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="focus-ring-v2 col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink hover:bg-sunken disabled:opacity-50 sm:col-auto sm:self-end"
              aria-label="Perbarui data"
            >
              <RefreshCw size={15} strokeWidth={1.5} className={query.isFetching ? 'animate-spin' : ''} aria-hidden="true" />
              Segarkan
            </button>
          </div>
        </div>

        {isInvalidRange && <p className="mt-3 text-sm font-medium text-danger-ink">Tanggal awal tidak boleh lebih besar dari tanggal akhir.</p>}
      </section>

      {query.isPending ? (
        <LoadingPanel />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : !data ? (
        <EmptyPanel>Pilih rentang tanggal untuk melihat insight.</EmptyPanel>
      ) : (
        <>
          <section className="mb-8 border-t border-line pt-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
              <Stat value={totalViews} label="Tampilan Produk & UMKM" sub={`${productViews} produk + ${umkmViews} UMKM`} />
              <Stat value={inquiryStarted} label="Dialog Inquiry Dibuka" sub="Pengunjung membuka modal WA" />
              <Stat value={messageCopied} label="Nomor WA Disalin" sub="Pengunjung menyalin nomor kontak" />
              <Stat value={whatsappOpened} label="Upaya Buka WA" sub="Pengunjung mengklik tombol WA" />
            </div>
          </section>

          <section className="mb-8 border-t border-line pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <TrendingUp size={18} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
                  Alur Minat Pengunjung (Inquiry Intent Rate)
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Visualisasi konversi alur dari melihat katalog hingga upaya komunikasi WhatsApp.
                </p>
              </div>
              <div className="self-start text-right">
                <p className="text-xs font-medium text-ink-muted">Tingkat Minat (Intent Rate)</p>
                <p className="numeric font-display text-2xl font-light text-brand">{intentRate}%</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-4">
              <FunnelStep index="1" label="Lihat Katalog" value={totalViews} width="100%" />
              <FunnelStep index="2" label="Buka Dialog" value={inquiryStarted} width={`${Math.min(100, Math.max(0, Number(intentRate)))}%`} />
              <FunnelStep
                index="3"
                label="Salin Kontak"
                value={messageCopied}
                width={`${inquiryStarted ? Math.min(100, (messageCopied / inquiryStarted) * 100) : 0}%`}
              />
              <FunnelStep
                index="4"
                label="Klik WhatsApp"
                value={whatsappOpened}
                width={`${inquiryStarted ? Math.min(100, (whatsappOpened / inquiryStarted) * 100) : 0}%`}
              />
            </div>
          </section>

          <section className="overflow-x-auto">
            <div className="border-b border-line-strong pb-4">
              <h3 className="font-display text-lg font-semibold text-ink">Rincian Aktivitas per Target</h3>
              <p className="mt-1 text-xs text-ink-muted">Daftar produk dan UMKM dengan aktivitas terbanyak pada periode ini.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  <tr>
                    <th className="w-12 p-4 text-center">Peringkat</th>
                    <th className="p-4">UMKM</th>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Jenis Aktivitas</th>
                    <th className="p-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.breakdown.map((row, index) => (
                    <tr key={`${row.umkmId}-${row.productId}-${row.eventType}-${index}`} className="transition-colors hover:bg-sunken/50">
                      <td className="p-4 text-center">
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full text-xs font-medium text-ink">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-ink">{row.umkmName ?? '-'}</td>
                      <td className="p-4 text-ink-muted">{row.productName ?? '-'}</td>
                      <td className="p-4 text-ink-muted">
                        <span className="inline-block rounded-sm bg-sunken px-2.5 py-1 text-xs font-medium text-ink">
                          {eventLabels[row.eventType] ?? row.eventType}
                        </span>
                      </td>
                      <td className="numeric p-4 text-right font-medium text-brand">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!data.breakdown.length && <EmptyPanel>Belum ada aktivitas tercatat pada rentang waktu ini.</EmptyPanel>}
          </section>
        </>
      )}
    </>
  );
}

function Stat({ value, label, sub }: { value: number; label: string; sub: string }) {
  return (
    <div>
      <p className="numeric font-display text-5xl font-light text-brand">{value}</p>
      <h3 className="mt-2 text-sm font-medium text-ink">{label}</h3>
      <p className="mt-1 text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

function FunnelStep({ index, label, value, width }: { index: string; label: string; value: number; width: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">
          {index}. {label}
        </span>
      </div>
      <p className="numeric mt-2 font-display text-3xl font-light text-ink">{value}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-brand" style={{ width }} />
      </div>
    </div>
  );
}
