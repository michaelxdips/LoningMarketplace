import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './client.js';
import { backfillSlugs } from './backfill-slugs.js';

const database = createDatabase();
try { await migrate(database.db, { migrationsFolder: './drizzle' }); await backfillSlugs(database.db); } finally { await database.close(); }
