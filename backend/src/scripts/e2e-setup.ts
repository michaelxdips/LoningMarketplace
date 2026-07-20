import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import sharp from 'sharp';
import { createDatabase } from '../db/client.js';
import { createRepository } from '../routes/repository.js';
import { security } from '../auth/security.js';
import { products } from '../db/schema.js';

if (process.env.NODE_ENV === 'production') throw new Error('E2E setup is disabled in production');

const database = createDatabase();
const repository = createRepository(database.db);
const password = 'local-e2e-passphrase-123';
const umkmId = '00000000-0000-4000-8000-000000000001';
const storageRoot = path.resolve(process.env.MEDIA_FILESYSTEM_ROOT ?? './storage');
const imageUrl = 'http://localhost:3001/media/fixtures/e2e-product.webp';
const fixtures = [
  { id: 'e2000000-0000-4000-8000-000000000001', name: 'E2E Produk Stabilization Desktop', displayOrder: 9000 },
  { id: 'e2000000-0000-4000-8000-000000000002', name: 'E2E Produk Stabilization Mobile', displayOrder: 9001 },
] as const;

async function ensureUser(email: string, displayName: string, role: 'admin' | 'owner', mustChangePassword: boolean) {
  const passwordHash = await security.hashPassword(password);
  const existing = await repository.findUserByEmail(email);
  if (existing) {
    await repository.updateUser(existing.id, { displayName, role, isActive: true, passwordHash, mustChangePassword });
    await repository.revokeUserSessions(existing.id, new Date());
    return existing.id;
  }
  return (await repository.createUser({ email, displayName, role, passwordHash, mustChangePassword })).id;
}

try {
  await mkdir(path.join(storageRoot, 'fixtures'), { recursive: true });
  await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 21, g: 80, b: 52 } } }).webp().toFile(path.join(storageRoot, 'fixtures', 'e2e-product.webp'));
  await writeFile(path.join(storageRoot, 'fixtures', 'e2e-corrupt.webp'), 'controlled invalid image bytes');
  await ensureUser('admin.e2e@local.test', 'Admin E2E', 'admin', true);
  await ensureUser('admin.products.e2e@local.test', 'Admin Produk E2E', 'admin', false);
  const ownerId = await ensureUser('owner.e2e@local.test', 'Pemilik E2E', 'owner', false);
  await repository.assignUMKMOwner(umkmId, ownerId);
  for (const fixture of fixtures) {
    await database.db.insert(products).values({ id: fixture.id, umkmId, name: fixture.name, price: 35000, description: 'Produk deterministik untuk pengujian browser lokal.', category: 'Kuliner', imageUrl, isAvailable: true, unit: 'Pcs', displayOrder: fixture.displayOrder, publicationStatus: 'published', publishedAt: new Date() }).onConflictDoUpdate({ target: products.id, set: { umkmId, name: fixture.name, price: 35000, description: 'Produk deterministik untuk pengujian browser lokal.', category: 'Kuliner', imageUrl, imageAssetId: null, isAvailable: true, unit: 'Pcs', displayOrder: fixture.displayOrder, publicationStatus: 'published', publishedAt: new Date(), updatedAt: sql`now()` } });
  }
  console.log('Local E2E accounts are ready.');
} finally { await database.close(); }
