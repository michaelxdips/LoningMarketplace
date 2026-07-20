import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { loadEnv } from '../config/env.js';
import * as schema from './schema.js';

export function createDatabase(databaseUrl = loadEnv().DATABASE_URL) {
  const client = postgres(databaseUrl);
  return { db: drizzle(client, { schema }), close: () => client.end() };
}
