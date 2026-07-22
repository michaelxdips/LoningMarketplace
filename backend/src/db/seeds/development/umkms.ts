import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema.js';
import { UMKMS, USERS } from '../shared/ids.js';
import { SEED_DATES } from '../shared/dates.js';

export async function seedUmkms(db: PostgresJsDatabase<typeof schema>) {
  const umkms = [
    { id: UMKMS.kuliner1, name: 'Warung Nasi Khas Loning', owner: 'Ibu Siti', description: 'Nasi campur dan ramesan lokal', phone: '6281234567890', category: 'Kuliner' as const, address: 'RT 01/RW 01', ownerUserId: USERS.owner1, displayOrder: 1, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.kuliner2, name: 'Kedai Kopi Lereng', owner: 'Bapak Budi', description: 'Kopi asli petik dari desa Loning', phone: '6281234567891', category: 'Kuliner' as const, address: 'RT 02/RW 01', ownerUserId: USERS.owner2, displayOrder: 2, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.kuliner3, name: 'Jajanan Pasar Tradisional Loning (Sangat Panjang Sekali)', owner: 'Pak Tono', description: 'Deskripsi yang juga sangat panjang sekali sehingga bisa memakan banyak ruang pada interface web, ini digunakan untuk tes layout panjang', phone: '6281234567892', category: 'Kuliner' as const, address: 'RT 03/RW 01', ownerUserId: null, displayOrder: 3, publicationStatus: 'draft' as const, publishedAt: null, imageUrl: null },
    
    { id: UMKMS.kerajinan1, name: 'Anyaman Bambu Kreatif', owner: 'Pengrajin Lokal', description: 'Kerajinan tangan bambu untuk dekorasi dan wadah', phone: '6281234567893', category: 'Kerajinan' as const, address: 'RT 04/RW 02', ownerUserId: USERS.owner1, displayOrder: 4, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.kerajinan2, name: 'Pahat Jati Asri', owner: 'Mbah Jo', description: '', phone: '6281234567894', category: 'Kerajinan' as const, address: 'RT 05/RW 02', ownerUserId: USERS.owner2, displayOrder: 5, publicationStatus: 'published' as const, publishedAt: SEED_DATES.sortingTie, imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80' },

    { id: UMKMS.jasa1, name: 'Bengkel Motor Setia', owner: 'Mas Adi', description: 'Servis motor warga Loning', phone: '6281234567895', category: 'Jasa' as const, address: 'RT 01/RW 03', ownerUserId: null, displayOrder: 6, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: null },
    { id: UMKMS.jasa2, name: 'Tukang Pijat Tradisional', owner: 'Mbah Surip', description: 'Pijat urut dan capek', phone: '6281234567896', category: 'Jasa' as const, address: 'RT 02/RW 03', ownerUserId: null, displayOrder: 7, publicationStatus: 'archived' as const, publishedAt: null, imageUrl: null },

    { id: UMKMS.sembako1, name: 'Toko Kelontong Berkah', owner: 'Bu Rahayu', description: 'Menyediakan semua kebutuhan dapur dan mandi', phone: '6281234567897', category: 'Sembako' as const, address: 'RT 03/RW 03', ownerUserId: USERS.owner1, displayOrder: 8, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527b0f76?auto=format&fit=crop&w=600&q=80' },
    { id: UMKMS.sembako2, name: 'Warung Pojok', owner: 'Bu Ningsih', description: 'Sembako dan jajanan anak', phone: '6281234567898', category: 'Sembako' as const, address: 'RT 04/RW 03', ownerUserId: USERS.owner2, displayOrder: 9, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: null },
    { id: UMKMS.sembako3, name: 'Grosir Loning Jaya', owner: 'Pak Haji', description: 'Grosir beras dan telur', phone: '6281234567899', category: 'Sembako' as const, address: 'RT 05/RW 03', ownerUserId: null, displayOrder: 10, publicationStatus: 'published' as const, publishedAt: SEED_DATES.sortingTie, imageUrl: null },

    { id: UMKMS.pertanian1, name: 'Kelompok Tani Padi', owner: 'Pak Tani', description: 'Padi kualitas unggul', phone: '6281234567800', category: 'Pertanian' as const, address: 'Sawah RT 01', ownerUserId: USERS.owner1, displayOrder: 11, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: null },
    { id: UMKMS.pertanian2, name: 'Kebun Sayur Hijau', owner: 'Bu Kebun', description: 'Sayur mayur segar hidroponik', phone: '6281234567801', category: 'Pertanian' as const, address: 'Kebun RT 02', ownerUserId: USERS.owner2, displayOrder: 12, publicationStatus: 'draft' as const, publishedAt: null, imageUrl: null },
    { id: UMKMS.pertanian3, name: 'Peternakan Ayam Telur', owner: 'Mas Peternak', description: 'Telur ayam negeri dan kampung', phone: '6281234567802', category: 'Pertanian' as const, address: 'Kandang RT 03', ownerUserId: null, displayOrder: 13, publicationStatus: 'published' as const, publishedAt: SEED_DATES.old, imageUrl: null },
    
    { id: UMKMS.noProducts, name: 'UMKM Kosong Produk', owner: 'Pemilik Kosong', description: 'Belum ada produk', phone: '6281234567803', category: 'Jasa' as const, address: 'RT 01', ownerUserId: null, displayOrder: 14, publicationStatus: 'published' as const, publishedAt: SEED_DATES.recent, imageUrl: null },
    { id: UMKMS.inactive, name: 'UMKM Inaktif/Archived', owner: 'Pemilik Lama', description: 'Sudah tutup usahanya', phone: '6281234567804', category: 'Kuliner' as const, address: 'RT 02', ownerUserId: USERS.owner3, displayOrder: 15, publicationStatus: 'archived' as const, publishedAt: null, imageUrl: null },
  ];

  for (const umkm of umkms) {
    await db.insert(schema.umkms).values({
      ...umkm,
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
