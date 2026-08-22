import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

export default function EditorialTeasers() {
  return (
    <section className="border-b border-sage-border bg-cream-bg px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
            Lebih dekat dengan Loning
          </p>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-4xl">
            Bukan sekadar daftar produk.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-sage-border bg-sage-border md:grid-cols-2">
          <Link
            to="/tentang-desa"
            className="focus-ring group flex flex-col justify-between gap-14 bg-cream-card p-8 transition-colors hover:bg-cream-tint sm:p-10"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-warm-gray">Tentang Desa</p>
            <div className="flex items-end justify-between gap-5">
              <h3 className="font-serif text-2xl font-semibold leading-snug text-charcoal">
                Kenali cerita dan semangat di balik etalase warga.
              </h3>
              <ArrowUpRight
                className="shrink-0 text-forest transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                size={22}
              />
            </div>
          </Link>

          <Link
            to="/faq"
            className="focus-ring group flex flex-col justify-between gap-14 bg-cream-card p-8 transition-colors hover:bg-cream-tint sm:p-10"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-warm-gray">Panduan & FAQ</p>
            <div className="flex items-end justify-between gap-5">
              <h3 className="font-serif text-2xl font-semibold leading-snug text-charcoal">
                Pahami cara mencari dan menghubungi pelaku usaha.
              </h3>
              <ArrowUpRight
                className="shrink-0 text-terracotta transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                size={22}
              />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
