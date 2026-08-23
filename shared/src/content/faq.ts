export interface FaqItem {
  question: string;
  answer: string;
  category: 'transaksi' | 'umkm' | 'peta' | 'teknis';
  categoryLabel: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'Apakah transaksi pembelian dilakukan langsung di dalam website ini?',
    answer: 'Tidak. Platform Loning Maju bertindak murni sebagai etalase digital dan direktori UMKM Desa Loning. Tidak ada sistem keranjang belanja, kasir otomatis, ataupun potongan biaya komisi. Seluruh komunikasi, pemesanan, dan transaksi dilakukan secara langsung via WhatsApp antara pembeli dan pemilik UMKM.',
    category: 'transaksi',
    categoryLabel: 'Pembeli & Transaksi'
  },
  {
    question: 'Apakah ada biaya komisi transaksi atau biaya admin tambahan?',
    answer: 'Sama sekali tidak (0% Komisi). Platform Loning Maju adalah fasilitas publik gratis dari Pemerintah Desa Loning untuk memajukan UMKM lokal. Seluruh nilai transaksi 100% masuk ke pemilik usaha tanpa potongan.',
    category: 'transaksi',
    categoryLabel: 'Pembeli & Transaksi'
  },
  {
    question: 'Apakah pembeli wajib mendaftar atau membuat akun terlebih dahulu?',
    answer: 'Tidak perlu. Pengunjung dan calon pembeli dapat langsung menjelajah seluruh katalog produk, lokasi peta, dan informasi UMKM secara bebas tanpa perlu membuat akun atau login sama sekali.',
    category: 'transaksi',
    categoryLabel: 'Pembeli & Transaksi'
  },
  {
    question: 'Bagaimana alur menghubungi pelaku usaha UMKM di website ini?',
    answer: 'Cukup pilih produk atau profil UMKM yang Anda minati, lalu klik tombol "Hubungi via WhatsApp". Sistem akan otomatis menyiapkan draf pesan awal yang memuat nama produk dan nama usaha agar memudahkan negosiasi stok dan harga.',
    category: 'transaksi',
    categoryLabel: 'Pembeli & Transaksi'
  },
  {
    question: 'Apakah harga produk yang tercantum sudah bersifat final?',
    answer: 'Harga yang dicantumkan merupakan referensi penawaran awal dari pelaku usaha. Anda dapat menanyakan langsung mengenai ketersediaan diskon grosir, promo khusus, atau perubahan harga terbaru saat berdiskusi di WhatsApp.',
    category: 'transaksi',
    categoryLabel: 'Pembeli & Transaksi'
  },
  {
    question: 'Apakah produk UMKM Desa Loning bisa dikirim ke luar daerah?',
    answer: 'Bisa. Opsi pengiriman disesuaikan dengan jenis produk dan kesepakatan dengan pelaku usaha. Untuk produk non-kuliner seperti mebel, kerajinan, atau makanan olahan kering umumnya dapat dikirim via layanan kurir ekspedisi.',
    category: 'transaksi',
    categoryLabel: 'Pembeli & Transaksi'
  },
  {
    question: 'Saya warga Desa Loning yang memiliki usaha, bagaimana cara mendaftar ke platform?',
    answer: 'Pendaftaran profil UMKM dan etalase produk baru dapat diajukan secara GRATIS melalui Pengelola Desa di Balai Desa Loning. Petugas admin desa akan memverifikasi keaslian usaha sebelum data diinput ke dalam sistem.',
    category: 'umkm',
    categoryLabel: 'Pendaftaran UMKM'
  },
  {
    question: 'Apakah ada batasan jumlah produk yang bisa dipajang oleh satu UMKM?',
    answer: 'Tidak ada batasan. Setiap pelaku UMKM warga Desa Loning yang terdaftar dapat memajang seluruh daftar variasi produk unggulannya di etalase direktori ini.',
    category: 'umkm',
    categoryLabel: 'Pendaftaran UMKM'
  },
  {
    question: 'Bagaimana cara memperbarui foto produk, jam buka, atau nomor WhatsApp usaha saya?',
    answer: 'Pelaku usaha yang sudah terdaftar dapat menghubungi Administrator Balai Desa Loning atau Pengelola Platform untuk memperbarui katalog produk, foto usaha, lokasi titik peta, maupun jam operasional usaha.',
    category: 'umkm',
    categoryLabel: 'Pendaftaran UMKM'
  },
  {
    question: 'Siapa yang mengelola keaslian data UMKM di Loning Maju?',
    answer: 'Data produk dan profil UMKM dikelola dan dikurasi secara berkala oleh Pemerintah Desa Loning demi menjamin keaslian data, keberadaan fisik usaha warga, serta keamanan pembeli.',
    category: 'umkm',
    categoryLabel: 'Pendaftaran UMKM'
  },
  {
    question: 'Apakah peta lokasi UMKM di platform ini dapat digunakan untuk navigasi GPS?',
    answer: 'Ya. Halaman Peta UMKM menyajikan titik koordinat presisi dari lokasi fisik usaha di Desa Loning. Anda dapat mengklik tombol petunjuk arah untuk langsung membuka Google Maps atau OpenStreetMap.',
    category: 'peta',
    categoryLabel: 'Peta & Lokasi'
  },
  {
    question: 'Apakah titik peta lokasi usaha yang tampil sudah terverifikasi resmi?',
    answer: 'Ya. Titik lokasi usaha dan patokan alamat yang ditampilkan di peta telah diverifikasi langsung bersama pelaku usaha warga untuk memudahkan rute penjemputan barang maupun survei tempat.',
    category: 'peta',
    categoryLabel: 'Peta & Lokasi'
  },
  {
    question: 'Bagaimana jika alamat atau lokasi UMKM yang tertera di peta tidak tepat?',
    answer: 'Jika terdapat ketidaksesuaian titik peta, pembeli dapat mengonfirmasi lokasi penjemputan patokan terdekat via WhatsApp pelaku usaha, atau melaporkannya ke tim admin desa.',
    category: 'peta',
    categoryLabel: 'Peta & Lokasi'
  },
  {
    question: 'Bagaimana jika saya menemukan error atau kendala teknis saat membuka website?',
    answer: 'Anda dapat melaporkan masalah teknis atau bug secara langsung kepada tim pengembang melalui tombol "Hubungi Developer" yang tersedia di bagian Footer bawah halaman.',
    category: 'teknis',
    categoryLabel: 'Bantuan Teknikal'
  },
  {
    question: 'Apakah platform Loning Maju dapat diakses dengan lancar dari smartphone?',
    answer: 'Tentu saja. Platform Loning Maju dirancang responsive, cepat, dan ringan agar dapat diakses dengan nyaman melalui berbagai perangkat smartphone, tablet, maupun komputer desktop.',
    category: 'teknis',
    categoryLabel: 'Bantuan Teknikal'
  },
  {
    question: 'Apakah layanan informasi di website ini beroperasi 24 jam?',
    answer: 'Website Loning Maju dapat diakses 24 jam nonstop setiap hari. Namun, balasan obrolan via WhatsApp disesuaikan dengan jam operasional aktif masing-masing pemilik usaha (umumnya pukul 08.00–17.00 WIB).',
    category: 'teknis',
    categoryLabel: 'Bantuan Teknikal'
  }
];

export const GUIDE_STEPS = [
  { number: '01', title: 'Temukan yang dicari', description: 'Telusuri kategori, produk, atau nama usaha warga Desa Loning.' },
  { number: '02', title: 'Baca informasi', description: 'Pelajari produk, profil usaha, alamat, dan jam operasional yang tersedia.' },
  { number: '03', title: 'Hubungi langsung', description: 'Kirim pertanyaan melalui WhatsApp dan sepakati kebutuhan langsung dengan pelaku usaha.' }
] as const;
