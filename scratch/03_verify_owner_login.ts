import { createDatabase } from '../backend/src/db/client.js';
import { createRepository } from '../backend/src/db/repository.js';
import { security } from '../backend/src/auth/security.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function verifyOwner() {
  console.log('=== STEP C: OWNER LOGIN & ACCOUNT VERIFICATION ===');
  
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const username = (process.env.BOOTSTRAP_ADMIN_USERNAME || '').trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  
  const dbClient = createDatabase();
  const repo = createRepository(dbClient.db);
  
  // 1. Query user by email / username
  const userByEmail = await repo.findUserByEmail(email);
  const userByUsername = await repo.findUserByUsername(username);
  
  if (!userByEmail || !userByUsername || userByEmail.id !== userByUsername.id) {
    throw new Error('VERIFICATION_FAILED: Owner user record not found by email or username');
  }
  
  const owner = userByEmail;
  console.log(`Owner Account Found:`);
  console.log(`- User ID: ${owner.id}`);
  console.log(`- Email (redacted): ${owner.email.replace(/(?<=^.{2}).*(?=@)/, '***')}`);
  console.log(`- Username: ${owner.username}`);
  console.log(`- Role: ${owner.role}`);
  console.log(`- Active: ${owner.isActive}`);
  console.log(`- Must Change Password: ${owner.mustChangePassword}`);
  
  // 2. Verify Password
  const passValid = await security.verifyPassword(owner.passwordHash, password);
  if (!passValid) throw new Error('VERIFICATION_FAILED: Password verification failed');
  console.log(`- Password Verification: PASS`);
  
  // 3. Verify Role & Capabilities
  if (owner.role !== 'superadmin') throw new Error('VERIFICATION_FAILED: Role is not superadmin');
  if (!owner.isActive) throw new Error('VERIFICATION_FAILED: Account is not active');
  console.log(`- Role & Active State: PASS`);

  // 4. Verify Total Users & Superadmins in DB
  const allUsers = await repo.listUsers({ limit: 100 });
  const superadmins = allUsers.filter(u => u.role === 'superadmin');
  const testUsers = allUsers.filter(u => u.email.endsWith('@local.test'));
  
  console.log(`\nDatabase Counts Check:`);
  console.log(`- Total Users: ${allUsers.length}`);
  console.log(`- Real Owner Users: 1`);
  console.log(`- Seed/Test Users: ${testUsers.length}`);
  console.log(`- Real Superadmins: ${superadmins.length}`);
  
  if (allUsers.length !== 6) throw new Error(`VERIFICATION_FAILED: Expected 6 users before reset, found ${allUsers.length}`);
  if (testUsers.length !== 5) throw new Error(`VERIFICATION_FAILED: Expected 5 test users before reset, found ${testUsers.length}`);
  
  console.log(`\nOWNER LOGIN VERIFICATION COMPLETE: ALL GATES PASS`);
  await dbClient.close();
}

verifyOwner().catch((e) => {
  console.error('Error in Step C:', e.message || e);
  process.exit(1);
});
