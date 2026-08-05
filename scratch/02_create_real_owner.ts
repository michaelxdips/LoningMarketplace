import { createDatabase } from '../backend/src/db/client.js';
import { createRepository } from '../backend/src/db/repository.js';
import { security } from '../backend/src/auth/security.js';
import { passwordSetterSchema, usernameSchema, normalizeUsername } from '../backend/src/auth/policy.js';
import { fingerprintDatabaseTarget } from '../backend/src/db/target-safety.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const CONFIRMATION_TOKEN = 'CREATE-REAL-PRODUCTION-OWNER-V1.6.1';

async function createRealOwner() {
  console.log('=== STEP B: ATOMIC GUARDED OWNER CREATION ===');
  
  const tokenArg = process.argv.find(a => a.startsWith('--confirm='));
  const confirmToken = tokenArg ? tokenArg.split('=')[1] : process.env.OWNER_CONFIRM_TOKEN;
  
  if (confirmToken !== CONFIRMATION_TOKEN) {
    throw new Error(`GUARD_REFUSED: Exact confirmation token required: --confirm=${CONFIRMATION_TOKEN}`);
  }
  
  // 1. Guard target database
  const dbUrl = process.env.DATABASE_URL || '';
  const target = fingerprintDatabaseTarget(dbUrl);
  if (!/(?:aivencloud|\.render\.com|loningmarketplace)/i.test(target.host) && !/(?:^|_)(?:prod|production|live)(?:_|$)/i.test(target.database)) {
    throw new Error('GUARD_REFUSED: Target database is not production');
  }
  
  // 2. Guard owner credentials
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const rawUsername = (process.env.BOOTSTRAP_ADMIN_USERNAME || '').trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  const displayName = (process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME || '').trim();
  
  if (!email || !rawUsername || !password || !displayName) {
    throw new Error('GUARD_REFUSED: BOOTSTRAP_ADMIN_* environment variables missing');
  }
  
  if (email.endsWith('@local.test') || email.endsWith('@example.com')) {
    throw new Error('GUARD_REFUSED: Email cannot be a test domain');
  }
  
  const username = normalizeUsername(rawUsername);
  if (['test', 'admin1', 'superadmin.test', 'admin.test'].includes(username)) {
    throw new Error('GUARD_REFUSED: Username cannot be a fixture/test identifier');
  }
  
  const parsedPass = passwordSetterSchema.safeParse(password);
  if (!parsedPass.success) {
    throw new Error(`GUARD_REFUSED: Password does not satisfy policy: ${parsedPass.error.message}`);
  }
  
  const parsedUser = usernameSchema.safeParse(username);
  if (!parsedUser.success) {
    throw new Error(`GUARD_REFUSED: Username does not satisfy policy: ${parsedUser.error.message}`);
  }
  
  const dbClient = createDatabase();
  const repo = createRepository(dbClient.db);
  
  // Check existing users & superadmins
  const existingSuperadmins = await repo.transaction(async (tx) => {
    return tx.listUsers({ role: 'superadmin' });
  });
  
  console.log(`Found ${existingSuperadmins.length} existing superadmin(s).`);
  for (const sa of existingSuperadmins) {
    if (!sa.email.endsWith('@local.test')) {
      throw new Error(`GUARD_REFUSED: Non-test superadmin already exists: ${sa.email}`);
    }
  }
  
  const emailExists = await repo.findUserByEmail(email);
  if (emailExists) throw new Error('GUARD_REFUSED: Owner email already exists');
  
  const usernameExists = await repo.findUserByUsername(username);
  if (usernameExists) throw new Error('GUARD_REFUSED: Owner username already exists');
  
  // Create Owner in DB transaction
  const passwordHash = await security.hashPassword(password);
  
  const newOwner = await repo.transaction(async (tx) => {
    const user = await tx.createUser({
      email,
      username,
      displayName,
      role: 'superadmin',
      passwordHash,
      mustChangePassword: true,
    });
    
    await tx.addAudit({
      actorUserId: null,
      action: 'auth.superadmin_bootstrapped',
      entityType: 'user',
      entityId: user.id,
      metadata: { actorType: 'system', source: 'guarded-production-bootstrap', at: new Date().toISOString() },
    });
    
    return user;
  });
  
  console.log(`\nREAL OWNER CREATED SUCCESSFULLY:`);
  console.log(`- User ID: ${newOwner.id}`);
  console.log(`- Email (redacted): ${email.replace(/(?<=^.{2}).*(?=@)/, '***')}`);
  console.log(`- Username: ${newOwner.username}`);
  console.log(`- Role: ${newOwner.role}`);
  console.log(`- Active: ${newOwner.isActive}`);
  console.log(`- Must Change Password: ${newOwner.mustChangePassword}`);
  
  await dbClient.close();
}

createRealOwner().catch((e) => {
  console.error('Error in Step B:', e.message || e);
  process.exit(1);
});
