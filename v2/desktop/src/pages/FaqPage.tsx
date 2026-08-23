import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { FAQS, GUIDE_STEPS } from '@loning/shared/content/faq';
import { usePageMetadata } from '@loning/shared/lib/seo';
import { Button } from '@v2-shared/ui/Button';
import { ButtonLink } from '@v2-shared/ui/ButtonLink';
import { EmptyState } from '@v2-shared/ui/EmptyState';
import { Eyebrow, EditorialNumber } from '@v2-shared/ui/Eyebrow';
import { cn } from '@v2-shared/ui/cn';
import DeveloperContactDialog from '@v2-shared/components/DeveloperContactDialog';

const CATEGORY_TABS = [
  { id: 'all', label: 'Semua FAQ' },
  { id: 'transaksi', label: 'Pembeli & Transaksi' },
  { id: 'umkm', label: 'Pendaftaran UMKM' },
  { id: 'peta', label: 'Peta & Lokasi' },
  { id: 'teknis', label: 'Bantuan Teknikal' },
] as const;

/**
 * FAQ V2 — pasangan fitur dari /faq UI lama.
 *
 * Layout SENGAJA berbeda dari UI lama (tidak ada ikon-topper pada setiap tab,
 * kartu tanpa shadow): search -> langkah penggunaan (angka editorial) ->
 * accordion FAQ -> banner kontak developer.
 */
export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openQuestion, setOpenQuestion] = useState<string | null>(FAQS[0]?.question ?? null);
  const [devDialogOpen, setDevDialogOpen] = useState(false);

  const description =
    'Panduan lengkap dan FAQ direktori Loning Maju: alur transaksi WhatsApp, cara pendaftaran UMKM Desa Loning, keakuratan peta, dan bantuan teknis.';

  usePageMetadata({
    title: 'Panduan & FAQ — Loning Maju',
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  });

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const groupedFaqs = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim()) return null;
    const groups: Record<string, typeof FAQS> = {};
    for (const faq of filteredFaqs) {
      (groups[faq.categoryLabel] ??= []).push(faq);
    }
    return Object.entries(groups);
  }, [filteredFaqs, selectedCategory, searchQuery]);

  return (
    <>
      {/* Header */}
      <div className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-16 lg:px-10">
          <div className="max-w-3xl">
            <Eyebrow>Pusat informasi & panduan</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-ink text-balance md:text-5xl">
              Pertanyaan umum & cara penggunaan
            </h1>
            <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-ink-muted">
              Temukan jawaban seputar alur pemesanan via WhatsApp, pendaftaran UMKM warga Desa
              Loning, peta lokasi usaha, hingga bantuan teknis platform.
            </p>

            <div className="relative mt-8 max-w-xl">
              <label htmlFor="v2-faq-search" className="sr-only">
                Cari pertanyaan
              </label>
              <Search
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                id="v2-faq-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari pertanyaan… (contoh: transaksi, pendaftaran, peta)"
                className="focus-ring-v2 min-h-11 w-full rounded-control border border-control-border bg-surface pl-11 pr-11 text-base text-ink placeholder:text-ink-subtle"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus kata kunci pencarian"
                  className="focus-ring-v2 touch-44 absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-control text-ink-muted hover:bg-sunken hover:text-ink"
                >
                  <X size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Langkah penggunaan */}
      <section aria-labelledby="steps-title" className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <h2 id="steps-title" className="sr-only">
            Tiga langkah penggunaan
          </h2>
          <div className="grid gap-px border border-line bg-line md:grid-cols-3">
            {GUIDE_STEPS.map((step) => (
              <article key={step.number} className="bg-surface p-8">
                <EditorialNumber value={step.number} />
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          <div className="max-w-3xl">
            <Eyebrow>Hal yang sering ditanyakan</Eyebrow>
            <h2 id="faq-title" className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Temukan jawaban atas pertanyaan Anda
            </h2>
          </div>

          {/* Filter kategori */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              const count =
                tab.id === 'all' ? FAQS.length : FAQS.filter((f) => f.category === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setOpenQuestion(null);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    'focus-ring-v2 min-h-11 rounded-control border px-4 text-sm transition-colors',
                    isSelected
                      ? 'border-brand bg-brand text-on-brand'
                      : 'border-control-border text-ink hover:bg-sunken',
                  )}
                >
                  {tab.label}
                  <span className={cn('ml-1.5', isSelected ? 'text-on-brand/70' : 'text-ink-subtle')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredFaqs.length === 0 ? (
            <EmptyState
              className="mt-10"
              title="Tidak ada pertanyaan yang cocok"
              description={'Coba kata kunci lain seperti "transaksi", "pendaftaran", atau "peta".'}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Tampilkan semua FAQ
                </Button>
              }
            />
          ) : groupedFaqs ? (
            <div className="mt-10 space-y-10">
              {groupedFaqs.map(([groupLabel, items]) => (
                <div key={groupLabel}>
                  <div className="flex items-center gap-2 border-b border-line pb-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                      {groupLabel}
                    </span>
                    <span className="text-sm text-ink-subtle">({items.length})</span>
                  </div>
                  <FaqAccordion items={items} openQuestion={openQuestion} onToggle={setOpenQuestion} />
                </div>
              ))}
            </div>
          ) : (
            <FaqAccordion items={filteredFaqs} openQuestion={openQuestion} onToggle={setOpenQuestion} />
          )}
        </div>
      </section>

      {/* Banner kontak developer */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
        <div className="bg-brand px-8 py-12 text-on-brand md:flex md:items-center md:justify-between md:gap-8">
          <div className="max-w-xl">
            <Eyebrow className="text-accent-ink">Bantuan & layanan developer</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Punya pertanyaan lain atau menemukan kendala?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-on-brand/80">
              Tim pengembang platform Loning Maju siap membantu pertanyaan teknis, kendala tampilan,
              atau konsultasi pendaftaran UMKM.
            </p>
          </div>
          <div className="mt-6 flex shrink-0 flex-col gap-3 sm:flex-row md:mt-0">
            <Button
              variant="accent"
              size="lg"
              onClick={() => setDevDialogOpen(true)}
            >
              Hubungi Developer
            </Button>
            <ButtonLink to="/v2/produk" variant="outline" size="lg">
              Jelajahi Produk
            </ButtonLink>
          </div>
        </div>
      </section>

      <DeveloperContactDialog isOpen={devDialogOpen} onClose={() => setDevDialogOpen(false)} />
    </>
  );
}

function FaqAccordion({
  items,
  openQuestion,
  onToggle,
}: {
  items: typeof FAQS;
  openQuestion: string | null;
  onToggle: (question: string | null) => void;
}) {
  return (
    <div className="mt-3">
      {items.map((item) => {
        const isOpen = openQuestion === item.question;
        return (
          <div key={item.question} className="border-b border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => onToggle(isOpen ? null : item.question)}
              className="focus-ring-v2 flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left text-base text-ink transition-colors hover:text-brand"
            >
              <span className="min-w-0 leading-snug">{item.question}</span>
              <ChevronDown
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
                className={cn('shrink-0 text-ink-subtle transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </button>
            {isOpen ? (
              <div className="pb-5 text-sm leading-7 text-ink-muted">
                <p>{item.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
