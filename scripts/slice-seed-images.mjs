import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const [root, culinary, craft, service, grocery, farm, umkm] = process.argv.slice(2);
const output = path.join(root, 'assets', 'seed-source');
await mkdir(output, { recursive: true });
const sheets = [
  { file: culinary, columns: 4, rows: 3, prefix: 'product', offset: 0 },
  { file: craft, columns: 4, rows: 2, prefix: 'product', offset: 12 },
  { file: service, columns: 4, rows: 2, prefix: 'product', offset: 20 },
  { file: grocery, columns: 4, rows: 3, prefix: 'product', offset: 28 },
  { file: farm, columns: 4, rows: 3, prefix: 'product', offset: 40 },
  { file: umkm, columns: 5, rows: 3, prefix: 'umkm', offset: 0 },
];
for (const sheet of sheets) {
  const image = sharp(sheet.file);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${sheet.file}`);
  for (let row = 0; row < sheet.rows; row++) for (let column = 0; column < sheet.columns; column++) {
    const left = Math.round(column * metadata.width / sheet.columns);
    const top = Math.round(row * metadata.height / sheet.rows);
    const right = Math.round((column + 1) * metadata.width / sheet.columns);
    const bottom = Math.round((row + 1) * metadata.height / sheet.rows);
    const index = sheet.offset + row * sheet.columns + column + 1;
    await sharp(sheet.file).extract({ left, top, width: right - left, height: bottom - top }).jpeg({ quality: 92 }).toFile(path.join(output, `${sheet.prefix}-${String(index).padStart(2, '0')}.jpg`));
  }
}
console.log('Created 52 product and 15 UMKM source images.');
