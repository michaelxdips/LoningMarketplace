/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GitCommit,
  Tag,
  Search,
  Filter,
  ShieldCheck,
  ArrowLeft,
  Terminal,
  CheckCircle2,
  GitBranch,
  Calendar,
  RotateCw,
  Wifi,
  WifiOff,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router';
import PublicPageShell from '../components/layout/PublicPageShell';
import { usePageMetadata } from '../lib/seo';

interface CommitItem {
  hash: string;
  date: string;
  type: 'feat' | 'fix' | 'style' | 'docs' | 'test' | 'chore' | 'refactor';
  message: string;
  scope?: string;
}

interface ReleaseGroup {
  version: string;
  title: string;
  date: string;
  badge: string;
  commits: CommitItem[];
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    committer?: { date?: string };
    author?: { date?: string };
  };
}

interface GitHubTagResponse {
  name: string;
  commit: {
    sha: string;
  };
}

const STATIC_RELEASES: ReleaseGroup[] = [
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

const commitTypeStyles: Record<string, { label: string; text: string }> = {
  feat: { label: 'Feature', text: 'text-forest' },
  fix: { label: 'Fix', text: 'text-terracotta' },
  style: { label: 'Style', text: 'text-warm-gray' },
  docs: { label: 'Docs', text: 'text-warm-gray' },
  test: { label: 'Test', text: 'text-warm-gray' },
  chore: { label: 'Chore', text: 'text-warm-gray' },
  refactor: { label: 'Refactor', text: 'text-warm-gray' },
};

function parseCommitMessage(rawMsg: string): { type: CommitItem['type']; scope?: string; message: string } {
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
  return {
    type: 'feat',
    message: firstLine,
  };
}

function formatDateISO(isoStr?: string): string {
  if (!isoStr) return '2026-08-06';
  try {
    return isoStr.split('T')[0];
  } catch {
    return isoStr;
  }
}

export default function VersionHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [releases, setReleases] = useState<ReleaseGroup[]>(STATIC_RELEASES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  // Only the newest (first) release is open by default
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set([STATIC_RELEASES[0]?.version ?? ''])
  );

  const toggleVersion = useCallback((version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }, []);

  usePageMetadata({
    title: 'Riwayat Versi & Commit — Loning Maju',
    description: 'Log lengkap riwayat versi, changelog pembaruan, perbaikan bug, dan commit GitHub resmi platform Loning Maju.',
  });

  // Map known tags/versions to curated titles for maximum clarity
  const VERSION_TITLES: Record<string, string> = useMemo(
    () => ({
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
    }),
    []
  );

  const fetchGitHubData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [page1Res, page2Res, tagsRes] = await Promise.all([
        fetch('https://api.github.com/repos/michaelxdips/LoningMarketplace/commits?per_page=100&page=1', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
        fetch('https://api.github.com/repos/michaelxdips/LoningMarketplace/commits?per_page=100&page=2', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
        fetch('https://api.github.com/repos/michaelxdips/LoningMarketplace/tags', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
      ]);

      if (!page1Res.ok) throw new Error(`GitHub API HTTP ${page1Res.status}`);

      const page1Commits: GitHubCommitResponse[] = await page1Res.json();
      const page2Commits: GitHubCommitResponse[] = page2Res.ok ? await page2Res.json() : [];
      const rawCommits = [...(Array.isArray(page1Commits) ? page1Commits : []), ...(Array.isArray(page2Commits) ? page2Commits : [])];
      const rawTags: GitHubTagResponse[] = tagsRes.ok ? await tagsRes.json() : [];

      if (!Array.isArray(rawCommits) || rawCommits.length === 0) {
        throw new Error('No commit data returned');
      }

      // Map tags to commit sha set
      const tagShaMap = new Map<string, string>();
      for (const t of rawTags) {
        if (t.commit?.sha && t.name) {
          tagShaMap.set(t.commit.sha.slice(0, 7), t.name);
        }
      }

      const parsedCommits: CommitItem[] = rawCommits.map((item) => {
        const hash = item.sha.slice(0, 7);
        const rawMsg = item.commit?.message || '';
        const { type, scope, message } = parseCommitMessage(rawMsg);
        const commitDate = formatDateISO(item.commit?.committer?.date || item.commit?.author?.date);
        return {
          hash,
          date: commitDate,
          type,
          scope,
          message,
        };
      });

      // Group commits into releases based on tags and version milestones
      const dynamicGroups: ReleaseGroup[] = [];
      let currentVersion = tagShaMap.get(parsedCommits[0]?.hash) || rawTags[0]?.name || 'v1.7.2';
      let currentCommits: CommitItem[] = [];

      for (const c of parsedCommits) {
        const taggedVersion = tagShaMap.get(c.hash);
        if (taggedVersion && taggedVersion !== currentVersion && currentCommits.length > 0) {
          const derivedTitle =
            VERSION_TITLES[currentVersion] ||
            (currentCommits[0] ? `${currentCommits[0].scope ? `[${currentCommits[0].scope}] ` : ''}${currentCommits[0].message}` : `Release ${currentVersion}`);

          dynamicGroups.push({
            version: currentVersion,
            title: derivedTitle,
            date: currentCommits[0]?.date || '2026-08-06',
            badge: currentVersion === dynamicGroups[0]?.version ? 'Versi Terbaru (Live)' : 'Release',
            commits: currentCommits,
          });
          currentVersion = taggedVersion;
          currentCommits = [c];
        } else {
          currentCommits.push(c);
        }
      }

      if (currentCommits.length > 0) {
        const derivedTitle =
          VERSION_TITLES[currentVersion] ||
          (currentCommits[0] ? `${currentCommits[0].scope ? `[${currentCommits[0].scope}] ` : ''}${currentCommits[0].message}` : `Release ${currentVersion}`);

        dynamicGroups.push({
          version: currentVersion,
          title: derivedTitle,
          date: currentCommits[0]?.date || '2026-08-06',
          badge: 'Release',
          commits: currentCommits,
        });
      }

      const resolved = dynamicGroups.length > 0 ? dynamicGroups : STATIC_RELEASES;
      setReleases(resolved);
      // Auto-expand only the newest release when live data loads
      setExpandedVersions(new Set([resolved[0]?.version ?? '']));
      setIsLive(true);
      setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('GitHub API fetch fallback to static release log:', err);
      setReleases(STATIC_RELEASES);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [VERSION_TITLES]);

  useEffect(() => {
    fetchGitHubData();
  }, [fetchGitHubData]);

  const totalCommitsCount = useMemo(() => {
    return releases.reduce((acc, rel) => acc + rel.commits.length, 0);
  }, [releases]);

  const filteredReleases = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return releases
      .map((group) => {
        const filteredCommits = group.commits.filter((commit) => {
          const matchesType = selectedType === 'all' || commit.type === selectedType;
          const matchesQuery =
            !query ||
            commit.hash.toLowerCase().includes(query) ||
            commit.message.toLowerCase().includes(query) ||
            (commit.scope && commit.scope.toLowerCase().includes(query));
          return matchesType && matchesQuery;
        });

        return {
          ...group,
          commits: filteredCommits,
        };
      })
      .filter((group) => group.commits.length > 0);
  }, [releases, searchQuery, selectedType]);

  return (
    <PublicPageShell>
      {/* Header Banner - Sleek & Compact Editorial Style */}
      <header className="mx-auto max-w-4xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        <div className="text-center">
          <h1 className="text-balance break-words font-serif text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
            Riwayat Pembaruan & Commit Log
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-warm-gray sm:text-sm">
            Catatan rilis terverifikasi langsung dari GitHub repository <span className="font-semibold text-charcoal">LoningMaju</span>.
          </p>
        </div>

        {/* Compact Stats & Live Status Bar */}
        <div className="mt-6 flex flex-col gap-3 border-t border-charcoal/15 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {/* Version */}
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-forest" />
              <span className="text-warm-gray">Versi:</span>
              <span className="rounded bg-forest/10 px-2 py-0.5 font-mono text-xs font-extrabold text-forest">
                {releases[0]?.version || 'v1.7.2'}
              </span>
            </div>

            <span className="hidden h-3.5 w-px bg-sage-border sm:inline" />

            {/* Total Commits */}
            <div className="flex items-center gap-1.5">
              <GitCommit className="h-3.5 w-3.5 text-terracotta" />
              <span className="text-warm-gray">Total:</span>
              <span className="font-bold text-charcoal">{totalCommitsCount} Commit</span>
            </div>

            <span className="hidden h-3.5 w-px bg-sage-border sm:inline" />

            {/* Live Sync Status */}
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-forest"></span>
                  </span>
                  <Wifi className="h-3.5 w-3.5 text-forest" />
                  <span>GitHub Live</span>
                  {lastFetchedAt && <span className="text-[11px] font-normal text-warm-gray">({lastFetchedAt})</span>}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-gray">
                  <WifiOff className="h-3.5 w-3.5 text-warm-gray" />
                  <span>Data Lokal</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-sage-border/60 sm:pt-0 sm:border-t-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={fetchGitHubData}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center gap-1 rounded-md border border-sage-border bg-cream-tint px-3 py-2 text-xs font-bold text-charcoal transition-colors hover:bg-sage-light hover:text-forest disabled:opacity-50"
              title="Segarkan commit langsung dari GitHub API"
            >
              <RotateCw className={`h-3 w-3 text-forest ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Segarkan'}</span>
            </button>

            {/* Repo Link */}
            <a
              href="https://github.com/michaelxdips/LoningMarketplace"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-md border border-sage-border bg-cream-tint px-3 py-2 text-xs font-bold font-mono text-charcoal hover:bg-sage-light hover:text-forest transition-colors"
            >
              <Terminal className="h-3 w-3 text-forest" />
              <span>Repo</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>

        {/* Search & Filter Bar - Ultra Sleek */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari commit (contoh: hapus, media, fix, auth, commit hash)..."
              className="focus-ring w-full rounded-lg border border-sage-border bg-white py-2 pl-9 pr-3 text-xs text-charcoal placeholder:text-warm-gray/60 sm:text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter size={13} className="shrink-0 text-warm-gray mr-0.5" />
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                selectedType === 'all' ? 'bg-forest text-white' : 'border border-sage-border bg-white text-warm-gray hover:text-charcoal'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('feat')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                selectedType === 'feat' ? 'bg-forest text-white' : 'border border-sage-border bg-white text-charcoal hover:text-forest'
              }`}
            >
              Feature (feat)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('fix')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                selectedType === 'fix' ? 'bg-forest text-white' : 'border border-sage-border bg-white text-charcoal hover:text-forest'
              }`}
            >
              Fix (bug)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('style')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                selectedType === 'style' ? 'bg-forest text-white' : 'border border-sage-border bg-white text-charcoal hover:text-forest'
              }`}
            >
              Style & UI
            </button>
          </div>
        </div>
      </header>

      {/* Release Timeline List */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {filteredReleases.length > 0 ? (
          <div className="space-y-2.5">
            {filteredReleases.map((release, idx) => {
              const isExpanded = expandedVersions.has(release.version);
              const isNewest = idx === 0;
              return (
                <article
                  key={release.version}
                  className="overflow-hidden rounded-xl border border-sage-border bg-white shadow-2xs transition-all hover:border-forest/30"
                >
                  {/* Release Header — compact, elegant & informative */}
                  <button
                    type="button"
                    onClick={() => toggleVersion(release.version)}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-cream-tint/60"
                    aria-expanded={isExpanded}
                  >
                    {/* Version Tag */}
                    <span className="shrink-0 rounded-md bg-forest px-2 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                      {release.version}
                    </span>

                    {/* Informative Title */}
                    <h2 className="min-w-0 flex-1 truncate text-xs font-bold text-charcoal sm:text-sm">
                      {release.title}
                    </h2>

                    {/* Right side Metadata */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isNewest && (
                        <span className="hidden rounded-md bg-terracotta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-terracotta sm:inline">
                          Terbaru
                        </span>
                      )}
                      <span className="hidden items-center gap-1 text-[11px] font-medium text-warm-gray sm:flex">
                        <Calendar className="h-3 w-3 text-forest" />
                        {release.date}
                      </span>
                      <span className="rounded bg-sage-light px-1.5 py-0.5 text-[10px] font-bold text-warm-gray">
                        {release.commits.length} commit
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-warm-gray/70 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Commit Items List - Compact Accordion */}
                  {isExpanded && (
                    <div className="border-t border-sage-border/60 bg-cream-bg/40 px-3.5 pb-2.5 pt-2">
                      <div className="space-y-1">
                        {release.commits.map((commit, commitIdx) => {
                          const badgeMeta = commitTypeStyles[commit.type] || commitTypeStyles.feat;
                          return (
                            <div
                              key={`${release.version}-${commit.hash}-${commitIdx}`}
                              className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white hover:shadow-2xs"
                            >
                              {/* Commit Hash Pill */}
                              <a
                                href={`https://github.com/michaelxdips/LoningMarketplace/commit/${commit.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 rounded bg-sage-light/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-forest hover:bg-forest hover:text-white transition-colors"
                                title="Buka commit di GitHub"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {commit.hash}
                              </a>

                              {/* Type Badge */}
                              <span className={`shrink-0 text-[9px] uppercase font-bold tracking-wider ${badgeMeta.text}`}>
                                {badgeMeta.label}
                              </span>

                              {/* Scope + Message */}
                              <p className="min-w-0 flex-1 truncate text-xs text-charcoal">
                                {commit.scope && (
                                  <span className="font-semibold text-forest">
                                    ({commit.scope}):{' '}
                                  </span>
                                )}
                                {commit.message}
                              </p>

                              {/* Date */}
                              <span className="hidden shrink-0 text-[10px] text-warm-gray/60 sm:block">
                                {commit.date}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border-t border-charcoal/15 pt-8 text-center">
            <GitCommit size={36} className="mx-auto text-warm-gray/40 mb-2" />
            <h3 className="text-sm font-bold text-charcoal">Tidak ada commit yang cocok</h3>
            <p className="mt-1 text-xs text-warm-gray">
              Coba kata kunci lain atau bersihkan filter tipe commit.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
              }}
              className="mt-3 rounded-lg bg-forest px-3.5 py-1.5 text-xs font-bold text-white uppercase tracking-wider"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-sage-border bg-white px-4 py-2 text-xs font-bold text-charcoal hover:bg-cream-tint transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-forest" />
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}

