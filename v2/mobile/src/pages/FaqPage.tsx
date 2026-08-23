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

/**
 * FAQ V2 mobile — accordion satu kolom, search + filter kategori.
 */
const CATEGORY_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'umkm', label: 'Pendaftaran' },
  { id: 'peta', label: 'Peta' },
  { id: 'teknis', label: 'Teknis' },
] as const;

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openQuestion, setOpenQuestion] = useState<string | null>(FAQS[0]?.question ?? null);
  const [devDialogOpen, setDevDialogOpen] = useState(false);

  const description = 'Panduan lengkap dan FAQ direktori Loning Maju: alur transaksi WhatsApp, cara pendaftaran UMKM Desa Loning, keakuratan peta, dan bantuan teknis.';
  usePageMetadata({ title: 'Panduan & FAQ — Loning Maju', description, jsonLd: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) } });

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const groupedFaqs = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim()) return null;
    const groups: Record<string, typeof FAQS> = {};
    for (const faq of filteredFaqs) (groups[faq.categoryLabel] ??= []).push(faq);
    return Object.entries(groups);
  }, [filteredFaqs, selectedCategory, searchQuery]);

  return (
    <>
      <div className="px-4 pb-6 pt-8">
        <Eyebrow>Pusat informasi & panduan</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance">Pertanyaan umum & cara penggunaan</h1>

        <div className="relative mt-5">
          <label htmlFor="m-faq-search" className="sr-only">Cari pertanyaan</label>
          <Search size={18} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            id="m-faq-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari pertanyaan…"
            className="focus-ring-v2 min-h-12 w-full rounded-control border border-control-border bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-subtle"
          />
          {searchQuery ? (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="Hapus kata kunci pencarian" className="focus-ring-v2 touch-44 absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-control text-ink-muted hover:bg-sunken hover:text-ink">
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Langkah */}
      <section aria-labelledby="steps-title" className="border-b border-line px-4 py-8">
        <h2 id="steps-title" className="sr-only">Tiga langkah penggunaan</h2>
        <div className="grid gap-px border border-line bg-line">
          {GUIDE_STEPS.map((step) => (
            <article key={step.number} className="bg-surface p-5">
              <EditorialNumber value={step.number} />
              <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="border-b border-line px-4 py-8">
        <Eyebrow>Hal yang sering ditanyakan</Eyebrow>
        <h2 id="faq-title" className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">Temukan jawaban Anda</h2>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => { setSelectedCategory(tab.id); setOpenQuestion(null); }} aria-pressed={isSelected} className={cn('focus-ring-v2 min-h-11 shrink-0 rounded-control border px-4 text-sm transition-colors', isSelected ? 'border-brand bg-brand text-on-brand' : 'border-control-border text-ink hover:bg-sunken')}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {filteredFaqs.length === 0 ? (
          <EmptyState className="mt-6" title="Tidak ada pertanyaan yang cocok" description="Coba kata kunci lain atau pilih kategori lain." action={<Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>Tampilkan semua FAQ</Button>} />
        ) : groupedFaqs ? (
          <div className="mt-6 space-y-6">
            {groupedFaqs.map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <div className="border-b border-line pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">{groupLabel} ({items.length})</div>
                <FaqAccordion items={items} openQuestion={openQuestion} onToggle={setOpenQuestion} />
              </div>
            ))}
          </div>
        ) : (
          <FaqAccordion items={filteredFaqs} openQuestion={openQuestion} onToggle={setOpenQuestion} />
        )}
      </section>

      {/* Banner developer */}
      <section className="px-4 py-10">
        <div className="bg-brand px-6 py-10 text-on-brand">
          <Eyebrow className="text-accent-ink">Bantuan developer</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Punya pertanyaan lain atau menemukan kendala?</h2>
          <p className="mt-3 text-sm leading-relaxed text-on-brand/80">Tim pengembang platform siap membantu pertanyaan teknis, kendala tampilan, atau konsultasi pendaftaran UMKM.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="accent" size="lg" onClick={() => setDevDialogOpen(true)}>Hubungi Developer</Button>
            <ButtonLink to="/m/produk" variant="outline" size="lg">Jelajahi Produk</ButtonLink>
          </div>
        </div>
      </section>

      <DeveloperContactDialog isOpen={devDialogOpen} onClose={() => setDevDialogOpen(false)} />
    </>
  );
}

function FaqAccordion({ items, openQuestion, onToggle }: { items: typeof FAQS; openQuestion: string | null; onToggle: (q: string | null) => void }) {
  return (
    <div className="mt-2">
      {items.map((item) => {
        const isOpen = openQuestion === item.question;
        return (
          <div key={item.question} className="border-b border-line">
            <button type="button" aria-expanded={isOpen} onClick={() => onToggle(isOpen ? null : item.question)} className="focus-ring-v2 flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left text-base text-ink">
              <span className="min-w-0 leading-snug">{item.question}</span>
              <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" className={cn('shrink-0 text-ink-subtle transition-transform duration-200', isOpen && 'rotate-180')} />
            </button>
            {isOpen ? <div className="pb-4 text-sm leading-7 text-ink-muted"><p>{item.answer}</p></div> : null}
          </div>
        );
      })}
    </div>
  );
}
