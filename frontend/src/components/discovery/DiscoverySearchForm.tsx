import { Search, X } from 'lucide-react';
import { useRef } from 'react';
import { CATALOG_QUERY_MAX_LENGTH } from '../../lib/catalog-url';

type DiscoverySearchFormProps = {
  id: string;
  label: string;
  placeholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export default function DiscoverySearchForm({ id, label, placeholder, query, onQueryChange, onSubmit, onClear }: DiscoverySearchFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const clear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <form role="search" aria-label="Pencarian katalog" className="flex w-full flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative min-w-0 flex-1">
        <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={query}
          maxLength={CATALOG_QUERY_MAX_LENGTH}
          placeholder={placeholder}
          onChange={(event) => onQueryChange(event.currentTarget.value.slice(0, CATALOG_QUERY_MAX_LENGTH))}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            onSubmit();
          }}
          className="focus-ring w-full rounded-xl border border-sage-border bg-cream-card py-2.5 pl-9 pr-9 text-xs text-charcoal placeholder:text-warm-gray/40 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
        />
        {query && (
          <button type="button" onClick={clear} aria-label="Bersihkan pencarian" className="focus-ring absolute inset-y-0 right-0 flex items-center rounded px-3 text-warm-gray hover:text-charcoal">
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <button type="submit" className="focus-ring touch-target rounded-xl bg-forest px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-forest-hover">Cari</button>
    </form>
  );
}
