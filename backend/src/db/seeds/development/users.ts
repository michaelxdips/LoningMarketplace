import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { USERS } from '../shared/ids.js';
import { SEED_DATES } from '../shared/dates.js';

export async function seedUsers(db: PostgresJsDatabase<typeof schema>, cryptoHashPassword: (password: string) => Promise<string>) {
  const hash = await cryptoHashPassword('loning_local_dev');
  
  const users = [
    { id: USERS.admin1, email: 'admin1@local.test', username: 'admin1', displayName: 'Administrator Utama', passwordHash: hash, role: 'admin' as const, isActive: true, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
    { id: USERS.admin2, email: 'admin2@local.test', username: 'admin2', displayName: 'Admin Tambahan', passwordHash: hash, role: 'admin' as const, isActive: true, mustChangePassword: true, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
    { id: USERS.owner1, email: 'owner1@local.test', username: 'owner1', displayName: 'Pemilik UMKM A', passwordHash: hash, role: 'pelaku_umkm' as const, isActive: true, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
    { id: USERS.owner2, email: 'owner2@local.test', username: 'owner2', displayName: 'Pemilik UMKM B', passwordHash: hash, role: 'pelaku_umkm' as const, isActive: true, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
    { id: USERS.owner3, email: 'inactive@local.test', username: 'inactive', displayName: 'Pemilik Inaktif', passwordHash: hash, role: 'pelaku_umkm' as const, isActive: false, mustChangePassword: false, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.old },
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
        updatedAt: sql`excluded.updated_at`
      }
    });
  }
}
