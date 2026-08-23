/**
 * Data riwayat versi & parsing commit — konten MURNI (tanpa DOM/React).
 * Dipakai bersama oleh VersionHistoryPage UI lama (lewat shim) dan V2.
 */

export interface CommitItem {
  hash: string;
  date: string;
  type: 'feat' | 'fix' | 'style' | 'docs' | 'test' | 'chore' | 'refactor';
  message: string;
  scope?: string;
}

export interface ReleaseGroup {
  version: string;
  title: string;
  date: string;
  badge: string;
  commits: CommitItem[];
}

export interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    committer?: { date?: string };
    author?: { date?: string };
  };
}

export interface GitHubTagResponse {
  name: string;
  commit: {
    sha: string;
  };
}

export const STATIC_RELEASES: ReleaseGroup[] = [
  {
    version: 'v2.2.0',
    title: 'Desain Ulang Editorial Heritage & Responsif Lintas Perangkat',
    date: '22 Agustus 2026',
    badge: 'Versi Terbaru (Active)',
    commits: [
      { hash: '88fb6b7', date: '2026-08-22', type: 'style', scope: 'login', message: 'rombak halaman login menjadi tata letak editorial asimetris tanpa kartu' },
      { hash: '88fb6b7', date: '2026-08-22', type: 'style', scope: 'dashboard', message: 'ubah dashboard menjadi gaya ledger (angka serif pada garis tipis, tanpa kotak)' },
      { hash: '88fb6b7', date: '2026-08-22', type: 'style', scope: 'branding', message: 'samakan wordmark serif Loning Maju di navbar, sidebar, dan footer' },
      { hash: '88fb6b7', date: '2026-08-22', type: 'refactor', scope: 'forms', message: 'hapus kartu berbingkai generik pada form dan tabel kelola' },
      { hash: '88fb6b7', date: '2026-08-22', type: 'style', scope: 'responsive', message: 'perbaiki safe-area iOS, input zoom, touch-target 44px, dan unit dvh' },
      { hash: '88fb6b7', date: '2026-08-22', type: 'chore', scope: 'css', message: 'buang CSS mati dan samakan radius serta kontras teks' },
    ],
  },
  {
    version: 'v2.1.0',
    title: 'Penyempurnaan Label Kategori, Tampilan Misi & Aset Hero Baru',
    date: '10 Agustus 2026',
    badge: 'Minor',
    commits: [
      { hash: '5ae506f', date: '2026-08-10', type: 'style', scope: 'category', message: 'rapikan label kategori ringkas tanpa text wrap pada badge dan kartu UMKM' },
      { hash: '5ae506f', date: '2026-08-10', type: 'refactor', scope: 'home', message: 'sederhanakan alur misi dan selaraskan gradien warna forest green' },
      { hash: '5ae506f', date: '2026-08-10', type: 'feat', scope: 'assets', message: 'tambahkan aset foto hero disesuaikan label produk lokal, kuliner, jasa, dan pelaku UMKM' },
    ],
  },
  {
    version: 'v2.0.0',
    title: 'Rilis Produksi V2: 9 Kategori & Jam Operasional',
    date: '9 Agustus 2026',
    badge: 'Major',
    commits: [
      { hash: 'bc25cb3', date: '2026-08-09', type: 'feat', scope: 'category', message: 'dukungan 9 kategori UMKM resmi Desa Loning' },
      { hash: 'bc25cb3', date: '2026-08-09', type: 'feat', scope: 'hours', message: 'dukungan jam operasional mingguan per hari terstruktur' },
      { hash: 'bc25cb3', date: '2026-08-09', type: 'fix', scope: 'infra', message: 'pengerasan idempotensi mutasi dan skrip migrasi idempotent' },
    ],
  },
  {
    version: 'v1.9.0',
    title: 'Galeri Multi-Foto Produk & Aksesibilitas',
    date: '7 Agustus 2026',
    badge: 'Minor',
    commits: [
      { hash: '9832930', date: '2026-08-07', type: 'feat', scope: 'gallery', message: 'dukungan galeri multi-foto hingga 5 foto per produk' },
      { hash: '9832930', date: '2026-08-07', type: 'feat', scope: 'a11y', message: 'navigasi galeri gambar ramah keyboard dan pembaca layar (ARIA)' },
      { hash: '9832930', date: '2026-08-07', type: 'fix', scope: 'cleanup', message: 'otomatisasi penghapusan berkas media saat produk/UMKM dihapus' },
    ],
  },
  {
    version: 'v1.8.0',
    title: 'Penguatan Keamanan Data & Status Operasional',
    date: '7 Agustus 2026',
    badge: 'Minor',
    commits: [
      { hash: '72182ed', date: '2026-08-07', type: 'feat', scope: 'status', message: 'penanda status buka/tutup dinamis dan petunjuk rute UMKM' },
      { hash: '72182ed', date: '2026-08-07', type: 'feat', scope: 'export', message: 'ekspor CSV terlindungi formula injection dengan UTF-8 BOM' },
      { hash: '72182ed', date: '2026-08-07', type: 'feat', scope: 'forms', message: 'proteksi konfirmasi perubahan form yang belum disimpan' },
    ],
  },
  {
    version: 'v1.7.0',
    title: 'Optimalisasi Mobile & Embed Google Maps',
    date: '6 Agustus 2026',
    badge: 'Minor',
    commits: [
      { hash: '922071f', date: '2026-08-06', type: 'feat', scope: 'maps', message: 'integrasi Google Maps Native Embed untuk pratinjau lokasi direktori UMKM' },
      { hash: '922071f', date: '2026-08-06', type: 'style', scope: 'mobile', message: 'penyesuaian viewport dvh, PWA manifest, autoCapitalize, dan numeric keypad' },
      { hash: '922071f', date: '2026-08-06', type: 'feat', scope: 'manage', message: 'fitur hapus permanen UMKM & produk di menu kelola pengelola' },
    ],
  },
  {
    version: 'v1.6.0',
    title: 'Kesiapan Produksi & Akses Multi-Role Pengelola',
    date: '5 Agustus 2026',
    badge: 'Stable',
    commits: [
      { hash: 'e52f094', date: '2026-08-05', type: 'feat', scope: 'auth', message: 'otentikasi berbasis HTTP-only cookie aman dengan perlindungan CSRF' },
      { hash: 'e52f094', date: '2026-08-05', type: 'feat', scope: 'rbac', message: 'pembagian hak akses terstruktur (Superadmin, Admin, Seller)' },
      { hash: 'e52f094', date: '2026-08-05', type: 'feat', scope: 'audit', message: 'pencatatan log audit aktivitas pengelola dan redaksi data sensitif' },
    ],
  },
  {
    version: 'v1.5.0',
    title: 'Mesin Media Cloud Storage & Peta Lokasi UMKM',
    date: '1 Agustus 2026',
    badge: 'Media Core',
    commits: [
      { hash: '6f64445', date: '2026-08-01', type: 'feat', scope: 'media', message: 'layanan media streaming dan penyimpanan S3-compatible cloud storage' },
      { hash: '6f64445', date: '2026-08-01', type: 'feat', scope: 'faq', message: 'ekspansi 16 FAQ interaktif pembeli, penjual, peta, dan teknis' },
      { hash: '6f64445', date: '2026-08-01', type: 'feat', scope: 'contact', message: 'dialog konsultasi teknis WhatsApp langsung dengan developer' },
    ],
  },
  {
    version: 'v1.0.0',
    title: 'Peluncuran Publik Portal & Direktori UMKM Desa Loning',
    date: '28 Juli 2026',
    badge: 'Initial Launch',
    commits: [
      { hash: 'b57d125', date: '2026-07-28', type: 'feat', scope: 'portal', message: 'etalase produk & direktori UMKM publik dengan filter kategori' },
      { hash: 'b57d125', date: '2026-07-28', type: 'feat', scope: 'inquiry', message: 'tombol WhatsApp order & pesan langsung ke pelaku usaha' },
      { hash: 'b57d125', date: '2026-07-28', type: 'feat', scope: 'deploy', message: 'konfigurasi deployment Vercel Services & database PostgreSQL' },
    ],
  },
  {
    version: 'v0.1.0',
    title: 'Inisiasi Fondasi & Keandalan Arsitektur (Phase 0)',
    date: '24 Juli 2026',
    badge: 'Baseline Prototype',
    commits: [
      { hash: 'a21d0fc', date: '2026-07-24', type: 'feat', scope: 'core', message: 'fondasi monorepo Fastify backend & React TypeScript frontend' },
      { hash: 'a21d0fc', date: '2026-07-24', type: 'feat', scope: 'db', message: 'desain skema tabel database PostgreSQL dengan Drizzle ORM' },
      { hash: 'a21d0fc', date: '2026-07-24', type: 'feat', scope: 'test', message: 'pengujian unit test & pipeline otomasi keandalan aplikasi' },
    ],
  },
];

