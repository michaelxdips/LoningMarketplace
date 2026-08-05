import { createDatabase } from '../backend/src/db/client.js';
import { fingerprintDatabaseTarget } from '../backend/src/db/target-safety.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const CONFIRMATION_TOKEN = 'RESET-LONING-PRODUCTION-CONTENT-V1.6.1';

async function runReset() {
  const isApply = process.argv.includes('--apply');
  const dryRun = !isApply || process.argv.includes('--dry-run');
  
  const tokenArg = process.argv.find(a => a.startsWith('--confirm='));
  const confirmToken = tokenArg ? tokenArg.split('=')[1] : '';
  
  const preserveArg = process.argv.find(a => a.startsWith('--preserve-user-id='));
  const preserveUserId = preserveArg ? preserveArg.split('=')[1] : '';
  
  console.log(`=== STEP D: TRANSACTIONAL DATABASE RESET (${dryRun ? 'DRY-RUN' : 'APPLY'}) ===`);
  
  if (isApply && confirmToken !== CONFIRMATION_TOKEN) {
    throw new Error(`RESET_REFUSED: Exact confirmation token required: --confirm=${CONFIRMATION_TOKEN}`);
  }
  
  if (!preserveUserId) {
    throw new Error('RESET_REFUSED: --preserve-user-id=<OWNER_ID> is required');
  }
  
  // Guard target DB
  const dbUrl = process.env.DATABASE_URL || '';
  const target = fingerprintDatabaseTarget(dbUrl);
  if (!/(?:aivencloud|\.render\.com|loningmarketplace)/i.test(target.host) && !/(?:^|_)(?:prod|production|live)(?:_|$)/i.test(target.database)) {
    throw new Error('RESET_REFUSED: Target database is not production');
  }
  
  const dbClient = createDatabase();
  const db = dbClient.db;
  
  // Verify preserved owner
  const ownerRes = await db.execute(sql`SELECT id, email, username, role, is_active FROM users WHERE id = ${preserveUserId}`);
  const ownerRows = Array.isArray(ownerRes) ? ownerRes : (ownerRes as any).rows || [];
  if (ownerRows.length !== 1) throw new Error(`RESET_REFUSED: Preserved user ID ${preserveUserId} not found`);
  
  const owner = ownerRows[0];
  if (!owner.is_active) throw new Error('RESET_REFUSED: Preserved user is inactive');
  if (owner.role !== 'superadmin') throw new Error('RESET_REFUSED: Preserved user is not superadmin');
  if (owner.email.endsWith('@local.test')) throw new Error('RESET_REFUSED: Preserved user cannot be @local.test');
  
  console.log(`Preserved Owner Validated:`);
  console.log(`- ID: ${owner.id}`);
  console.log(`- Email (redacted): ${owner.email.replace(/(?<=^.{2}).*(?=@)/, '***')}`);
  console.log(`- Role: ${owner.role}`);
  console.log(`- Active: ${owner.is_active}`);
  
  // Get before counts
  const beforeCounts = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM sessions) as sessions,
      (SELECT COUNT(*) FROM umkms) as umkms,
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM media_assets) as media_assets,
      (SELECT COUNT(*) FROM public_events) as public_events,
      (SELECT COUNT(*) FROM audit_logs) as audit_logs
  `);
  
  const b = Array.isArray(beforeCounts) ? beforeCounts[0] : (beforeCounts as any).rows[0];
  console.log(`\nBefore Reset Counts:`, b);
  
  if (dryRun) {
    console.log(`\n--- DRY-RUN PLAN ---`);
    console.log(`- Preserved User ID: ${owner.id}`);
    console.log(`- Users to delete: ${Number(b.users) - 1} (5 seed users with @local.test)`);
    console.log(`- Sessions to delete: ${b.sessions}`);
    console.log(`- UMKMs to delete: ${b.umkms}`);
    console.log(`- Products to delete: ${b.products}`);
    console.log(`- Media assets to delete: ${b.media_assets}`);
    console.log(`- Public events to delete: ${b.public_events}`);
    console.log(`- Historical seed audit logs to delete: ${b.audit_logs}`);
    console.log(`- Operational bootstrap/reset audit logs to preserve: auth.superadmin_bootstrapped`);
    console.log(`\nTo execute actual deletion, run with: --apply --preserve-user-id=${owner.id} --confirm=${CONFIRMATION_TOKEN}`);
    await dbClient.close();
    return;
  }
  
  // Execution in DB Transaction
  console.log(`\nExecuting Reset Transaction...`);
  
  await db.transaction(async (tx) => {
    // 1. Delete Sessions
    await tx.execute(sql`DELETE FROM sessions`);
    
    // 2. Delete Public Events (references UMKMs & Products)
    await tx.execute(sql`DELETE FROM public_events`);
    
    // 3. Delete Products (references UMKMs & Media Assets)
    await tx.execute(sql`DELETE FROM products`);
    
    // 4. Delete UMKMs
    await tx.execute(sql`DELETE FROM umkms`);
    
    // 5. Delete Media Assets
    await tx.execute(sql`DELETE FROM media_assets`);
    
    // 6. Delete test users (all users except preserved owner)
    await tx.execute(sql`DELETE FROM users WHERE id <> ${preserveUserId}`);
    
    // 7. Delete historical seed audit logs (keep bootstrap audit)
    await tx.execute(sql`DELETE FROM audit_logs WHERE action <> 'auth.superadmin_bootstrapped'`);
    
    // 8. Add operational audit event
    await tx.execute(sql`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata, created_at)
      VALUES (${preserveUserId}, 'production.content_reset_completed', 'system', '{"source":"v1.6.1-reset-script"}', NOW())
    `);
  });
  
  // Get after counts
  const afterCounts = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM sessions) as sessions,
      (SELECT COUNT(*) FROM umkms) as umkms,
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM media_assets) as media_assets,
      (SELECT COUNT(*) FROM public_events) as public_events,
      (SELECT COUNT(*) FROM audit_logs) as audit_logs
  `);
  
  const a = Array.isArray(afterCounts) ? afterCounts[0] : (afterCounts as any).rows[0];
  console.log(`\nAfter Reset Counts:`, a);
  
  if (Number(a.users) !== 1) throw new Error('ASSERTION_FAILED: Expected exactly 1 user remaining');
  if (Number(a.umkms) !== 0) throw new Error('ASSERTION_FAILED: Expected 0 UMKMs');
  if (Number(a.products) !== 0) throw new Error('ASSERTION_FAILED: Expected 0 products');
  if (Number(a.media_assets) !== 0) throw new Error('ASSERTION_FAILED: Expected 0 media assets');
  if (Number(a.public_events) !== 0) throw new Error('ASSERTION_FAILED: Expected 0 public events');
  if (Number(a.sessions) !== 0) throw new Error('ASSERTION_FAILED: Expected 0 sessions');
  
  console.log(`\nTRANSACTIONAL DATABASE RESET COMPLETED SUCCESSFULLY!`);
  await dbClient.close();
}

runReset().catch((e) => {
  console.error('Error in Step D:', e.message || e);
  process.exit(1);
});
