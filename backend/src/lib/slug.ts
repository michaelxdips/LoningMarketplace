import { SlugConflictError } from '../errors/domain.js';

export const MAX_SLUG_LENGTH = 96;
export const MAX_PUBLIC_IDENTIFIER_LENGTH = 128;
export const MAX_SLUG_ALLOCATION_ATTEMPTS = 10_000;

export function slugify(value: string, fallback: 'produk' | 'umkm' = 'produk'): string {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug || fallback;
}

export function buildSlugCandidate(base: string, attempt: number): string {
  if (!Number.isInteger(attempt) || attempt < 1) throw new RangeError('Slug attempt must be a positive integer');
  if (attempt === 1) return base.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '');
  const suffix = `-${attempt}`;
  return `${base.slice(0, Math.max(1, MAX_SLUG_LENGTH - suffix.length)).replace(/-+$/g, '')}${suffix}`;
}

export const withCollisionSuffix = buildSlugCandidate;

export function allocateAvailableSlug(base: string, used: Set<string>, maxAttempts = MAX_SLUG_ALLOCATION_ATTEMPTS): string {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = buildSlugCandidate(base, attempt);
    if (!used.has(candidate)) { used.add(candidate); return candidate; }
  }
  throw new SlugConflictError();
}

export function isExpectedUniqueViolation(error: unknown, constraint: string): boolean {
  const value = error as { code?: string; constraint_name?: string; constraint?: string };
  return value?.code === '23505' && (value.constraint_name === constraint || value.constraint === constraint);
}

export async function allocateSlugWithRetry<T>(
  base: string,
  constraint: string,
  operation: (candidate: string) => Promise<T>,
  maxAttempts = MAX_SLUG_ALLOCATION_ATTEMPTS,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try { return await operation(buildSlugCandidate(base, attempt)); }
    catch (error) {
      if (!isExpectedUniqueViolation(error, constraint)) throw error;
      if (attempt === maxAttempts) throw new SlugConflictError();
    }
  }
  throw new SlugConflictError();
}
