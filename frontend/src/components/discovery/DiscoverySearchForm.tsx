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
    <form role="search" aria-label="Pencarian katalog" className="flex w-full items-center gap-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative min-w-0 flex-1">
        <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray/75" />
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
          className="focus-ring min-h-11 w-full rounded-xl border border-forest/20 bg-white py-2.5 pl-9 pr-9 text-xs text-charcoal shadow-sm transition-colors placeholder:text-warm-gray/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
        />
        {query && (
          <button type="button" onClick={clear} aria-label="Bersihkan pencarian" className="focus-ring absolute inset-y-0 right-0 flex items-center rounded-r-xl px-2.5 text-warm-gray transition-colors hover:text-charcoal">
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <button type="submit" className="focus-ring touch-target min-h-11 shrink-0 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-forest-hover">Cari</button>
    </form>
  );
}
