import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { categories, publicationStatuses } from '../../repository.js';

export async function seedProducts(db: PostgresJsDatabase<typeof schema>, umkmId: string) {
  const now = new Date();
  
  const fixtures = [
    { id: 'e3000000-0000-4000-8000-000000000001', name: 'E2E Produk Stabilization Desktop', displayOrder: 9000 },
    { id: 'e3000000-0000-4000-8000-000000000002', name: 'E2E Produk Stabilization Mobile', displayOrder: 9001 },
  ] as const;

  for (const fixture of fixtures) {
    await db.insert(schema.products).values({
      id: fixture.id,
      umkmId,
      name: fixture.name,
      slug: fixture.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: 35000,
      description: 'Produk deterministik untuk pengujian browser lokal.',
      category: 'Kuliner' as typeof categories[number],
      imageUrl: 'http://localhost:3001/media/fixtures/e2e-product.webp', // Required by check constraint
      imageAssetId: null,
      isAvailable: true,
      unit: 'Pcs',
      displayOrder: fixture.displayOrder,
      publicationStatus: 'published' as typeof publicationStatuses[number],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: schema.products.id,
      set: {
        umkmId,
        name: sql`excluded.name`,
        slug: sql`excluded.slug`,
        price: sql`excluded.price`,
        description: sql`excluded.description`,
        category: sql`excluded.category`,
        isAvailable: sql`excluded.is_available`,
        unit: sql`excluded.unit`,
        displayOrder: sql`excluded.display_order`,
        publicationStatus: sql`excluded.publication_status`,
        publishedAt: sql`excluded.published_at`,
        updatedAt: sql`now()`,
      }
    });
  }
}

