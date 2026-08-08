import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { UMKMS, productDeterministicId } from '../shared/ids.js';
import { SEED_DATES } from '../shared/dates.js';
import { slugify } from '../../../lib/slug.js';

export async function seedProducts(db: PostgresJsDatabase<typeof schema>) {
  const catalog = [
    [UMKMS.kuliner1, 'Nasi Megono Komplit', 18000, 'Nasi megono khas Pemalang dengan ayam goreng, telur, dan sambal daun jeruk.', 'Kuliner', 'Porsi'],
    [UMKMS.kuliner1, 'Mendoan Tempe Hangat', 12000, 'Lima potong tempe mendoan dengan sambal kecap cabai rawit.', 'Kuliner', 'Porsi'],
    [UMKMS.kuliner1, 'Paket Nasi Liwet Keluarga', 85000, 'Nasi liwet gurih lengkap dengan ayam, tahu, tempe, lalapan, dan sambal untuk empat orang.', 'Kuliner', 'Paket'],
    [UMKMS.kuliner1, 'Es Teh Gula Batu', 5000, 'Teh melati dingin dengan gula batu, cocok menemani makan siang.', 'Kuliner', 'Gelas'],
    [UMKMS.kuliner2, 'Kopi Robusta Loning 250g', 42000, 'Biji kopi robusta pilihan dari kebun lereng Loning, sangrai medium.', 'Kuliner', 'Pouch'],
    [UMKMS.kuliner2, 'Kopi Susu Aren', 15000, 'Espresso robusta lokal, susu segar, dan gula aren cair.', 'Kuliner', 'Gelas'],
    [UMKMS.kuliner2, 'Pisang Goreng Madu', 14000, 'Pisang kepok goreng renyah dengan madu dan taburan wijen.', 'Kuliner', 'Porsi'],
    [UMKMS.kuliner2, 'Es Kopi Susu Literan', 48000, 'Kopi susu gula aren dalam botol satu liter untuk acara keluarga.', 'Kuliner', 'Botol'],
    [UMKMS.kuliner3, 'Klepon Gula Jawa', 10000, 'Klepon pandan berisi gula jawa cair dan kelapa parut segar.', 'Kuliner', 'Kotak'],
    [UMKMS.kuliner3, 'Nagasari Pisang', 12000, 'Kue basah lembut berisi pisang raja dan santan, dibungkus daun pisang.', 'Kuliner', 'Kotak'],
    [UMKMS.kuliner3, 'Risoles Ragout Ayam', 18000, 'Risoles kulit tipis dengan isian ragout ayam dan sayuran.', 'Kuliner', 'Kotak'],
    [UMKMS.kuliner3, 'Tumpeng Mini Syukuran', 175000, 'Tumpeng nasi kuning mini dengan lauk tradisional untuk delapan porsi.', 'Kuliner', 'Paket'],
    [UMKMS.kerajinan1, 'Keranjang Bambu Serbaguna', 65000, 'Keranjang anyaman bambu kuat untuk hampers, buah, atau penyimpanan rumah.', 'Kerajinan & Olahan Kreatif', 'Buah'],
    [UMKMS.kerajinan1, 'Tampah Bambu Diameter 50cm', 55000, 'Tampah bambu handmade dengan anyaman rapat dan tepi kokoh.', 'Kerajinan & Olahan Kreatif', 'Buah'],
    [UMKMS.kerajinan1, 'Lampu Gantung Anyaman', 185000, 'Kap lampu anyaman bambu bernuansa hangat untuk ruang makan dan teras.', 'Kerajinan & Olahan Kreatif', 'Unit'],
    [UMKMS.kerajinan1, 'Souvenir Bambu Custom', 15000, 'Souvenir bambu dengan tulisan acara atau nama keluarga sesuai pesanan.', 'Kerajinan & Olahan Kreatif', 'Pcs'],
    [UMKMS.kerajinan2, 'Papan Nama Kayu Jati', 175000, 'Papan nama rumah dari kayu jati dengan ukiran dan finishing natural.', 'Kerajinan & Olahan Kreatif', 'Pcs'],
    [UMKMS.kerajinan2, 'Nampan Kayu Ukir', 135000, 'Nampan kayu jati dengan pegangan dan ukiran motif daun.', 'Kerajinan & Olahan Kreatif', 'Pcs'],
    [UMKMS.kerajinan2, 'Bangku Kayu Minimalis', 320000, 'Bangku kayu jati solid untuk teras, ruang tamu, atau warung.', 'Kerajinan & Olahan Kreatif', 'Unit'],
    [UMKMS.kerajinan2, 'Kotak Tisu Kayu', 85000, 'Kotak tisu kayu dengan ukiran sederhana dan lapisan pelindung doff.', 'Kerajinan & Olahan Kreatif', 'Pcs'],
    [UMKMS.jasa1, 'Servis Motor Ringan', 45000, 'Pemeriksaan dan servis ringan motor, termasuk setel rantai serta rem.', 'Jasa & Otomotif', 'Motor'],
    [UMKMS.jasa1, 'Ganti Oli Mesin', 65000, 'Jasa ganti oli mesin motor dengan pemeriksaan kondisi oli dan kebocoran.', 'Jasa & Otomotif', 'Motor'],
    [UMKMS.jasa1, 'Tambal Ban Tubeless', 20000, 'Perbaikan ban tubeless bocor dengan pemeriksaan pentil dan tekanan angin.', 'Jasa & Otomotif', 'Ban'],
    [UMKMS.jasa1, 'Cuci Motor Komplit', 15000, 'Cuci motor dengan sabun khusus, semir ban, dan pengeringan.', 'Jasa & Otomotif', 'Motor'],
    [UMKMS.jasa2, 'Pijat Relaksasi 60 Menit', 70000, 'Pijat relaksasi untuk membantu mengurangi pegal setelah bekerja.', 'Jasa & Otomotif', 'Sesi'],
    [UMKMS.jasa2, 'Pijat Refleksi Kaki', 55000, 'Pijat refleksi kaki dengan minyak herbal selama 45 menit.', 'Jasa & Otomotif', 'Sesi'],
    [UMKMS.jasa2, 'Pangkas Rambut Pria', 18000, 'Pangkas rambut pria rapi dengan layanan keramas ringan.', 'Jasa & Otomotif', 'Orang'],
    [UMKMS.jasa2, 'Cukur Anak dan Balita', 15000, 'Layanan cukur nyaman untuk anak dan balita dengan janji terlebih dahulu.', 'Jasa & Otomotif', 'Orang'],
    [UMKMS.sembako1, 'Beras Premium 5kg', 76000, 'Beras pulen kemasan lima kilogram untuk kebutuhan makan keluarga.', 'Sembako & Kebutuhan Harian', 'Karung'],
    [UMKMS.sembako1, 'Minyak Goreng 1 Liter', 18500, 'Minyak goreng kemasan satu liter untuk kebutuhan dapur harian.', 'Sembako & Kebutuhan Harian', 'Botol'],
    [UMKMS.sembako1, 'Gula Pasir 1kg', 17500, 'Gula pasir putih bersih dalam kemasan satu kilogram.', 'Sembako & Kebutuhan Harian', 'Paket'],
    [UMKMS.sembako1, 'Telur Ayam 1kg', 30000, 'Telur ayam segar pilihan, tersedia setiap pagi.', 'Sembako & Kebutuhan Harian', 'Kg'],
    [UMKMS.sembako2, 'Mi Instan Goreng Dus', 36000, 'Mi instan goreng satu dus untuk warung, acara, atau stok rumah.', 'Sembako & Kebutuhan Harian', 'Dus'],
    [UMKMS.sembako2, 'Air Mineral 600ml', 3500, 'Air mineral botol dingin atau suhu ruang untuk kebutuhan harian.', 'Sembako & Kebutuhan Harian', 'Botol'],
    [UMKMS.sembako2, 'Gas LPG 3kg', 22000, 'Tabung LPG tiga kilogram, ketersediaan mengikuti pasokan harian.', 'Sembako & Kebutuhan Harian', 'Tabung'],
    [UMKMS.sembako2, 'Sabun Cuci Piring 800ml', 14500, 'Sabun cuci piring cair dengan aroma jeruk untuk rumah tangga.', 'Sembako & Kebutuhan Harian', 'Botol'],
    [UMKMS.sembako3, 'Beras Medium 25kg', 345000, 'Beras medium kemasan grosir untuk warung makan dan kebutuhan keluarga besar.', 'Sembako & Kebutuhan Harian', 'Karung'],
    [UMKMS.sembako3, 'Telur Ayam Grosir', 285000, 'Telur ayam satu peti untuk warung dan pelaku usaha kuliner.', 'Sembako & Kebutuhan Harian', 'Peti'],
    [UMKMS.sembako3, 'Tepung Terigu 25kg', 245000, 'Tepung terigu serbaguna kemasan grosir untuk produksi makanan.', 'Sembako & Kebutuhan Harian', 'Karung'],
    [UMKMS.sembako3, 'Gula Merah 5kg', 115000, 'Gula merah batok pilihan untuk minuman, jajanan, dan masakan.', 'Sembako & Kebutuhan Harian', 'Paket'],
    [UMKMS.pertanian1, 'Beras Organik Loning 5kg', 95000, 'Beras hasil panen petani Loning dengan proses sortasi dan pengeringan alami.', 'Pertanian, Peternakan & Perikanan', 'Karung'],
    [UMKMS.pertanian1, 'Benih Padi Inpari', 78000, 'Benih padi pilihan untuk satu petak lahan, siap tanam musim berikutnya.', 'Pertanian, Peternakan & Perikanan', 'Kg'],
    [UMKMS.pertanian1, 'Dedak Halus 10kg', 45000, 'Dedak halus segar untuk campuran pakan unggas dan ternak.', 'Pertanian, Peternakan & Perikanan', 'Karung'],
    [UMKMS.pertanian1, 'Jasa Bajak Sawah', 350000, 'Jasa pengolahan awal lahan sawah menggunakan mesin bajak.', 'Pertanian, Peternakan & Perikanan', 'Petak'],
    [UMKMS.pertanian2, 'Paket Sayur Hidroponik', 25000, 'Paket sayur segar berisi selada, pakcoy, dan kangkung hasil panen pagi.', 'Pertanian, Peternakan & Perikanan', 'Paket'],
    [UMKMS.pertanian2, 'Cabai Rawit Segar', 42000, 'Cabai rawit merah segar hasil kebun warga, dipanen sesuai pesanan.', 'Pertanian, Peternakan & Perikanan', 'Kg'],
    [UMKMS.pertanian2, 'Tomat Segar', 18000, 'Tomat merah segar untuk rumah tangga, warung, dan katering.', 'Pertanian, Peternakan & Perikanan', 'Kg'],
    [UMKMS.pertanian2, 'Bibit Cabai Siap Tanam', 2500, 'Bibit cabai sehat dalam polybag, cocok untuk kebun rumah.', 'Pertanian, Peternakan & Perikanan', 'Pohon'],
    [UMKMS.pertanian3, 'Telur Ayam Kampung', 38000, 'Telur ayam kampung segar dari peternakan lokal.', 'Pertanian, Peternakan & Perikanan', 'Kg'],
    [UMKMS.pertanian3, 'Ayam Kampung Potong', 85000, 'Ayam kampung segar berdasarkan bobot, tersedia dengan pemesanan.', 'Pertanian, Peternakan & Perikanan', 'Ekor'],
    [UMKMS.pertanian3, 'Pakan Ayam Petelur 10kg', 165000, 'Pakan ayam petelur kemasan sepuluh kilogram untuk peternak kecil.', 'Pertanian, Peternakan & Perikanan', 'Karung'],
    [UMKMS.pertanian3, 'Pupuk Kompos 25kg', 55000, 'Pupuk kompos matang dari bahan organik untuk kebun dan tanaman pangan.', 'Pertanian, Peternakan & Perikanan', 'Karung'],
  ] as const;

  const imageByCategory: Record<string, string> = {
    Kuliner: 'http://localhost:3001/media/catalog-kuliner.webp',
    'Kerajinan & Olahan Kreatif': 'http://localhost:3001/media/catalog-kerajinan.webp',
    'Jasa & Otomotif': 'http://localhost:3001/media/catalog-jasa.webp',
    'Sembako & Kebutuhan Harian': 'http://localhost:3001/media/catalog-sembako.webp',
    'Pertanian, Peternakan & Perikanan': 'http://localhost:3001/media/catalog-pertanian.webp',
    'Fashion & Konveksi': 'http://localhost:3001/media/catalog-fashion.webp',
    'Bahan Bangunan & Material': 'http://localhost:3001/media/catalog-bangunan.webp',
    'Ritel & Perabot': 'http://localhost:3001/media/catalog-ritel.webp',
    Lainnya: 'http://localhost:3001/media/catalog-lainnya.webp',
  };
  const products = catalog.map(([umkmId, name, price, description, category, unit], index) => ({
    id: productDeterministicId(index + 1), umkmId, name, slug: slugify(name, 'produk'), price, description, category,
    imageUrl: imageByCategory[category as string],
    isAvailable: true, unit, displayOrder: (index % 4) + 1,
    publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent,
    createdAt: SEED_DATES.old, updatedAt: SEED_DATES.recent,
  }));

  // Seed-only cleanup: manual records and E2E fixtures use different ID namespaces.
  await db.delete(schema.publicEvents).where(sql`${schema.publicEvents.productId}::text LIKE 'e3000000-%'`);
  await db.delete(schema.products).where(sql`${schema.products.id}::text LIKE 'e3000000-%'`);
  for (let i = 0; i < products.length; i += 20) {
    await db.insert(schema.products).values(products.slice(i, i + 20));
  }

  // Preserve controlled lifecycle cases for browser and management testing.
  const unavailable = products[20];
  const noPrice = products[39];
  const draft = products[44];
  const archived = products[47];
  await db.update(schema.products).set({ isAvailable: false }).where(sql`${schema.products.id} = ${unavailable.id}`);
  await db.update(schema.products).set({ price: null }).where(sql`${schema.products.id} = ${noPrice.id}`);
  await db.update(schema.products).set({ publicationStatus: 'draft', publishedAt: null }).where(sql`${schema.products.id} = ${draft.id}`);
  await db.update(schema.products).set({ publicationStatus: 'archived', publishedAt: null }).where(sql`${schema.products.id} = ${archived.id}`);
}
