import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { SEED_DATES } from '../shared/dates.js';

export async function seedUsers(db: PostgresJsDatabase<typeof schema>, cryptoHashPassword: (password: string) => Promise<string>) {
  const hash = await cryptoHashPassword('test1234');
  
  const users = [
    { id: 'e1000000-0000-4000-8000-000000000001', email: 'admin1@local.test', username: 'admin1', displayName: 'Administrator Utama', passwordHash: hash, role: 'admin' as const, isActive: true, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
    { id: 'e1000000-0000-4000-8000-000000000011', email: 'owner.e2e@local.test', username: 'ownere2e', displayName: 'Pemilik E2E', passwordHash: hash, role: 'pelaku_umkm' as const, isActive: true, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
    { id: 'e1000000-0000-4000-8000-000000000012', email: 'admin.products.e2e@local.test', username: 'adminproductse2e', displayName: 'Admin Produk E2E', passwordHash: hash, role: 'admin' as const, isActive: true, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
  ];

  for (const user of users) {
    await db.insert(schema.users).values(user).onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: sql`excluded.email`,
        displayName: sql`excluded.display_name`,
        passwordHash: sql`excluded.password_hash`,
        role: sql`excluded.role`,
        isActive: sql`excluded.is_active`,
        mustChangePassword: sql`excluded.must_change_password`,
        failedLoginCount: 0,
        lockedUntil: null,
        updatedAt: sql`excluded.updated_at`
      }
    });
  }
}

