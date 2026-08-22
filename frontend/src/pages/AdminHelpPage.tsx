import { BookOpen, Download, KeyRound, MapPin, Package, Store } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { useSession } from '../hooks/useAuth';
import { hasCapability } from '../lib/auth';
import { PageHeader, secondaryButtonClass } from '../components/dashboard/Ui';

const topics = [
  ['Login dan kata sandi', 'Masuk melalui halaman login. Akun baru wajib mengganti kata sandi sementara sebelum memakai dashboard. Gunakan menu profil untuk mengganti kata sandi lagi.'],
  ['Membuat dan mengedit UMKM', 'Buka Daftar UMKM, pilih Tambah UMKM, lengkapi kontak, alamat, foto, jam operasional, dan lokasi. Simpan sebelum meninggalkan halaman.'],
  ['Membuat produk', 'Buka Daftar Produk, pilih Tambah Produk, pilih UMKM pengelola, isi harga bila tersedia, unggah gambar, lalu simpan.'],
  ['Publikasi dan arsip', 'Data baru dimulai sebagai draf. Terbitkan setelah informasi diperiksa. Arsip menyembunyikan data dari publik; pulihkan untuk mengembalikannya ke draf.'],
  ['Lokasi dan petunjuk arah', 'Gunakan Atur Lokasi pada daftar UMKM. Masukkan koordinat atau URL Maps yang didukung, periksa pratinjau, lalu simpan.'],
  ['Kelengkapan profil', 'Kolom Kelengkapan menunjukkan persentase dan bagian yang belum diisi. Prioritaskan kontak valid, foto, lokasi, jam operasional, serta produk terbit.'],
  ['Statistik dashboard', 'Tampilan katalog, dialog inquiry, dan klik WhatsApp menunjukkan minat pengunjung—bukan transaksi atau penjualan.'],
  ['Troubleshooting', 'Jika gambar gagal, periksa tipe dan ukuran file. Jika data gagal dimuat, coba lagi dan periksa koneksi. Hubungi Super Admin bila akses menu tidak sesuai tugas.'],
] as const;

export default function AdminHelpPage() {
  const user = useSession().data!.user;
  const canExportUmkm = hasCapability(user, 'umkms:view-all');
  const canExportProducts = hasCapability(user, 'products:view-all');
  return <>
    <PageHeader title="Panduan Admin" description="Langkah singkat untuk mengelola katalog Loning Maju dengan aman." />
    {(canExportUmkm || canExportProducts) && <section className="mb-8 border-t border-charcoal/15 pt-5"><h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-charcoal"><Download className="h-5 w-5 text-forest"/>Ekspor data</h2><p className="mt-2 text-sm text-warm-gray">Unduh CSV untuk kebutuhan administrasi desa. File tidak memuat kata sandi, sesi, atau data keamanan internal.</p><div className="mt-4 flex flex-wrap gap-3">{canExportUmkm && <a href={apiUrl('/manage/umkms/export.csv')} className={secondaryButtonClass}><Store className="h-4 w-4"/>Ekspor UMKM</a>}{canExportProducts && <a href={apiUrl('/manage/products/export.csv')} className={secondaryButtonClass}><Package className="h-4 w-4"/>Ekspor Produk</a>}</div></section>}
    <section className="grid gap-x-8 gap-y-6 md:grid-cols-2" aria-label="Topik panduan">
      {topics.map(([title, description], index) => <article key={title} className="border-t border-charcoal/15 pt-4"><h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-charcoal">{index === 0 ? <KeyRound className="h-5 w-5 text-forest"/> : index === 4 ? <MapPin className="h-5 w-5 text-forest"/> : <BookOpen className="h-5 w-5 text-forest"/>}{title}</h2><p className="mt-2 text-sm leading-6 text-warm-gray">{description}</p></article>)}
    </section>
  </>;
}
