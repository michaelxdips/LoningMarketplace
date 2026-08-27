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
    version: 'v2.1.0-LTS',
    title: 'Rilis Final LTS: Dual-UI V2, PWA Offline, Multi-Product WA Draft, Real-Time Open Status, GPS & QR Code Etalase',
    date: '27 Agustus 2026',
    badge: 'LTS (Final Stable)',
    commits: [
      { hash: '86a1b7c', date: '2026-08-27', type: 'test', scope: 'e2e', message: 'pass seluruh suite pengujian otomatis dual-ui v2 desktop dan mobile' },
      { hash: 'c97ea85', date: '2026-08-27', type: 'feat', scope: 'pwa', message: 'progressive web app service worker offline cache dan offline indicator' },
      { hash: '36fa454', date: '2026-08-27', type: 'style', scope: 'ui-v2', message: 'perbaiki border-radius crisp dan layout modal hubungi developer serta toolbar riwayat versi' },
      { hash: '4f1a59e', date: '2026-08-27', type: 'fix', scope: 'auth', message: 'sertakan sessionToken di JSON response login untuk fallback iOS Safari ITP' },
      { hash: '1ae6f21', date: '2026-08-27', type: 'style', scope: 'ui-v2', message: 'footer super-compact bar 96px ultra hemat ruang vertikal' },
      { hash: '413bd96', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'draft catatan belanja multi-produk whatsapp dan qr code etalase umkm' },
      { hash: '339713d', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'filter buka sekarang dan sortir nama di direktori umkm desktop & mobile' },
      { hash: '2be9cfd', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'status buka/tutup toko real-time dan geolokasi jarak terdekat di peta' },
      { hash: '0aaf4c1', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'visual feedback share button dan micro-interaction tombol favorit' },
      { hash: '996a62f', date: '2026-08-27', type: 'fix', scope: 'ui-v2', message: 'guard login mobile, mapping error server form, deduplikasi github data hook' },
      { hash: '2577c1e', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'template pesan whatsapp instan, clear pencarian cepat, dan canonical seo v2->v1' },
      { hash: 'c420810', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'tombol favorit di detail + lightbox galeri produk' },
      { hash: '146011b', date: '2026-08-27', type: 'fix', scope: 'ui-v2', message: 'route dashboard crash + fitur tersimpan + cleanup' },
      { hash: 'da9bbb8', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'web mobile penuh (codebase independen v2/mobile)' },
      { hash: 'f8597ab', date: '2026-08-27', type: 'feat', scope: 'ui-v2', message: 'fondasi dual-ui shared package dan design system editorial' },
    ],
  },
  {
    version: 'v2.0.0',
    title: 'Desain Ulang Editorial Heritage & Responsif Lintas Perangkat',
    date: '22 Agustus 2026',
    badge: 'Previous Release',
    commits: [
      { hash: '88fb6b7', date: '2026-08-22', type: 'style', scope: 'login', message: 'rombak halaman login menjadi tata letak editorial asimetris tanpa kartu' },
      { hash: '88fb6b7', date: '2026-08-22', type: 'style', scope: 'dashboard', message: 'ubah dashboard menjadi gaya ledger (angka serif pada garis tipis, tanpa kotak)' },
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
  'v2.1.0-LTS': 'Rilis Final LTS: Dual-UI V2, PWA Offline, Multi-Product WA Draft, Real-Time Open Status, GPS & QR Code Etalase',
  'v2.0.0': 'Desain Ulang Editorial Heritage & Responsif Lintas Perangkat',
  'v1.9.0': 'Galeri Multi-Foto Produk & Aksesibilitas',
  'v1.8.0': 'Penguatan Keamanan Data & Status Operasional',
  'v1.7.0': 'Optimalisasi Mobile & Embed Google Maps',
  'v1.6.0': 'Kesiapan Produksi & Akses Multi-Role Pengelola',
  'v1.5.0': 'Mesin Media Cloud Storage & Peta Lokasi UMKM',
  'v1.0.0': 'Peluncuran Publik Portal & Direktori UMKM Desa Loning',
  'v0.1.0': 'Inisiasi Fondasi & Keandalan Arsitektur (Phase 0)',
};

export async function fetchGitHubReleaseData(repo = 'michaelxdips/LoningMarketplace'): Promise<ReleaseGroup[]> {
  const [page1Res, page2Res, tagsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${repo}/commits?per_page=100&page=1`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    }),
    fetch(`https://api.github.com/repos/${repo}/commits?per_page=100&page=2`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    }),
    fetch(`https://api.github.com/repos/${repo}/tags`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    }),
  ]);
  if (!page1Res.ok) throw new Error(`GitHub API HTTP ${page1Res.status}`);
  const page1Commits: GitHubCommitResponse[] = await page1Res.json();
  const page2Commits: GitHubCommitResponse[] = page2Res.ok ? await page2Res.json() : [];
  const rawCommits = [...(Array.isArray(page1Commits) ? page1Commits : []), ...(Array.isArray(page2Commits) ? page2Commits : [])];
  const rawTags: GitHubTagResponse[] = tagsRes.ok ? await tagsRes.json() : [];
  if (!Array.isArray(rawCommits) || rawCommits.length === 0) throw new Error('No commit data returned');

  const tagShaMap = new Map<string, string>();
  for (const t of rawTags) if (t.commit?.sha && t.name) tagShaMap.set(t.commit.sha.slice(0, 7), t.name);

  const parsedCommits: CommitItem[] = rawCommits.map((item) => {
    const hash = item.sha.slice(0, 7);
    const { type, scope, message } = parseCommitMessage(item.commit?.message || '');
    return { hash, date: formatDateISO(item.commit?.committer?.date || item.commit?.author?.date), type, scope, message };
  });

  const dynamicGroups: ReleaseGroup[] = [];
  let currentVersion = tagShaMap.get(parsedCommits[0]?.hash) || rawTags[0]?.name || 'v1.7.2';
  let currentCommits: CommitItem[] = [];
  for (const c of parsedCommits) {
    const taggedVersion = tagShaMap.get(c.hash);
    if (taggedVersion && taggedVersion !== currentVersion && currentCommits.length > 0) {
      const derivedTitle = VERSION_TITLES[currentVersion] || (currentCommits[0] ? `${currentCommits[0].scope ? `[${currentCommits[0].scope}] ` : ''}${currentCommits[0].message}` : `Release ${currentVersion}`);
      dynamicGroups.push({ version: currentVersion, title: derivedTitle, date: currentCommits[0]?.date || '2026-08-06', badge: 'Release', commits: currentCommits });
      currentVersion = taggedVersion;
      currentCommits = [c];
    } else {
      currentCommits.push(c);
    }
  }
  if (currentCommits.length > 0) {
    const derivedTitle = VERSION_TITLES[currentVersion] || (currentCommits[0] ? `${currentCommits[0].scope ? `[${currentCommits[0].scope}] ` : ''}${currentCommits[0].message}` : `Release ${currentVersion}`);
    dynamicGroups.push({ version: currentVersion, title: derivedTitle, date: currentCommits[0]?.date || '2026-08-06', badge: 'Release', commits: currentCommits });
  }
  return dynamicGroups.length > 0 ? dynamicGroups : STATIC_RELEASES;
}
