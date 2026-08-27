import { Search, X } from 'lucide-react';
import { CATEGORIES, getCategoryShortLabel, type Category } from '@loning/shared';
import { CATALOG_QUERY_MAX_LENGTH } from '@loning/shared/lib/catalog-url';
import { cn } from '@v2-shared/ui/cn';

/**
 * Bilah filter V2 mobile — varian mobile dari CatalogFilter.
 *
 * Input search + pita kategori scroll horizontal (bukan dropdown, hemat ruang
 * dan tap target besar). Label sr-only + role=search tetap dipertahankan.
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
      <div className="px-4 py-4">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <label htmlFor="m-catalog-search" className="sr-only">
              {searchLabel}
            </label>
            <Search size={18} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              id="m-catalog-search"
              type="search"
              value={draftQuery}
              maxLength={CATALOG_QUERY_MAX_LENGTH}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={placeholder}
              className="focus-ring-v2 min-h-12 w-full rounded-control border border-control-border bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-subtle"
            />
            {draftQuery ? (
              <button
                type="button"
                onClick={() => onDraftChange('')}
                aria-label="Bersihkan pencarian"
                className="focus-ring-v2 touch-44 absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="focus-ring-v2 min-h-12 shrink-0 rounded-control bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover active:translate-y-px"
          >
            Cari
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              aria-label="Hapus filter"
              className="focus-ring-v2 touch-44 inline-flex shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
        </form>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
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
                  isActive ? 'border-brand bg-brand text-on-brand' : 'border-control-border text-ink hover:bg-sunken',
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
