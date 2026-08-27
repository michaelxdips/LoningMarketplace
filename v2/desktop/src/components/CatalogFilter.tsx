import { Search, X } from 'lucide-react';
import { CATEGORIES, getCategoryShortLabel, type Category } from '@loning/shared';
import { CATALOG_QUERY_MAX_LENGTH } from '@loning/shared/lib/catalog-url';
import { cn } from '@v2-shared/ui/cn';

/**
 * Bilah filter bersama untuk katalog produk & direktori UMKM.
 *
 * Catatan label: input pencarian memakai <label> sr-only, bukan placeholder
 * sebagai label. Placeholder tetap ada sebagai contoh isi, tapi nama aksesibel
 * datang dari label sungguhan — jadi aturan "no placeholder-as-label" tetap
 * dipenuhi tanpa menaruh label kasat mata di dalam bilah filter yang padat.
 */
export default function CatalogFilter({
  searchLabel,
  placeholder,
  draftQuery,
  onDraftChange,
  onSubmit,
  category,
  onCategoryChange,
  hasActiveFilters,
  onClearFilters,
}: {
  searchLabel: string;
  placeholder: string;
  draftQuery: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  category: Category | 'Semua';
  onCategoryChange: (category: Category | 'Semua') => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <label htmlFor="v2-catalog-search" className="sr-only">
              {searchLabel}
            </label>
            <Search
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <input
              id="v2-catalog-search"
              type="search"
              value={draftQuery}
              maxLength={CATALOG_QUERY_MAX_LENGTH}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={placeholder}
              className="focus-ring-v2 min-h-11 w-full rounded-control border border-control-border bg-surface pl-11 pr-10 text-base text-ink placeholder:text-ink-subtle"
            />
            {draftQuery ? (
              <button
                type="button"
                onClick={() => onDraftChange('')}
                aria-label="Bersihkan pencarian"
                className="focus-ring-v2 touch-44 absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"
              >
                <X size={15} strokeWidth={1.5} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            className="focus-ring-v2 min-h-11 rounded-control bg-brand px-5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover active:translate-y-px"
          >
            Cari
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="focus-ring-v2 inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
              Hapus filter
            </button>
          ) : null}
        </form>

        {/* Pita kategori: scroll horizontal di layar kecil, bukan dropdown. */}
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {(['Semua', ...CATEGORIES] as const).map((item) => {
            const isActive = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onCategoryChange(item)}
                aria-pressed={isActive}
                className={cn(
                  'focus-ring-v2 min-h-11 shrink-0 whitespace-nowrap rounded-control border px-4 text-sm transition-colors',
                  isActive
                    ? 'border-brand bg-brand text-on-brand'
                    : 'border-control-border text-ink hover:bg-sunken',
                )}
              >
                {item === 'Semua' ? 'Semua' : getCategoryShortLabel(item)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
