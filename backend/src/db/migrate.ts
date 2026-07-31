import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { preparePublicIntegrity } from './backfill-slugs.js';
import { createDatabase } from './client.js';
import { assertBusinessLocationIntegrity } from './location-integrity.js';
import { assertPublicIntegrity } from './public-integrity.js';

const migrationsFolder = './drizzle';
const preparationMigrationTag = '0008_finalize_public_integrity';
const repairMigrationTag = '0009_repair_public_integrity';
const finalMigrationTag = '0010_umkm_business_location';
const migrationSteps = ['preparePublicIntegrity', preparationMigrationTag, repairMigrationTag, finalMigrationTag, 'assertPublicIntegrity', 'assertBusinessLocationIntegrity'] as const;
const migrations = readMigrationFiles({ migrationsFolder });
const journal = JSON.parse(readFileSync(`${migrationsFolder}/meta/_journal.json`, 'utf8')) as { entries: Array<{ idx: number; tag: string; when: number }> };
const preparationMigrationIndex = journal.entries.find(({ tag }) => tag === preparationMigrationTag)?.idx;
const finalMigrationIndex = journal.entries.find(({ tag }) => tag === finalMigrationTag)?.idx;
if (preparationMigrationIndex === undefined || !migrations[preparationMigrationIndex]) throw new Error(`Migration ${preparationMigrationTag} is not registered`);
if (finalMigrationIndex === undefined || !migrations[finalMigrationIndex]) throw new Error(`Migration ${finalMigrationTag} is not registered`);

const database = createDatabase();
type Migration = (typeof migrations)[number];

// Drizzle resumes only from the latest ledger entry, so a harness-rewound 0008/0009 would be skipped.
// Apply each missing migration transactionally and record it only after its SQL succeeds.
async function migratePending(pending: Migration[]): Promise<void> {
  await database.db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await database.db.execute(sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)`);
  const [{ ledger }] = await database.db.execute<{ ledger: string | null }>(sql`SELECT to_regclass('drizzle.__drizzle_migrations')::text AS ledger`);
  const recorded = ledger
    ? new Set((await database.db.execute<{ created_at: number | string }>(sql`SELECT created_at FROM drizzle.__drizzle_migrations`)).map(({ created_at }) => Number(created_at)))
    : new Set<number>();
  const missing = pending.filter((migration) => !recorded.has(migration.folderMillis));
  if (!missing.length) return;
  await database.db.transaction(async (tx) => {
    for (const migration of missing) {
      for (const statement of migration.sql) await tx.execute(sql.raw(statement));
      await tx.execute(sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${migration.hash}, ${migration.folderMillis})`);
    }
  });
}

try {
  await migratePending(migrations.slice(0, preparationMigrationIndex));
  await preparePublicIntegrity(database.db);
  await migratePending(migrations.slice(preparationMigrationIndex));
  await assertPublicIntegrity(database.db);
  await assertBusinessLocationIntegrity(database.db);
  console.log(`Database migration complete: ${migrationSteps.join(' -> ')}`);
} finally {
  await database.close();
}
