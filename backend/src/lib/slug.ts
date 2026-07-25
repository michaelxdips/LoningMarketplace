export const MAX_SLUG_LENGTH = 96;
export const MAX_PUBLIC_IDENTIFIER_LENGTH = 128;

export function slugify(value: string, fallback: 'produk' | 'umkm' = 'produk'): string {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug || fallback;
}

export function withCollisionSuffix(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  return `${base.slice(0, Math.max(1, MAX_SLUG_LENGTH - suffix.length)).replace(/-+$/g, '')}${suffix}`;
}
