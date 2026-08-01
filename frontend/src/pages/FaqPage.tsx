/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Search, BookOpen, MessageCircle, ArrowRight, ChevronDown, HelpCircle, X, ShieldCheck, Code2, Store, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import { FAQS, GUIDE_STEPS } from '../data';
import { usePageMetadata } from '../lib/seo';
import DeveloperContactDialog from '../components/shared/DeveloperContactDialog';

const stepIcons = [Search, BookOpen, MessageCircle];

const categoryTabs = [
  { id: 'all', label: 'Semua FAQ', icon: <HelpCircle size={15} /> },
  { id: 'transaksi', label: 'Pembeli & Transaksi', icon: <ShieldCheck size={15} /> },
  { id: 'umkm', label: 'Pendaftaran UMKM', icon: <Store size={15} /> },
  { id: 'peta', label: 'Peta & Lokasi', icon: <MapPin size={15} /> },
  { id: 'teknis', label: 'Bantuan Teknikal', icon: <Code2 size={15} /> },
] as const;

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openQuestion, setOpenQuestion] = useState<string | null>(FAQS[0]?.question || null);
  const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);

  const description = 'Panduan lengkap dan FAQ direktori Loning Maju: alur transaksi WhatsApp, cara pendaftaran UMKM Desa Loning, keakuratan peta, dan bantuan teknis.';

  usePageMetadata({
    title: 'Panduan & FAQ — Loning Maju',
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    }
  });

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Group by category when viewing 'all' and no active search query
  const groupedFaqs = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim()) return null;

    const groups: { [key: string]: typeof FAQS } = {};
    filteredFaqs.forEach((faq) => {
      if (!groups[faq.categoryLabel]) {
        groups[faq.categoryLabel] = [];
      }
      groups[faq.categoryLabel].push(faq);
    });
    return Object.entries(groups);
  }, [filteredFaqs, selectedCategory, searchQuery]);

  return (
    <PublicPageShell>
      {/* Header Banner */}
      <header className="mx-auto max-w-3xl px-5 pb-10 pt-20 text-center sm:pt-28">
        <p className="editorial-label">Pusat Informasi & Panduan</p>
        <h1 className="text-balance mt-4 break-words text-4xl font-extrabold tracking-[-0.035em] text-charcoal sm:text-5xl">
          Pertanyaan Umum & Cara Penggunaan Loning Maju
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-warm-gray sm:text-base">
          Temukan jawaban seputar alur pemesanan via WhatsApp, pendaftaran UMKM warga Desa Loning, peta lokasi usaha, hingga bantuan teknis platform.
        </p>

        {/* Live Search Input */}
        <div className="relative mx-auto mt-8 max-w-xl">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-warm-gray/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan... (contoh: transaksi, komisi, pendaftaran, peta)"
              className="focus-ring w-full rounded-2xl border border-sage-border bg-cream-card py-3.5 pl-11 pr-10 text-xs text-charcoal shadow-xs placeholder:text-warm-gray/50 sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-3 rounded-full p-1 text-warm-gray hover:bg-sage-light hover:text-charcoal"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3 Step Quick Guide */}
      <section aria-labelledby="steps-title" className="mx-auto max-w-6xl px-5 pb-16">
        <h2 id="steps-title" className="sr-only">Tiga langkah penggunaan</h2>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-sage-border bg-sage-border md:grid-cols-3 shadow-xs">
          {GUIDE_STEPS.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <article key={step.number} className="bg-cream-card p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-forest/10 text-forest">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs font-bold text-terracotta">{step.number}</span>
                </div>
                <h3 className="mt-6 text-base font-bold text-charcoal sm:text-lg">{step.title}</h3>
                <p className="mt-2 text-xs leading-6 text-warm-gray sm:text-sm">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Main FAQ List Section */}
      <section aria-labelledby="faq-title" className="border-y editorial-rule bg-cream-card">
        <div className="mx-auto max-w-5xl px-5 py-16">
          
          <div className="mb-8 text-center">
            <p className="editorial-label">Hal Yang Sering Ditanyakan</p>
            <h2 id="faq-title" className="mt-2 text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
              Temukan Jawaban Atas Pertanyaan Anda
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            {categoryTabs.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              const count = tab.id === 'all'
                ? FAQS.length
                : FAQS.filter((f) => f.category === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setOpenQuestion(null);
                  }}
                  className={`focus-ring touch-target inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-forest text-white shadow-sm ring-2 ring-forest/20'
                      : 'border border-sage-border bg-white text-warm-gray hover:border-forest/40 hover:text-charcoal shadow-2xs'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-sage-light text-warm-gray'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Render Grouped List or Flat Filtered List */}
          {filteredFaqs.length > 0 ? (
            groupedFaqs ? (
              /* Grouped View for Clean Structure */
              <div className="space-y-10">
                {groupedFaqs.map(([groupLabel, items]) => (
                  <div key={groupLabel} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-sage-border">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-forest">
                        {groupLabel}
                      </span>
                      <span className="text-xs text-warm-gray/60 font-medium">({items.length})</span>
                    </div>

                    <div className="space-y-3">
                      {items.map((item) => {
                        const isOpen = openQuestion === item.question;
                        return (
                          <div
                            key={item.question}
                            className={`rounded-2xl border transition-all overflow-hidden ${
                              isOpen
                                ? 'border-forest/40 bg-white shadow-md ring-1 ring-forest/10'
                                : 'border-sage-border bg-white hover:border-forest/30 shadow-2xs'
                            }`}
                          >
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={() => setOpenQuestion(isOpen ? null : item.question)}
                              className="focus-ring flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-bold text-charcoal hover:text-forest transition-colors"
                            >
                              <span className="min-w-0 leading-snug">{item.question}</span>
                              <div className={`shrink-0 rounded-full p-1 transition-colors ${
                                isOpen ? 'bg-forest/10 text-forest' : 'bg-sage-light text-warm-gray'
                              }`}>
                                <ChevronDown
                                  size={16}
                                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                  aria-hidden="true"
                                />
                              </div>
                            </button>
                            {isOpen && (
                              <div className="border-t border-sage-border/60 bg-cream-card/60 p-5 pt-4 text-xs sm:text-sm leading-relaxed text-warm-gray animate-in fade-in duration-150">
                                <p className="leading-7">{item.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Flat Filtered List (when searching or category selected) */
              <div className="space-y-3">
                {filteredFaqs.map((item) => {
                  const isOpen = openQuestion === item.question;
                  return (
                    <div
                      key={item.question}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isOpen
                          ? 'border-forest/40 bg-white shadow-md ring-1 ring-forest/10'
                          : 'border-sage-border bg-white hover:border-forest/30 shadow-2xs'
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenQuestion(isOpen ? null : item.question)}
                        className="focus-ring flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-bold text-charcoal hover:text-forest transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="shrink-0 rounded-md bg-forest/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-forest">
                            {item.categoryLabel}
                          </span>
                          <span className="min-w-0 leading-snug">{item.question}</span>
                        </div>
                        <div className={`shrink-0 rounded-full p-1 transition-colors ${
                          isOpen ? 'bg-forest/10 text-forest' : 'bg-sage-light text-warm-gray'
                        }`}>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-sage-border/60 bg-cream-card/60 p-5 pt-4 text-xs sm:text-sm leading-relaxed text-warm-gray animate-in fade-in duration-150">
                          <p className="leading-7">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-sage-border bg-white p-12 text-center">
              <HelpCircle size={40} className="mx-auto text-warm-gray/40 mb-3" />
              <h3 className="text-base font-bold text-charcoal">Tidak ada hasil pertanyaan yang cocok</h3>
              <p className="mt-1 text-xs text-warm-gray">
                Coba gunakan kata kunci lain seperti &quot;transaksi&quot;, &quot;pendaftaran&quot;, atau &quot;peta&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="focus-ring touch-target mt-4 rounded-xl bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Tampilkan Semua FAQ
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Bottom Interactive Support Banner */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="overflow-hidden rounded-3xl border border-sage-border bg-charcoal p-8 text-cream-tint sm:p-12 md:flex md:items-center md:justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl">
            <span className="editorial-label text-terracotta">Bantuan & Layanan Developer</span>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Punya Pertanyaan Lain atau Menemukan Kendala?
            </h2>
            <p className="text-xs leading-relaxed text-cream-tint/75 sm:text-sm">
              Tim pengembang platform Loning Maju siap membantu pertanyaan teknis, kendala tampilan, atau konsultasi pendaftaran UMKM.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:mt-0 shrink-0">
            <button
              type="button"
              onClick={() => setIsDevDialogOpen(true)}
              className="focus-ring touch-target flex items-center justify-center gap-2 rounded-xl bg-terracotta px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-terracotta/90 transition-colors shadow-sm"
            >
              <Code2 size={16} />
              <span>Hubungi Developer</span>
            </button>

            <Link
              to="/#featured-products"
              className="focus-ring touch-target flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-colors"
            >
              <span>Jelajahi Produk</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Developer Form Chat Modal */}
      <DeveloperContactDialog
        isOpen={isDevDialogOpen}
        onClose={() => setIsDevDialogOpen(false)}
      />
    </PublicPageShell>
  );
}
