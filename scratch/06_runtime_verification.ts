import { createDatabase } from '../backend/src/db/client.js';
import { createRepository } from '../backend/src/db/repository.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function verifyRuntime() {
  console.log('=== STEP F: POST-RESET RUNTIME & PERSISTENCE VERIFICATION ===');
  
  const dbClient = createDatabase();
  const db = dbClient.db;
  const repo = createRepository(db);
  
  // 1. Verify Database State
  const countsRes = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM sessions) as sessions,
      (SELECT COUNT(*) FROM umkms) as umkms,
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM media_assets) as media_assets,
      (SELECT COUNT(*) FROM public_events) as public_events,
      (SELECT COUNT(*) FROM audit_logs) as audit_logs
  `);
  
  const c = Array.isArray(countsRes) ? countsRes[0] : (countsRes as any).rows[0];
  console.log(`Database Counts:`, c);
  
  if (Number(c.users) !== 1) throw new Error(`VERIFICATION_FAILED: Expected 1 user, found ${c.users}`);
  if (Number(c.umkms) !== 0) throw new Error(`VERIFICATION_FAILED: Expected 0 UMKMs, found ${c.umkms}`);
  if (Number(c.products) !== 0) throw new Error(`VERIFICATION_FAILED: Expected 0 products, found ${c.products}`);
  if (Number(c.media_assets) !== 0) throw new Error(`VERIFICATION_FAILED: Expected 0 media assets, found ${c.media_assets}`);
  if (Number(c.public_events) !== 0) throw new Error(`VERIFICATION_FAILED: Expected 0 public events, found ${c.public_events}`);
  
  // 2. Verify Remaining User is Real Owner
  const usersRes = await db.execute(sql`SELECT id, email, username, role, is_active FROM users`);
  const uRows = Array.isArray(usersRes) ? usersRes : (usersRes as any).rows;
  const owner = uRows[0];
  
  console.log(`Remaining User Details:`);
  console.log(`- ID: ${owner.id}`);
  console.log(`- Email (redacted): ${owner.email.replace(/(?<=^.{2}).*(?=@)/, '***')}`);
  console.log(`- Username: ${owner.username}`);
  console.log(`- Role: ${owner.role}`);
  console.log(`- Active: ${owner.is_active}`);
  
  if (owner.email.endsWith('@local.test')) throw new Error('VERIFICATION_FAILED: Preserved user is @local.test');
  if (owner.role !== 'superadmin') throw new Error('VERIFICATION_FAILED: Preserved user is not superadmin');
  
  // 3. Verify Live HTTP API Endpoints
  console.log(`\n--- Live HTTP Endpoints Check ---`);
  const healthRes = await fetch('https://loningmarketplace.onrender.com/api/health');
  console.log(`- GET /api/health: ${healthRes.status}`);
  if (healthRes.status !== 200) throw new Error('/api/health did not return 200');
  
  const readyRes = await fetch('https://loningmarketplace.onrender.com/api/ready');
  console.log(`- GET /api/ready: ${readyRes.status}`);
  if (readyRes.status !== 200) throw new Error('/api/ready did not return 200');
  
  const productsRes = await fetch('https://loningmarketplace.onrender.com/api/products?limit=10');
  const productsJson = await productsRes.json() as any;
  console.log(`- GET /api/products count: ${productsJson.data ? productsJson.data.length : 0}`);
  if (productsJson.data && productsJson.data.length !== 0) throw new Error('Products API is not empty!');
  
  const umkmsRes = await fetch('https://loningmarketplace.onrender.com/api/umkms?limit=10');
  const umkmsJson = await umkmsRes.json() as any;
  console.log(`- GET /api/umkms count: ${umkmsJson.data ? umkmsJson.data.length : 0}`);
  if (umkmsJson.data && umkmsJson.data.length !== 0) throw new Error('UMKMs API is not empty!');

  console.log(`\nPOST-RESET RUNTIME & PERSISTENCE VERIFICATION PASSED! ALL CHECKS PASS!`);
  await dbClient.close();
}

verifyRuntime().catch((e) => {
  console.error('Error in Step F:', e.message || e);
  process.exit(1);
});