export function parseCommitMessage(rawMsg: string): { type: CommitItem['type']; scope?: string; message: string } {
  const firstLine = rawMsg.split('\n')[0].trim();
  const match = firstLine.match(/^(feat|fix|style|docs|test|chore|refactor|merge)(?:\(([^)]+)\))?:\s*(.+)$/i);
  if (match) {
    let typeStr = match[1].toLowerCase();
    if (typeStr === 'merge') typeStr = 'chore';
    return {
      type: (typeStr as CommitItem['type']) || 'feat',
      scope: match[2]?.trim(),
      message: match[3]?.trim() || firstLine,
    };
  }
  return { type: 'feat', message: firstLine };
}

export function formatDateISO(isoStr?: string): string {
  if (!isoStr) return '2026-08-06';
  try {
    return isoStr.split('T')[0];
  } catch {
    return isoStr;
  }
}

export const VERSION_TITLES: Record<string, string> = {
  'v2.2.0': 'Desain Ulang Editorial Heritage & Responsif Lintas Perangkat',
  'v2.1.0': 'Penyempurnaan Label Kategori, Tampilan Misi & Aset Hero Baru',
  'v2.0.0': 'Rilis Produksi V2: 9 Kategori & Jam Operasional',
  'v1.9.0': 'Galeri Multi-Foto Produk & Aksesibilitas',
  'v1.8.0': 'Penguatan Keamanan Data & Status Operasional',
  'v1.7.0': 'Optimalisasi Mobile & Embed Google Maps',
  'v1.6.0': 'Kesiapan Produksi & Akses Multi-Role Pengelola',
  'v1.5.0': 'Mesin Media Cloud Storage & Peta Lokasi UMKM',
  'v1.0.0': 'Peluncuran Publik Portal & Direktori UMKM Desa Loning',
  'v0.1.0': 'Inisiasi Fondasi & Keandalan Arsitektur (Phase 0)',
};
