import { createDatabase } from './client.js';
import { seedUsers } from './seeds/development/users.js';
import { seedUmkms } from './seeds/development/umkms.js';
import { seedProducts } from './seeds/development/products.js';
import { seedMedia } from './seeds/development/media.js';
import process from 'node:process';
import argon2 from 'argon2';

async function seed() {
  const envNode = process.env.NODE_ENV || 'development';
  if (envNode === 'production') {
    console.log('Skipping seed in production environment.');
    return;
  }

  const database = createDatabase();
  try {
    const db = database.db;

    // Use argon2 directly for password hashing here instead of importing auth internals
    const cryptoHashPassword = async (password: string) => await argon2.hash(password);

    console.log(`Starting seed in ${envNode} mode...`);

    // In a real app we might branch based on process.env.SEED_PROFILE,
    // but here we just run the rich development seeds.
    await db.transaction(async (tx) => {
      console.log('Seeding users...');
      await seedUsers(tx, cryptoHashPassword);

      console.log('Seeding UMKMs...');
      await seedUmkms(tx);

      console.log('Seeding products...');
      await seedProducts(tx);

      console.log('Seeding media...');
      await seedMedia(tx);
    });

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

seed().catch((error) => {
  console.error('Unhandled seed error:', error);
  process.exit(1);
});
