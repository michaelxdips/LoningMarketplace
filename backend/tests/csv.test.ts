import { describe, expect, it } from 'vitest';
import { csvDocument, csvFilename, escapeCsvCell } from '../src/lib/csv.js';

describe('CSV export security', () => {
  it('quotes commas, quotes, newlines and neutralizes spreadsheet formulas', () => {
    expect(escapeCsvCell('A,"B"\nC')).toBe('"A,""B""\nC"');
    expect(escapeCsvCell('=IMPORTXML("x")')).toBe('"\'=IMPORTXML(""x"")"');
    expect(escapeCsvCell('+1')).toBe('"\'+1"');
  });
  it('adds UTF-8 BOM, CRLF and stable filename', () => {
    const document = csvDocument(['Nama'], [['Kopi Loning']]);
    expect(document.charCodeAt(0)).toBe(0xfeff);
    expect(document).toContain('\r\n');
    expect(csvFilename('umkm', new Date('2026-08-07T00:00:00Z'))).toBe('loning-maju-umkm-2026-08-07.csv');
  });
});
