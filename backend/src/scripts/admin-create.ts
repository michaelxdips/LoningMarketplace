import { z } from 'zod';
import { createDatabase } from '../db/client.js';
import { createRepository, type Repository } from '../db/repository.js';
import { security, type Security } from '../auth/security.js';
import { passwordSetterSchema, usernameSchema } from '../auth/policy.js';
import { assertSafeBootstrapTarget, formatDatabaseTarget } from '../db/target-safety.js';

const inputSchema = z.object({
  BOOTSTRAP_ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
  BOOTSTRAP_ADMIN_USERNAME: usernameSchema,
  BOOTSTRAP_ADMIN_PASSWORD: passwordSetterSchema,
  BOOTSTRAP_ADMIN_DISPLAY_NAME: z.string().trim().min(1).max(200),
});

export type BootstrapInput = z.infer<typeof inputSchema>;

export function readBootstrapInput(env: NodeJS.ProcessEnv): BootstrapInput {
  const parsed = inputSchema.safeParse(env);
  if (!parsed.success) throw new Error('BOOTSTRAP_INPUT_REFUSED: email, username, display name, and password must satisfy the bootstrap contract');
  return parsed.data;
}

export async function bootstrapSuperadmin(repository: Repository, crypto: Security, input: BootstrapInput, now: () => Date) {
  if (await repository.countSuperadmins()) throw new Error('BOOTSTRAP_REFUSED: a Super Admin already exists; use the recovery procedure instead');
  if (await repository.findUserByEmail(input.BOOTSTRAP_ADMIN_EMAIL)) throw new Error('BOOTSTRAP_REFUSED: email is already in use');
  if (await repository.findUserByUsername(input.BOOTSTRAP_ADMIN_USERNAME)) throw new Error('BOOTSTRAP_REFUSED: username is already in use');
  const passwordHash = await crypto.hashPassword(input.BOOTSTRAP_ADMIN_PASSWORD);
  return repository.transaction(async (tx) => {
    const user = await tx.createUser({
      email: input.BOOTSTRAP_ADMIN_EMAIL,
      username: input.BOOTSTRAP_ADMIN_USERNAME,
      displayName: input.BOOTSTRAP_ADMIN_DISPLAY_NAME,
      role: 'superadmin',
      passwordHash,
      mustChangePassword: true,
    });
    await tx.addAudit({ actorUserId: null, action: 'auth.superadmin_bootstrapped', entityType: 'user', entityId: user.id, metadata: { actorType: 'system', source: 'explicit-bootstrap', at: now().toISOString() } });
    return user;
  });
}

async function main() {
  const target = assertSafeBootstrapTarget(process.env);
  const input = readBootstrapInput(process.env);
  console.log(`Bootstrapping Super Admin for ${formatDatabaseTarget(target)}.`);
  const database = createDatabase();
  try {
    const created = await bootstrapSuperadmin(createRepository(database.db), security, input, () => new Date());
    console.log(`Created Super Admin account ${created.username}.`);
  } finally {
    await database.close();
  }
}

if (process.argv[1]?.endsWith('admin-create.ts')) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Bootstrap failed');
    process.exitCode = 1;
  });
}
