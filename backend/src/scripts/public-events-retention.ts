import { createDatabase } from '../db/client.js';
import { createRepository } from '../db/repository.js';
import { assertDisposableDatabase } from '../../../scripts/lib/disposable-db-safety.mjs';
import { loadEnv } from '../config/env.js';

const apply = process.argv.includes('--apply');
const env = loadEnv();
if (apply) assertDisposableDatabase({ ...process.env, DATABASE_URL: env.DATABASE_URL });
const database = createDatabase(env.DATABASE_URL);
const repository = createRepository(database.db);
const cutoff = new Date(Date.now() - 400 * 86_400_000);
try {
  const candidates = await repository.countPublicEventsBefore(cutoff);
  let deleted = 0;
  if (apply) while (deleted < candidates) { const batch = await repository.deletePublicEventsBefore(cutoff, 1_000); deleted += batch; if (!batch) break; }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', cutoff: cutoff.toISOString(), candidates, deleted }));
} finally { await database.close(); }