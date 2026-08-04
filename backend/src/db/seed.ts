import { createDatabase } from './client.js';
import { seedUsers as devSeedUsers } from './seeds/development/users.js';
import { seedUmkms as devSeedUmkms } from './seeds/development/umkms.js';
import { seedProducts as devSeedProducts } from './seeds/development/products.js';
import { seedMedia } from './seeds/development/media.js';
import { assertSafeSeedTarget, formatDatabaseTarget, resolveSeedProfile, type SeedProfile } from './target-safety.js';
import process from 'node:process';
import argon2 from 'argon2';
import { seedUsers as testSeedUsers } from './seeds/test/users.js';
import { seedUmkms as testSeedUmkms } from './seeds/test/umkms.js';
import { seedProducts as testSeedProducts } from './seeds/test/products.js';

export async function seed(profile: SeedProfile, env: NodeJS.ProcessEnv = process.env) {
  const target = assertSafeSeedTarget(profile, env);
  if (profile === 'preview') throw new Error('PREVIEW_SEED_DISABLED: no isolated preview database seed policy has been approved');
  const password = env.SEED_DEVELOPMENT_PASSWORD;
  if (profile === 'development' && !password) throw new Error('SEED_CREDENTIALS_REFUSED: SEED_DEVELOPMENT_PASSWORD is required for development seed');
  const database = createDatabase();
  try {
    const db = database.db;
    const cryptoHashPassword = async (password: string) => await argon2.hash(password);
    console.log(`Starting ${profile} seed for ${formatDatabaseTarget(target)}.`);
    await db.transaction(async (tx) => {
      if (profile === 'development') {
        await devSeedUsers(tx, cryptoHashPassword, password!);
        await devSeedUmkms(tx);
        await devSeedProducts(tx);
        await seedMedia(tx);
      } else if (profile === 'test') {
        // Test seed creates foundation data for E2E fixtures
        await testSeedUsers(tx, cryptoHashPassword);
        await testSeedUmkms(tx);
        // Products reference UMKM IDs defined in shared/ids.js
        await testSeedProducts(tx, 'e2000000-0000-4000-8000-000000000001');
      }
    });
    console.log(`${profile === 'test' ? 'Test seed with fixture foundation' : profile === 'development' ? 'Development seed' : 'Seed'} completed.`);
  } catch (error) {
    console.error('Seed failed:', error instanceof Error ? error.message : 'unknown error');
    throw error;
  } finally {
    await database.close();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  const profile = resolveSeedProfile(process.argv.slice(2), process.env);
  seed(profile).catch(() => { process.exitCode = 1; });
}

