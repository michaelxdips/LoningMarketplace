import { z } from 'zod';
import { createDatabase } from '../db/client.js';
import { createRepository } from '../routes/repository.js';
import { security } from '../auth/security.js';

const input = z.object({ BOOTSTRAP_ADMIN_EMAIL: z.string().email(), BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(128), BOOTSTRAP_ADMIN_DISPLAY_NAME: z.string().min(1).max(200).default('Administrator') }).parse(process.env);
const database = createDatabase();
try {
  const repository = createRepository(database.db), existing = await repository.findUserByEmail(input.BOOTSTRAP_ADMIN_EMAIL);
  if (existing) throw new Error('A user with BOOTSTRAP_ADMIN_EMAIL already exists');
  const created = await repository.transaction(async (tx) => { const user = await tx.createUser({ email: input.BOOTSTRAP_ADMIN_EMAIL, displayName: input.BOOTSTRAP_ADMIN_DISPLAY_NAME, role: 'admin', passwordHash: await security.hashPassword(input.BOOTSTRAP_ADMIN_PASSWORD), mustChangePassword: true }); await tx.addAudit({ actorUserId: user.id, action: 'user.created', entityType: 'user', entityId: user.id, metadata: { source: 'bootstrap' } }); return user; });
  console.log(`Created admin ${created.email} (${created.id})`);
} finally { await database.close(); }
