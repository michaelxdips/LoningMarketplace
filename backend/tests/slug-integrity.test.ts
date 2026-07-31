import { describe, expect, it } from 'vitest';
import { SlugConflictError } from '../src/errors/domain.js';
import { formatMigrationPreflightError } from '../src/db/backfill-slugs.js';
import { formatPublicIntegrityFailures } from '../src/db/public-integrity.js';
import {
  MAX_SLUG_ALLOCATION_ATTEMPTS,
  MAX_SLUG_LENGTH,
  allocateAvailableSlug,
  allocateSlugWithRetry,
  buildSlugCandidate,
  isExpectedUniqueViolation,
  slugify,
} from '../src/lib/slug.js';

describe('shared slug allocation', () => {
  it('builds deterministic bounded candidates with stable fallbacks', () => {
    expect(buildSlugCandidate('catalog', 1)).toBe('catalog');
    expect(buildSlugCandidate('catalog', 2)).toBe('catalog-2');
    expect(buildSlugCandidate('x'.repeat(MAX_SLUG_LENGTH), 10_000)).toHaveLength(MAX_SLUG_LENGTH);
    expect(buildSlugCandidate('x'.repeat(MAX_SLUG_LENGTH), 10_000).endsWith('-10000')).toBe(true);
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
    expect(slugify('產品', 'produk')).toBe('produk');
    expect(slugify('🛍️', 'umkm')).toBe('umkm');
    expect(MAX_SLUG_ALLOCATION_ATTEMPTS).toBe(10_000);
  });

  it('allocates from the same candidate sequence used by create operations', () => {
    const used = new Set(['catalog', 'catalog-2']);
    expect(allocateAvailableSlug('catalog', used)).toBe('catalog-3');
    expect(used).toEqual(new Set(['catalog', 'catalog-2', 'catalog-3']));
  });

  it.each([
    [{ code: '23505', constraint_name: 'products_slug_unique' }, 'products_slug_unique', true],
    [{ code: '23505', constraint_name: 'umkms_slug_unique' }, 'umkms_slug_unique', true],
    [{ code: '23505', constraint_name: 'users_email_unique' }, 'products_slug_unique', false],
    [{ code: '23505', constraint_name: 'users_username_lower_unique' }, 'umkms_slug_unique', false],
    [{ code: '23505' }, 'products_slug_unique', false],
    [{ code: '22001', constraint_name: 'products_slug_unique' }, 'products_slug_unique', false],
  ])('matches only the expected PostgreSQL slug constraint', (error, constraint, expected) => {
    expect(isExpectedUniqueViolation(error, constraint)).toBe(expected);
  });

  it.each(['products_slug_unique', 'umkms_slug_unique'])('retries only %s conflicts and returns the first successful candidate', async (constraint) => {
    const attempted: string[] = [];
    const result = await allocateSlugWithRetry('catalog', constraint, async (candidate) => {
      attempted.push(candidate);
      if (attempted.length < 3) throw { code: '23505', constraint_name: constraint };
      return candidate;
    });
    expect(result).toBe('catalog-3');
    expect(attempted).toEqual(['catalog', 'catalog-2', 'catalog-3']);
  });

  it('rethrows unrelated database errors without retrying', async () => {
    const unrelated = { code: '23505', constraint_name: 'users_email_unique' };
    let attempts = 0;
    await expect(allocateSlugWithRetry('catalog', 'products_slug_unique', async () => { attempts += 1; throw unrelated; })).rejects.toBe(unrelated);
    expect(attempts).toBe(1);
  });

  it('raises the stable domain error when the bounded sequence is exhausted', async () => {
    await expect(allocateSlugWithRetry('catalog', 'products_slug_unique', async () => {
      throw { code: '23505', constraint_name: 'products_slug_unique' };
    }, 2)).rejects.toMatchObject({ name: 'SlugConflictError', code: 'SLUG_CONFLICT' });
    await expect(Promise.reject(new SlugConflictError())).rejects.toThrow('Unable to allocate a unique slug');
  });

  it('formats bounded migration preflight failures deterministically', () => {
    const ids = Array.from({ length: 12 }, (_, index) => `id-${String(index + 1).padStart(2, '0')}`);
    expect(formatMigrationPreflightError('Duplicate product slugs detected', 12, ids)).toBe(
      'Duplicate product slugs detected: 12 conflicting rows; IDs: id-01, id-02, id-03, id-04, id-05, id-06, id-07, id-08, id-09, id-10',
    );
    expect(formatMigrationPreflightError('Invalid WhatsApp contacts detected', 2, ['id-02', 'id-01'])).toBe(
      'Invalid WhatsApp contacts detected: 2 conflicting rows; IDs: id-01, id-02',
    );
  });

  it('formats DB audit failures without exposing row data', () => {
    expect(formatPublicIntegrityFailures([
      { check: 'duplicate product slugs', failures: 2 },
      { check: 'umkms_phone_normalized_check', failures: 1 },
    ])).toBe('duplicate product slugs=2; umkms_phone_normalized_check=1');
  });
});
