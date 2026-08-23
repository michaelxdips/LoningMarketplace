export function normalizePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const price = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : Number.NaN;
  return Number.isSafeInteger(price) && price >= 0 ? price : null;
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function formatPrice(value: unknown, fallback = 'Harga tidak ditampilkan') {
  const price = normalizePrice(value);
  return price === null ? fallback : rupiah.format(price).replace(/\s/g, '');
}
