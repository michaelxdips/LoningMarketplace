import { readFileSync } from 'node:fs';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { PgDialect } from 'drizzle-orm/pg-core';
import { preparePublicIntegrity } from './backfill-slugs.js';
import { createDatabase } from './client.js';
import { assertPublicIntegrity } from './public-integrity.js';

const migrationsFolder = './drizzle';
const finalMigrationTag = '0008_finalize_public_integrity';
const migrationSteps = ['preparePublicIntegrity', finalMigrationTag, 'assertPublicIntegrity'] as const;
const migrations = readMigrationFiles({ migrationsFolder });
const journal = JSON.parse(readFileSync(`${migrationsFolder}/meta/_journal.json`, 'utf8')) as { entries: Array<{ idx: number; tag: string }> };
const finalMigrationIndex = journal.entries.find(({ tag }) => tag === finalMigrationTag)?.idx;
if (finalMigrationIndex === undefined || !migrations[finalMigrationIndex]) throw new Error(`Migration ${finalMigrationTag} is not registered`);

const database = createDatabase();
const dialect = new PgDialect();
const migrationSession = database.db._.session as unknown as Parameters<PgDialect['migrate']>[1];
try {
  await dialect.migrate(migrations.slice(0, finalMigrationIndex), migrationSession, { migrationsFolder });
  await preparePublicIntegrity(database.db);
  await dialect.migrate(migrations.slice(finalMigrationIndex), migrationSession, { migrationsFolder });
  await assertPublicIntegrity(database.db);
  console.log(`Database migration complete: ${migrationSteps.join(' -> ')}`);
} finally {
  await database.close();
}
