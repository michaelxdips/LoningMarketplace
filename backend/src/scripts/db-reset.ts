import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import process from 'node:process';
import {
  LOCAL_COMPOSE_FILE,
  LOCAL_COMPOSE_PROJECT,
  RESETTABLE_APPLICATION_TABLES,
  validateResetSafety,
} from './db-reset-guard.js';

async function reset() {
  const validation = validateResetSafety({
    nodeEnv: process.env.NODE_ENV,
    force: process.argv.includes('--force'),
    databaseUrl: process.env.DATABASE_URL,
    affectedTables: RESETTABLE_APPLICATION_TABLES,
    composeProject: LOCAL_COMPOSE_PROJECT,
    composeFile: LOCAL_COMPOSE_FILE,
    allowedTestProjectRefs: (process.env.DB_RESET_ALLOWED_TEST_PROJECT_REFS ?? '').split(',').map((value) => value.trim()).filter(Boolean),
  });
  if (!validation.safe) throw new Error(`Reset refused: ${validation.reason}`);

  const databaseName = validation.url.pathname.slice(1);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database target: ${validation.url.hostname}/${databaseName}`);
  console.log(`Target class: ${validation.target}`);
  console.log('Reset mode: full explicit application-table truncate');
  console.log(`Compose scope: ${LOCAL_COMPOSE_PROJECT} / ${LOCAL_COMPOSE_FILE}`);
  console.log(`Tables affected: ${RESETTABLE_APPLICATION_TABLES.join(', ')}`);

  const database = createDatabase();
  try {
    await database.db.transaction(async (tx) => {
      for (const table of RESETTABLE_APPLICATION_TABLES) await tx.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
    });
    console.log('Application tables truncated successfully.');
  } finally {
    await database.close();
  }
}

reset().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unexpected reset failure');
  process.exitCode = 1;
});

