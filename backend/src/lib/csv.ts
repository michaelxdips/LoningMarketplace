const CSV_FORMULA_PREFIX = /^[=+\-@]/;

export function escapeCsvCell(value: unknown): string {
  let text = value == null ? '' : String(value);
  if (CSV_FORMULA_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvDocument(headers: string[], rows: unknown[][]): string {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}\r\n`;
}

export function csvFilename(resource: 'umkm' | 'produk', at = new Date()): string {
  return `loning-maju-${resource}-${at.toISOString().slice(0, 10)}.csv`;
}
