/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UMKM, Product, VillageAnnouncement } from './types';

export const INITIAL_UMKMS: UMKM[] = [
  {
    id: 'umkm-1',
    name: 'UMKM Kuliner Desa',
    owner: 'Pemilik UMKM A',
    description: 'Deskripsi singkat produk lokal. Menyediakan berbagai macam kuliner tradisional khas yang diproduksi secara bersih, higienis, serta menggunakan bahan-bahan lokal pilihan dari hasil bumi Desa Loning.',
    phone: '6281234567890',
    category: 'Kuliner',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    address: 'RT 02/RW 01, Desa Loning, Petarukan, Pemalang',
    workingHours: '08:00 - 17:00 WIB'
  },
  {
    id: 'umkm-2',
    name: 'Mebel Kayu Jati Loning',
    owner: 'Pemilik UMKM B',
    description: 'Deskripsi singkat produk lokal. Menerima pesanan berbagai furnitur kayu berkualitas tinggi seperti kursi, meja, dan lemari yang dikerjakan langsung oleh pengrajin kayu terampil setempat.',
    phone: '6281234567891',
    category: 'Jasa',
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
    address: 'RT 05/RW 02, Desa Loning, Petarukan, Pemalang',
    workingHours: '08:00 - 17:00 WIB'
  },
  {
    id: 'umkm-3',
    name: 'Kelompok Tani Loning',
    owner: 'Pemilik UMKM C',
    description: 'Deskripsi singkat hasil bumi. Wadah bagi para petani lokal Desa Loning dalam memasarkan hasil panen unggulan seperti padi premium, kopi lokal, serta aneka buah dan sayur segar.',
    phone: '6281234567892',
    category: 'Pertanian',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80',
    address: 'RT 01/RW 04, Desa Loning, Petarukan, Pemalang',
    workingHours: '07:00 - 15:00 WIB'
  },
  {
    id: 'umkm-4',
    name: 'Pengrajin Anyaman Bambu',
    owner: 'Pemilik UMKM D',
    description: 'Deskripsi singkat anyaman bambu. Spesialis pembuatan wadah serbaguna dan pernak-pernik interior ramah lingkungan dari anyaman bambu buatan tangan pengrajin turun-temurun.',
    phone: '6281234567893',
    category: 'Kerajinan',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80',
    address: 'RT 03/RW 03, Desa Loning, Petarukan, Pemalang',
    workingHours: '08:00 - 16:00 WIB'
  },
  {
    id: 'umkm-5',
    name: 'Warung Sembako Rakyat',
    owner: 'Pemilik UMKM E',
    description: 'Deskripsi singkat toko kelontong. Menyediakan barang kebutuhan pokok rumah tangga sehari-hari untuk warga sekitar dengan pelayanan ramah dan harga bersahabat.',
    phone: '6281234567894',
    category: 'Sembako',
    imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527b0f76?auto=format&fit=crop&w=600&q=80',
    address: 'RT 04/RW 02, Desa Loning, Petarukan, Pemalang',
    workingHours: '06:00 - 20:00 WIB'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    umkmId: 'umkm-4',
    umkmName: 'Pengrajin Anyaman Bambu',
    name: 'Anyaman Bambu Tradisional',
    price: 75000,
    description: 'Deskripsi singkat produk lokal. Produk keranjang serbaguna buatan tangan warga Desa Loning yang kokoh dan ramah lingkungan.',
    category: 'Kerajinan',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    unit: 'Pcs'
  },
  {
    id: 'prod-2',
    umkmId: 'umkm-2',
    umkmName: 'Mebel Kayu Jati Loning',
    name: 'Kursi Kayu Jati Minimalis',
    price: 450000,
    description: 'Deskripsi singkat produk lokal. Kursi kayu jati buatan pengrajin lokal dengan pengerjaan rapi dan bahan berkualitas.',
    category: 'Jasa',
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    unit: 'Unit'
  },
  {
    id: 'prod-3',
    umkmId: 'umkm-1',
    umkmName: 'UMKM Kuliner Desa',
    name: 'Kuliner Tradisional Nasi Box',
    price: 18000,
    description: 'Deskripsi singkat produk lokal. Hidangan porsi nasi kotak lengkap dengan lauk-pauk tradisional untuk kebutuhan konsumsi acara.',
    category: 'Kuliner',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    unit: 'Porsi'
  },
  {
    id: 'prod-4',
    umkmId: 'umkm-3',
    umkmName: 'Kelompok Tani Loning',
    name: 'Hasil Bumi Kopi Bubuk Lokal',
    price: 35000,
    description: 'Deskripsi singkat produk lokal. Kopi bubuk murni hasil panen perkebunan rakyat Desa Loning yang diproses secara tradisional.',
    category: 'Pertanian',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    unit: 'Bungkus'
  },
  {
    id: 'prod-5',
    umkmId: 'umkm-5',
    umkmName: 'Warung Sembako Rakyat',
    name: 'Cemilan Keripik Lokal',
    price: 12000,
    description: 'Deskripsi singkat produk lokal. Keripik olahan rumah tangga yang renyah dan nikmat sebagai alternatif cemilan keluarga.',
    category: 'Kuliner',
    imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527b0f76?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    unit: 'Bungkus'
  }
];

