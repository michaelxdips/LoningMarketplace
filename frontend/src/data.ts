/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export const FAQS = [
  {
    question: 'Apakah pembelian dilakukan melalui website ini?',
    answer: 'Tidak. Loning Maju bertindak sebagai direktori dan katalog pajangan produk. Tidak ada fitur keranjang belanja, gerbang pembayaran, ataupun transaksi di dalam sistem ini. Semua pemesanan atau pertanyaan diteruskan langsung ke kontak WhatsApp resmi pelaku usaha terkait.'
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

export const GUIDE_STEPS = [
  { number: '01', title: 'Temukan yang dicari', description: 'Telusuri kategori, produk, atau nama usaha warga Desa Loning.' },
  { number: '02', title: 'Baca informasi', description: 'Pelajari produk, profil usaha, alamat, dan jam operasional yang tersedia.' },
  { number: '03', title: 'Hubungi langsung', description: 'Kirim pertanyaan melalui WhatsApp dan sepakati kebutuhan langsung dengan pelaku usaha.' }
] as const;
