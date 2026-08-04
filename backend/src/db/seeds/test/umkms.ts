import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { SEED_DATES } from '../shared/dates.js';
import { categories, publicationStatuses, type Category } from '../../repository.js';
import { UMKMS } from '../shared/ids.js';

export async function seedUmkms(db: PostgresJsDatabase<typeof schema>) {
  const now = new Date();
  
  const umkms = [
    { 
      id: UMKMS.kuliner1, 
      slug: 'warung-nasi-khas-loning', 
      name: 'Warung Nasi Khas Loning', 
      owner: 'Siti Aminah',
      description: 'Kuliner tradisional dengan cita rasa otentik',
      phone: '6281234567890',
      category: 'Kuliner' as Category,
      imageUrl: 'http://localhost:3001/media/fixtures/e2e-product.webp', // Required by check constraint
      imageAssetId: null,
      address: 'Jl. Raya Loning No. 123, Desa Loning',
      workingHours: '08:00-20:00',
      displayOrder: 9000,
      publicationStatus: 'published' as typeof publicationStatuses[number],
      publishedAt: SEED_DATES.recent,
      createdAt: SEED_DATES.old,
      updatedAt: SEED_DATES.recent,
    },
    { 
      id: UMKMS.kerajinan1, 
      slug: 'kerajinan-tangan-loning', 
      name: 'Kerajinan Tangan Loning', 
      owner: 'Budi Santoso',
      description: 'Kerajinan tangan berbahan lokal',
      phone: '6281234567891',
      category: 'Kerajinan' as Category,
      imageUrl: 'http://localhost:3001/media/fixtures/e2e-product.webp', // Required by check constraint
      imageAssetId: null,
      address: 'Jl. Loning Timur No. 45',
      workingHours: '09:00-17:00',
      displayOrder: 9001,
      publicationStatus: 'published' as typeof publicationStatuses[number],
      publishedAt: SEED_DATES.recent,
      createdAt: SEED_DATES.old,
      updatedAt: SEED_DATES.recent,
    },
  ];

  for (const umkm of umkms) {
    await db.insert(schema.umkms).values(umkm).onConflictDoUpdate({
      target: schema.umkms.id,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        owner: sql`excluded.owner`,
        description: sql`excluded.description`,
        phone: sql`excluded.phone`,
        category: sql`excluded.category`,
        address: sql`excluded.address`,
        workingHours: sql`excluded.working_hours`,
        displayOrder: sql`excluded.display_order`,
        publicationStatus: sql`excluded.publication_status`,
        publishedAt: sql`excluded.published_at`,
        catalogUpdatedAt: sql`excluded.catalog_updated_at`,
        updatedAt: sql`excluded.updated_at`,
      }
    });
  }
}

