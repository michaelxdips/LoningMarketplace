import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { UMKMS, USERS } from '../shared/ids.js';
import { SEED_DATES } from '../shared/dates.js';

export async function seedUmkms(db: PostgresJsDatabase<typeof schema>) {
  const umkms = [
    { id: UMKMS.kuliner1, name: 'Warung Nasi Khas Loning', owner: 'Siti Aminah', description: 'Masakan rumahan khas Pemalang, nasi megono, dan lauk harian yang dimasak segar setiap pagi.', phone: '6281234567890', category: 'Kuliner' as const, address: 'Jl. Desa Loning RT 01/RW 01', ownerUserId: USERS.owner1, displayOrder: 1, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.kuliner2, name: 'Kedai Kopi Lereng', owner: 'Budi Santoso', description: 'Kedai kopi robusta lokal dengan suasana sederhana untuk warga dan pelintas Desa Loning.', phone: '6281234567891', category: 'Kuliner' as const, address: 'Jl. Raya Loning RT 02/RW 01', ownerUserId: USERS.owner2, displayOrder: 2, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.kuliner3, name: 'Dapur Jajan Bu Tatik', owner: 'Tatik Kurniasih', description: 'Jajanan pasar, kue basah, dan tumpeng pesanan untuk arisan serta acara keluarga.', phone: '6281234567892', category: 'Kuliner' as const, address: 'Gang Melati RT 03/RW 01', ownerUserId: null, displayOrder: 3, publicationStatus: 'draft' as const, publishedAt: null, imageUrl: null },

    { id: UMKMS.kerajinan1, name: 'Anyaman Bambu Kreatif', owner: 'Daryono', description: 'Keranjang, tampah, dan dekorasi rumah dari bambu pilihan buatan pengrajin lokal.', phone: '6281234567893', category: 'Kerajinan' as const, address: 'Dusun Krajan RT 04/RW 02', ownerUserId: USERS.owner1, displayOrder: 4, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.kerajinan2, name: 'Pahat Jati Asri', owner: 'Joko Supriyanto', description: 'Perabot kecil dan ukiran kayu jati yang dikerjakan manual sesuai pesanan.', phone: '6281234567894', category: 'Kerajinan' as const, address: 'Dusun Karangasem RT 05/RW 02', ownerUserId: USERS.owner2, displayOrder: 5, publicationStatus: 'published' as const, publishedAt: SEED_DATES.sortingTie, imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80' },

    { id: UMKMS.jasa1, name: 'Bengkel Motor Setia', owner: 'Adi Prasetyo', description: 'Servis ringan, ganti oli, tambal ban, dan perawatan motor warga Loning.', phone: '6281234567895', category: 'Jasa' as const, address: 'Jl. Raya Loning RT 01/RW 03', ownerUserId: null, displayOrder: 6, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: null },
    { id: UMKMS.jasa2, name: 'Pijat Sehat Mbah Surip', owner: 'Suripto', description: 'Layanan pijat tradisional dan refleksi berdasarkan janji untuk warga sekitar.', phone: '6281234567896', category: 'Jasa' as const, address: 'Gang Kenanga RT 02/RW 03', ownerUserId: null, displayOrder: 7, publicationStatus: 'archived' as const, publishedAt: null, imageUrl: null },

    { id: UMKMS.sembako1, name: 'Toko Kelontong Berkah', owner: 'Rahayu Wulandari', description: 'Kebutuhan dapur, perlengkapan mandi, dan bahan pokok untuk belanja harian.', phone: '6281234567897', category: 'Sembako' as const, address: 'Jl. Masjid RT 03/RW 03', ownerUserId: USERS.owner1, displayOrder: 8, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527b0f76?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.sembako2, name: 'Warung Pojok Loning', owner: 'Ningsih', description: 'Sembako eceran, minuman dingin, gas, dan jajanan anak dengan harga warga.', phone: '6281234567898', category: 'Sembako' as const, address: 'Perempatan Loning RT 04/RW 03', ownerUserId: USERS.owner2, displayOrder: 9, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: null },
    { id: UMKMS.sembako3, name: 'Grosir Loning Jaya', owner: 'H. Mulyono', description: 'Pemasok beras, telur, tepung, dan gula untuk warung serta usaha rumahan.', phone: '6281234567899', category: 'Sembako' as const, address: 'Jl. Pasar RT 05/RW 03', ownerUserId: null, displayOrder: 10, publicationStatus: 'published' as const, publishedAt: SEED_DATES.sortingTie, imageUrl: null },

    { id: UMKMS.pertanian1, name: 'Kelompok Tani Sri Makmur', owner: 'Slamet Riyadi', description: 'Kelompok petani padi yang menyediakan beras, benih, dedak, dan jasa olah lahan.', phone: '6281234567800', category: 'Pertanian' as const, address: 'Blok Sawah Utara RT 01', ownerUserId: USERS.owner1, displayOrder: 11, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: null },
    { id: UMKMS.pertanian2, name: 'Kebun Sayur Hijau', owner: 'Nur Aini', description: 'Sayuran hidroponik dan bibit tanaman yang dipanen segar sesuai pesanan.', phone: '6281234567801', category: 'Pertanian' as const, address: 'Blok Kebun Timur RT 02', ownerUserId: USERS.owner2, displayOrder: 12, publicationStatus: 'draft' as const, publishedAt: null, imageUrl: null },
    { id: UMKMS.pertanian3, name: 'Peternakan Ayam Sumber Rejeki', owner: 'Agus Setiawan', description: 'Telur dan ayam kampung dari peternakan skala keluarga dengan pasokan harian.', phone: '6281234567802', category: 'Pertanian' as const, address: 'Blok Kandang Selatan RT 03', ownerUserId: null, displayOrder: 13, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: null },

    { id: UMKMS.noProducts, name: 'Jahit Rapi Bu Aminah', owner: 'Aminah', description: 'Jasa permak dan jahit pakaian yang sedang menyiapkan daftar layanan daring.', phone: '6281234567803', category: 'Jasa' as const, address: 'Gang Mawar RT 01/RW 04', ownerUserId: null, displayOrder: 14, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: null },
    { id: UMKMS.inactive, name: 'Warung Lawas Loning', owner: 'Karsinah', description: 'Arsip usaha warung keluarga yang sudah tidak beroperasi.', phone: '6281234567804', category: 'Kuliner' as const, address: 'Jl. Desa Loning RT 02/RW 04', ownerUserId: USERS.owner3, displayOrder: 15, publicationStatus: 'archived' as const, publishedAt: null, imageUrl: null },
  ];

  for (const umkm of umkms) {
    await db.insert(schema.umkms).values({
      ...umkm,
      // ponytail: media assets are created later in this transaction; this source only satisfies the insert-time constraint.
      imageUrl: umkm.imageUrl ?? 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80',
      createdAt: SEED_DATES.old,
      updatedAt: SEED_DATES.recent,
    }).onConflictDoUpdate({
      target: schema.umkms.id,
      set: {
        name: sql`excluded.name`,
        owner: sql`excluded.owner`,
        description: sql`excluded.description`,
        phone: sql`excluded.phone`,
        category: sql`excluded.category`,
        imageUrl: sql`excluded.image_url`,
        address: sql`excluded.address`,
        ownerUserId: sql`excluded.owner_user_id`,
        displayOrder: sql`excluded.display_order`,
        publicationStatus: sql`excluded.publication_status`,
        publishedAt: sql`excluded.published_at`,
        updatedAt: sql`excluded.updated_at`
      }
    });
  }
}
