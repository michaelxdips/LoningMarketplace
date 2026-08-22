import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { managementApi } from '../lib/management';
import { ErrorNotice, EmptyPanel, LoadingPanel, PageHeader } from '../components/dashboard/Ui';

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
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
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

  const handleCustomDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    setActivePreset('custom');
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

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="leading-relaxed">
          <strong>Catatan Analytics:</strong> Data ini menunjukkan aktivitas dan upaya inquiry pengunjung di platform. Hubungan transaksi terjadi secara langsung melalui WhatsApp di luar platform.
        </p>
      </div>

      <section className="mb-6 border-t border-charcoal/15 pt-5" aria-label="Filter tanggal">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-forest" />
            <span className="text-sm font-bold text-warm-gray">Rentang Waktu:</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preset rentang tanggal">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handlePresetSelect(days)}
                  className={`focus-ring rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    activePreset === days
                      ? 'bg-forest text-white'
                      : 'bg-cream-bg text-charcoal hover:bg-sage-border/50'
                  }`}
                >
                  {days} Hari
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <label className="text-xs font-bold text-warm-gray">
              Dari
              <input
                id="analytics-from"
                type="date"
                value={from}
                onChange={(e) => handleCustomDateChange(e.target.value, to)}
                className="mt-1 block min-h-11 w-full rounded-xl border border-sage-border px-3 text-sm text-charcoal focus-ring"
              />
            </label>
            <label className="text-xs font-bold text-warm-gray">
              Sampai
              <input
                id="analytics-to"
                type="date"
                value={to}
                onChange={(e) => handleCustomDateChange(from, e.target.value)}
                className="mt-1 block min-h-11 w-full rounded-xl border border-sage-border px-3 text-sm text-charcoal focus-ring"
              />
            </label>
            <button
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="col-span-2 sm:col-auto sm:self-end focus-ring flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sage-border bg-white px-4 text-xs font-bold text-charcoal hover:bg-cream-bg disabled:opacity-50"
              aria-label="Perbarui data"
            >
              <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          </div>
        </div>

        {isInvalidRange && (
          <p className="mt-3 text-xs font-bold text-rose-600">Tanggal awal tidak boleh lebih besar dari tanggal akhir.</p>
        )}
      </section>

      {query.isPending ? (
        <LoadingPanel />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : !data ? (
        <EmptyPanel>Pilih rentang tanggal untuk melihat insight.</EmptyPanel>
      ) : (
        <>
          <section className="mb-8 border-t border-charcoal/15 pt-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
              <div>
                <p className="font-serif text-5xl font-light text-forest">{totalViews}</p>
                <h3 className="mt-2 text-sm font-bold text-charcoal">Tampilan Produk & UMKM</h3>
                <p className="mt-1 text-xs text-warm-gray">{productViews} produk + {umkmViews} UMKM</p>
              </div>

              <div>
                <p className="font-serif text-5xl font-light text-forest">{inquiryStarted}</p>
                <h3 className="mt-2 text-sm font-bold text-charcoal">Dialog Inquiry Dibuka</h3>
                <p className="mt-1 text-xs text-warm-gray">Pengunjung membuka modal WA</p>
              </div>

              <div>
                <p className="font-serif text-5xl font-light text-forest">{messageCopied}</p>
                <h3 className="mt-2 text-sm font-bold text-charcoal">Nomor WA Disalin</h3>
                <p className="mt-1 text-xs text-warm-gray">Pengunjung menyalin nomor kontak</p>
              </div>

              <div>
                <p className="font-serif text-5xl font-light text-forest">{whatsappOpened}</p>
                <h3 className="mt-2 text-sm font-bold text-charcoal">Upaya Buka WA</h3>
                <p className="mt-1 text-xs text-warm-gray">Pengunjung mengklik tombol WA</p>
              </div>
            </div>
          </section>

          <section className="mb-8 border-t border-charcoal/15 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-charcoal">
                  <TrendingUp className="h-5 w-5 text-forest" />
                  Alur Minat Pengunjung (Inquiry Intent Rate)
                </h3>
                <p className="mt-1 text-xs text-warm-gray">
                  Visualisasi konversi alur dari melihat katalog hingga upaya komunikasi WhatsApp.
                </p>
              </div>
              <div className="self-start text-right">
                <p className="text-xs font-bold text-warm-gray">Tingkat Minat (Intent Rate)</p>
                <p className="font-serif text-2xl font-light text-forest">{intentRate}%</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warm-gray">1. Lihat Katalog</span>
                  <span className="text-xs font-extrabold text-charcoal">100%</span>
                </div>
                <p className="mt-2 font-serif text-3xl font-light text-charcoal">{totalViews}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
                  <div className="h-full rounded-full bg-forest" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warm-gray">2. Buka Dialog</span>
                  <span className="text-xs font-extrabold text-forest">{intentRate}%</span>
                </div>
                <p className="mt-2 font-serif text-3xl font-light text-charcoal">{inquiryStarted}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
                  <div className="h-full rounded-full bg-forest" style={{ width: `${Math.min(100, Math.max(0, Number(intentRate)))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warm-gray">3. Salin Kontak</span>
                  <span className="text-xs font-extrabold text-forest">{inquiryStarted ? ((messageCopied / inquiryStarted) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <p className="mt-2 font-serif text-3xl font-light text-charcoal">{messageCopied}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
                  <div className="h-full rounded-full bg-forest" style={{ width: `${inquiryStarted ? Math.min(100, (messageCopied / inquiryStarted) * 100) : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warm-gray">4. Klik WhatsApp</span>
                  <span className="text-xs font-extrabold text-forest">{inquiryStarted ? ((whatsappOpened / inquiryStarted) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <p className="mt-2 font-serif text-3xl font-light text-charcoal">{whatsappOpened}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
                  <div className="h-full rounded-full bg-forest" style={{ width: `${inquiryStarted ? Math.min(100, (whatsappOpened / inquiryStarted) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-x-auto">
            <div className="border-b border-charcoal/25 pb-4">
              <h3 className="font-serif text-lg font-semibold text-charcoal">Rincian Aktivitas per Target</h3>
              <p className="mt-1 text-xs text-warm-gray">Daftar produk dan UMKM dengan aktivitas terbanyak pada periode ini.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-charcoal/15 text-xs font-bold uppercase tracking-wider text-warm-gray">
                  <tr>
                    <th className="p-4 w-12 text-center">Peringkat</th>
                    <th className="p-4">UMKM</th>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Jenis Aktivitas</th>
                    <th className="p-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/10">
                  {data.breakdown.map((row, index) => (
                    <tr key={`${row.umkmId}-${row.productId}-${row.eventType}-${index}`} className="transition-colors hover:bg-cream-tint/40">
                      <td className="p-4 text-center font-extrabold text-xs">
                        <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-terracotta text-white' :
                          index === 1 ? 'bg-forest/15 text-forest' :
                          index === 2 ? 'bg-forest/10 text-forest' :
                          'text-warm-gray'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-charcoal">{row.umkmName ?? '-'}</td>
                      <td className="p-4 text-warm-gray">{row.productName ?? '-'}</td>
                      <td className="p-4 text-warm-gray">
                        <span className="inline-block rounded-lg bg-sage-border/40 px-2.5 py-1 text-xs font-semibold text-charcoal">
                          {eventLabels[row.eventType] ?? row.eventType}
                        </span>
                      </td>
                      <td className="p-4 text-right font-extrabold text-forest">{row.count}</td>
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
