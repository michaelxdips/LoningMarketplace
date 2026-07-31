import { useState } from 'react';
import { Search, BookOpen, MessageCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import { FAQS, GUIDE_STEPS } from '../data';
import { usePageMetadata } from '../lib/seo';

const icons = [Search, BookOpen, MessageCircle];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const description = 'Panduan menggunakan direktori Loning Maju dan jawaban tentang cara menghubungi pelaku UMKM Desa Loning.';

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

  return (
    <PublicPageShell>
      <header className="mx-auto max-w-3xl px-5 pb-14 pt-20 text-center sm:pt-28">
        <p className="editorial-label">Panduan Pengunjung</p>
        <h1 className="text-balance mt-4 break-words text-4xl font-extrabold tracking-[-0.035em] text-charcoal sm:text-6xl">
          Menemukan usaha lokal, tanpa alur yang rumit.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-warm-gray sm:text-base">
          Loning Maju adalah direktori. Temukan informasi, kenali pelaku usaha, lalu lanjutkan percakapan langsung melalui WhatsApp.
        </p>
      </header>

      <section aria-labelledby="steps-title" className="mx-auto max-w-6xl px-5 pb-20">
        <h2 id="steps-title" className="sr-only">Tiga langkah penggunaan</h2>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-sage-border bg-sage-border md:grid-cols-3">
          {GUIDE_STEPS.map((step, index) => {
            const Icon = icons[index];
            return (
              <article key={step.number} className="bg-cream-card p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <Icon size={22} className="text-forest" aria-hidden="true"/>
                  <span className="font-mono text-xs font-bold text-terracotta">{step.number}</span>
                </div>
                <h3 className="mt-10 text-lg font-bold text-charcoal">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-warm-gray">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="faq-title" className="border-y editorial-rule bg-cream-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="min-w-0">
            <p className="editorial-label">Hal yang sering ditanyakan</p>
            <h2 id="faq-title" className="mt-3 break-words text-3xl font-extrabold tracking-tight text-charcoal">
              Sebelum menghubungi pelaku usaha.
            </h2>
            <p className="mt-4 text-sm leading-7 text-warm-gray">
              Harga, ketersediaan, pembayaran, dan pengiriman disepakati di luar platform.
            </p>
          </div>

          <div className="min-w-0 divide-y divide-sage-border border-y border-sage-border">
            {FAQS.map((item, index) => {
              const answerId = `faq-answer-${index}`;
              const isOpen = openIndex === index;
              return (
                <article key={item.question} className="py-1">
                  <h3>
                    <button
                      id={`faq-question-${index}`}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="focus-ring flex w-full items-center justify-between gap-5 rounded-lg py-5 px-1 text-left text-sm font-bold text-charcoal hover:text-forest transition-colors"
                    >
                      <span className="min-w-0 break-words">{item.question}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-terracotta transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <p
                      id={answerId}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      className="max-w-2xl break-words pb-6 px-1 pr-8 text-sm leading-7 text-warm-gray"
                    >
                      {item.answer}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-5 py-14 sm:flex-row sm:items-center">
        <div>
          <p className="editorial-label">Mulai menjelajah</p>
          <p className="mt-2 text-xl font-bold text-charcoal">Lihat produk dan profil usaha warga.</p>
        </div>
        <Link
          to="/#featured-products"
          className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-forest-hover transition-colors"
        >
          <span>Buka Direktori</span>
          <ArrowRight size={14}/>
        </Link>
      </aside>
    </PublicPageShell>
  );
}
