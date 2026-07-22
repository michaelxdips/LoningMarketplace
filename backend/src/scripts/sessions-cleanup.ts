import { createDatabase } from '../db/client.js';
import { createRepository } from '../db/repository.js';
import { loadEnv } from '../config/env.js';

const database = createDatabase();
try { const env = loadEnv(); const before = new Date(Date.now() - env.SESSION_RETENTION_DAYS * 86_400_000); console.log(`Deleted ${await createRepository(database.db).cleanupSessions(before)} expired sessions beyond retention`); }
finally { await database.close(); }
