import { loadEnv, mediaConfig } from '../config/env.js';
import { createDatabase } from '../db/client.js';
import { createRepository } from '../db/repository.js';
import { createMediaStorage } from '../media/storage.js';

const env = loadEnv();
const database = createDatabase(env.DATABASE_URL);
const repository = createRepository(database.db);
const storage = createMediaStorage(mediaConfig(env));
const before = new Date(Date.now() - (env.MEDIA_ORPHAN_GRACE_HOURS ?? 24) * 60 * 60 * 1000);
try {
  for (const asset of await repository.listExpiredOrphanMedia(before)) {
    if (await repository.mediaReferenceCount(asset.id)) { await repository.refreshMediaOrphans([asset.id]); continue; }
    try { await storage.deleteObject(asset.cardStorageKey); await storage.deleteObject(asset.thumbnailStorageKey); } catch { continue; }
    await repository.transaction(async (tx) => { await tx.purgeMediaAsset(asset.id); await tx.addAudit({ actorUserId: null, action: 'media.cleaned_up', entityType: 'media_asset', entityId: asset.id }); });
  }
} finally { await database.close(); }
