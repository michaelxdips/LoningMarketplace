import { loadEnv, mediaConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { buildApp } from './app.js';
import { createRepository } from './db/repository.js';
import { createMediaStorage } from './media/storage.js';

const env = loadEnv();
const database = createDatabase(env.DATABASE_URL);
const storage = createMediaStorage(mediaConfig(env));
const app = await buildApp(env, createRepository(database.db, (key) => storage.getPublicUrl(key)), { storage });
await app.listen({ port: env.PORT, host: env.HOST });
console.log(`Loning Maju API listening on ${env.HOST}:${env.PORT}`);
const shutdown = async () => { await app.close(); await database.close(); process.exit(0); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);