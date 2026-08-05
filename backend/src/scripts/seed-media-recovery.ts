import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { loadEnv, mediaConfig } from '../config/env.js';
import { createMediaStorage } from '../media/storage.js';

const sourceDir = fileURLToPath(new URL('../../../assets/seed-source/', import.meta.url));
const apply = process.argv.includes('--apply');
const fixtures = [
  ...Array.from({ length: 52 }, (_, index) => ({ source: `product-${String(index + 1).padStart(2, '0')}.jpg`, key: `seed-product-${String(index + 1).padStart(2, '0')}` })),
  ...Array.from({ length: 15 }, (_, index) => ({ source: `umkm-${String(index + 1).padStart(2, '0')}.jpg`, key: `seed-umkm-${String(index + 1).padStart(2, '0')}` })),
];

async function main() {
  const env = loadEnv(false);
  const storage = createMediaStorage(mediaConfig(env));
  let missing = 0;
  let restored = 0;

  console.log(`Seed media recovery mode: ${apply ? 'APPLY' : 'READ_ONLY'}`);
  for (const fixture of fixtures) {
    const cardKey = `media/${fixture.key}.webp`;
    const thumbKey = `media/${fixture.key}-thumb.webp`;
    const cardMissing = !(await storage.exists(cardKey));
    const thumbMissing = !(await storage.exists(thumbKey));
    missing += Number(cardMissing) + Number(thumbMissing);
    if (!apply || (!cardMissing && !thumbMissing)) continue;

    const source = await readFile(path.join(sourceDir, fixture.source));
    const card = await sharp(source).resize(1000, 700, { fit: 'cover', position: 'attention' }).webp({ quality: 88 }).toBuffer();
    const thumb = await sharp(card).resize(240, 168, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
    if (cardMissing) {
      await storage.putObject(cardKey, { body: card, contentType: 'image/webp', cacheControl: 'public, max-age=31536000' });
      restored++;
    }
    if (thumbMissing) {
      await storage.putObject(thumbKey, { body: thumb, contentType: 'image/webp', cacheControl: 'public, max-age=31536000' });
      restored++;
    }
  }

  console.log(`Seed objects checked: ${fixtures.length * 2}`);
  console.log(`Missing before recovery: ${missing}`);
  console.log(`Restored: ${restored}`);
  if (!apply && missing) console.log('No writes performed. Re-run with --apply after reviewing the target environment.');
}

main().catch((error) => {
  console.error(`SEED_MEDIA_RECOVERY_FAILURE: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
