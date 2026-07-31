import { describe, expect, it } from 'vitest';
import { parseCatalogState, serializeCatalogState } from './catalog-url';

describe('catalog URL state', () => {
  it('parses valid combined state and controls unknown categories', () => {
    expect(parseCatalogState('?q=%20keripik%20&category=Kuliner')).toEqual({ q: 'keripik', category: 'Kuliner' });
    expect(parseCatalogState('?q=keripik&category=Unknown')).toEqual({ q: 'keripik', category: 'Semua' });
  });

  it('serializes only non-default state with bounded trimmed query', () => {
    expect(serializeCatalogState({ q: '  keripik  ', category: 'Kuliner' }).toString()).toBe('q=keripik&category=Kuliner');
    expect(serializeCatalogState({ q: '   ', category: 'Semua' }).toString()).toBe('');
    expect(serializeCatalogState({ q: 'a'.repeat(100), category: 'Semua' }).get('q')).toHaveLength(80);
  });
});
