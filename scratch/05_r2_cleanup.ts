import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function cleanR2() {
  console.log('=== STEP E: R2 STORAGE CLEANUP ===');
  
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
  
  console.log(`Current R2 Objects in bucket ${bucketName}: ${r2Objects.length}`);
  
  const objectsToDelete: { Key: string }[] = [];
  const objectsToPreserve: string[] = [];
  
  for (const obj of r2Objects) {
    const key = obj.Key || '';
    const isAppSeedOrOrphan = key.startsWith('seed-') || key.startsWith('products/') || key.startsWith('umkms/') || key.startsWith('media/') || key.startsWith('uploads/');
    
    if (isAppSeedOrOrphan) {
      objectsToDelete.push({ Key: key });
    } else {
      objectsToPreserve.push(key);
    }
  }
  
  console.log(`- Objects planned for deletion: ${objectsToDelete.length}`);
  console.log(`- Unknown/other objects preserved: ${objectsToPreserve.length}`);
  
  if (objectsToDelete.length === 0) {
    console.log('No R2 objects to delete. R2 cleanup complete.');
    return;
  }
  
  const deleteCmd = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: { Objects: objectsToDelete, Quiet: false },
  });
  
  const delRes = await s3.send(deleteCmd);
  console.log(`\nDeleted R2 Objects Result:`);
  console.log(`- Deleted: ${delRes.Deleted?.length || 0}`);
  console.log(`- Errors: ${delRes.Errors?.length || 0}`);
  
  if (delRes.Errors && delRes.Errors.length > 0) {
    console.error('Delete errors:', delRes.Errors);
    throw new Error('Some R2 object deletions failed');
  }
  
  // Verify bucket state after delete
  const verifyRes = await s3.send(listCmd);
  console.log(`\nR2 Objects remaining after cleanup: ${(verifyRes.Contents || []).length}`);
  console.log(`R2 STORAGE CLEANUP COMPLETED SUCCESSFULLY!`);
}

cleanR2().catch((e) => {
  console.error('Error in Step E:', e.message || e);
  process.exit(1);
});
