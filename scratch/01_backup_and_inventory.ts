import { createDatabase } from '../backend/src/db/client.js';
import { sql } from 'drizzle-orm';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: 'backend/.env' });

async function runBackupAndInventory() {
  console.log('=== STEP A: DATABASE BACKUP & R2 INVENTORY ===');
  
  const dbClient = createDatabase();
  const db = dbClient.db;
  
  // Get all tables in public schema
  const tablesRes: any = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  const rows = Array.isArray(tablesRes) ? tablesRes : tablesRes.rows || [];
  const tables = rows.map((r: any) => r.table_name);
  console.log(`Found ${tables.length} tables in public schema: ${tables.join(', ')}`);
  
  const dumpData: Record<string, any[]> = {};
  let totalRows = 0;
  
  for (const table of tables) {
    const res: any = await db.execute(sql.raw(`SELECT * FROM "${table}"`));
    const tableRows = Array.isArray(res) ? res : res.rows || [];
    dumpData[table] = tableRows;
    totalRows += tableRows.length;
    console.log(`- Backed up table "${table}": ${tableRows.length} rows`);
  }
  
  const backupPayload = {
    timestamp: new Date().toISOString(),
    database_host: 'pg-10427701-students-e31f.k.aivencloud.com',
    tables,
    total_rows: totalRows,
    data: dumpData,
  };
  
  const scratchDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  
  const backupPath = path.join(scratchDir, `postgres_backup_v1.6.1_${Date.now()}.json`);
  const jsonContent = JSON.stringify(backupPayload, null, 2);
  fs.writeFileSync(backupPath, jsonContent, 'utf-8');
  
  const checksum = crypto.createHash('sha256').update(jsonContent).digest('hex');
  const backupSize = fs.statSync(backupPath).size;
  
  console.log(`\nPostgreSQL Backup Created:`);
  console.log(`- Path: ${backupPath}`);
  console.log(`- Size: ${backupSize} bytes`);
  console.log(`- SHA-256: ${checksum}`);
  console.log(`- Rows backed up: ${totalRows}`);
  
  // Verify backup readability
  const parsed = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  if (parsed.total_rows !== totalRows) throw new Error('Backup verification failed!');
  console.log(`- Backup verification: PASS`);

  // 2. R2 Inventory Audit
  console.log(`\n--- R2 Media Inventory Audit ---`);
  const s3 = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
  
  const bucketName = process.env.S3_BUCKET || 'loning-media';
  const listCmd = new ListObjectsV2Command({ Bucket: bucketName });
  const r2Res = await s3.send(listCmd);
  const r2Objects = r2Res.Contents || [];
  
  console.log(`R2 Bucket: ${bucketName}`);
  console.log(`Total R2 Objects in Bucket: ${r2Objects.length}`);
  
  const dbMediaAssets = dumpData['media_assets'] || [];
  const dbMediaKeys = new Set(dbMediaAssets.map((m: any) => m.storage_key || m.storageKey));
  
  let referencedCount = 0;
  let orphanCount = 0;
  let unknownCount = 0;
  
  const inventoryList = r2Objects.map((obj) => {
    const key = obj.Key || '';
    const isDbReferenced = dbMediaKeys.has(key);
    const isAppPrefix = key.startsWith('products/') || key.startsWith('umkms/') || key.startsWith('media/') || key.startsWith('uploads/') || key.startsWith('seed-');
    
    if (isDbReferenced) referencedCount++;
    else if (isAppPrefix) orphanCount++;
    else unknownCount++;
    
    return {
      key,
      size: obj.Size,
      lastModified: obj.LastModified,
      isDbReferenced,
      isAppPrefix,
    };
  });
  
  console.log(`R2 Inventory Breakdown:`);
  console.log(`- DB media records: ${dbMediaAssets.length}`);
  console.log(`- Referenced R2 objects: ${referencedCount}`);
  console.log(`- Orphan app R2 objects: ${orphanCount}`);
  console.log(`- Unknown non-app R2 objects: ${unknownCount}`);
  
  const inventoryPath = path.join(scratchDir, `r2_inventory_${Date.now()}.json`);
  fs.writeFileSync(inventoryPath, JSON.stringify({ bucket: bucketName, total: r2Objects.length, referencedCount, orphanCount, unknownCount, objects: inventoryList }, null, 2), 'utf-8');
  console.log(`- R2 Inventory saved to: ${inventoryPath}`);
  
  await dbClient.close();
}

runBackupAndInventory().catch((e) => {
  console.error('Error in Step A:', e);
  process.exit(1);
});