export const BENEFIT_CARDS = [
  {
    title: 'Produk Lokal Pilihan',
    description: 'Menampilkan beraneka ragam karya kerajinan, kuliner khas, serta komoditas unggulan pertanian asli warga Loning.',
    icon: 'storefront'
  },
  {
    title: 'Pelaku Usaha Desa',
    description: 'Mengenal lebih dekat pengrajin, petani, serta pegiat niaga mandiri yang menggerakkan ekonomi akar rumput.',
    icon: 'groups'
  },
  {
    title: 'Informasi Mudah Diakses',
    description: 'Daftar alamat, jam buka, serta katalog penawaran terhimpun secara rapi dalam satu wadah ramah pengguna.',
    icon: 'search'
  },
  {
    title: 'Terhubung via WhatsApp',
    description: 'Membuka komunikasi interaktif langsung dengan pelaku usaha tanpa sistem perantara ataupun biaya komisi tambahan.',
    icon: 'whatsapp'
  }
];

export const VILLAGE_ANNOUNCEMENTS: VillageAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Placeholder: Informasi Pengembangan Direktori',
    excerpt: 'Platform rintisan ini difungsikan sebagai referensi tata letak visual untuk memetakan etalase niaga digital Desa Loning.',
    content: 'Tampilan ini merupakan purwarupa (prototype) visual interaktif untuk menyimulasikan pengalaman penjelajahan katalog usaha. Data numerik, ulasan, atau transaksi bersifat simulasi semata untuk keperluan pengembangan antarmuka.',
    date: '18 Juli 2026',
    category: 'Simulasi Layout',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80'
  }
];

export const FAQS = [
  {
    question: 'Apakah pembelian dilakukan melalui website ini?',
    answer: 'Tidak. Loning Digital bertindak sebagai direktori dan katalog pajangan produk. Tidak ada fitur keranjang belanja, gerbang pembayaran, ataupun transaksi di dalam sistem ini. Semua pemesanan atau pertanyaan diteruskan langsung ke kontak WhatsApp resmi pelaku usaha terkait.'
  },
  {
    question: 'Bagaimana cara menghubungi pelaku UMKM?',
    answer: 'Anda cukup mengklik tombol "Tanya Produk" atau "Hubungi via WhatsApp". Sistem akan otomatis menyiapkan teks pertanyaan awal yang memuat informasi nama produk dan nama usaha, lalu mengarahkan Anda ke aplikasi WhatsApp resmi milik penjual.'
  },
  {
    question: 'Apakah harga produk selalu sama?',
    answer: 'Harga yang dicantumkan bersifat informasi awal sebagai panduan atau referensi. Kepastian harga akhir, biaya pengiriman, serta metode ketersediaan barang sepenuhnya disepakati secara langsung antara pembeli dan penjual saat bertukar pesan di WhatsApp.'
  },
  {
    question: 'Apakah produk dapat dikirim ke luar desa?',
    answer: 'Hal ini bergantung pada kesepakatan dan kemampuan logistik masing-masing pelaku UMKM. Anda dapat berdiskusi langsung mengenai opsi pengiriman atau COD (Bayar di Tempat) saat melakukan obrolan via WhatsApp.'
  },
  {
    question: 'Bagaimana pelaku UMKM bergabung ke dalam sistem?',
    answer: 'Pendaftaran pelaku usaha dan katalog produk baru sepenuhnya dikelola dan diverifikasi oleh Administrator Desa (Balai Desa Loning) melalui panel kelola khusus pada sistem backend internal. Aplikasi publik ini tidak menyediakan pendaftaran mandiri demi menjaga keaslian data.'
  }
];

// Memory persistence with localStorage for prototype simulation
export function getSavedUMKMs(): UMKM[] {
  if (typeof window === 'undefined') return INITIAL_UMKMS;
  const saved = localStorage.getItem('loning_umkms');
  if (!saved) {
    localStorage.setItem('loning_umkms', JSON.stringify(INITIAL_UMKMS));
    return INITIAL_UMKMS;
  }
  return JSON.parse(saved);
}

export function getSavedProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  const saved = localStorage.getItem('loning_products');
  if (!saved) {
    localStorage.setItem('loning_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(saved);
}

export function resetToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('loning_umkms', JSON.stringify(INITIAL_UMKMS));
  localStorage.setItem('loning_products', JSON.stringify(INITIAL_PRODUCTS));
}
