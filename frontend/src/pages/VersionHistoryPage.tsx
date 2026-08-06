/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GitCommit,
  Tag,
  Sparkles,
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
    version: 'v1.7.0',
    title: 'Google Maps Integration & UI Optimization',
    date: '6 Agustus 2026',
    badge: 'Versi Terbaru (Active)',
    commits: [
      { hash: 'HEAD', date: '2026-08-06', type: 'feat', scope: 'maps', message: 'integrate Google Maps Native Embed for location preview and map directory' },
      { hash: 'HEAD', date: '2026-08-06', type: 'style', scope: 'layout', message: 'optimize container max-widths, search forms, and smart hybrid image framing' },
      { hash: 'HEAD', date: '2026-08-06', type: 'refactor', scope: 'home', message: 'redesign mission section hierarchy and clean up editorial teasers alignment' },
    ],
  },
  {
    version: 'v1.6.3',
    title: 'Mobile Auth Fix & Security Hardening',
    date: '6 Agustus 2026',
    badge: 'Patch',
    commits: [
      { hash: '430ee4d', date: '2026-08-06', type: 'fix', scope: 'auth', message: 'persist session token to localStorage and inject as Bearer fallback for iOS Safari cross-site cookie blocking (ITP)' },
      { hash: '5c9862c', date: '2026-08-06', type: 'fix', scope: 'auth', message: 'allow requests without Origin header for mobile browser compatibility' },
    ],
  },
  {
    version: 'v1.6.2',
    title: 'Official Brand Identity',
    date: '6 Agustus 2026',
    badge: 'Branding',
    commits: [
      { hash: 'ba41258', date: '2026-08-06', type: 'feat', scope: 'branding', message: 'replace generic logo with official Loning Maju brand identity' },
      { hash: '0caca2d', date: '2026-08-06', type: 'style', scope: 'history', message: 'make commit type badge card compact and sleek' },
      { hash: 'a0d1847', date: '2026-08-06', type: 'style', scope: 'history', message: 'refine commit log rows into perfectly aligned tabular grid' },
      { hash: '5bc368b', date: '2026-08-06', type: 'style', scope: 'login', message: 'remove PORTAL DASHBOARD V2 badge from left hero panel' },
      { hash: 'abc4aa0', date: '2026-08-06', type: 'style', scope: 'login', message: 'refine card container, input icon focus states, and typography spacing' },
      { hash: 'fe8a658', date: '2026-08-06', type: 'feat', scope: 'history', message: 'auto-fetch commits and tags live from GitHub REST API' },
    ],
  },
  {
    version: 'v1.6.1',
    title: 'Dashboard V2 Reconstruction & System Refinements',
    date: '6 Agustus 2026',
    badge: 'Stable',
    commits: [
      { hash: '0b0e214', date: '2026-08-06', type: 'chore', scope: 'release', message: 'merge feature/v1.6.1-dashboard-v2 into master' },
      { hash: '69b3970', date: '2026-08-06', type: 'style', scope: 'login', message: 'refine login page left panel for clean, elegant, non-cluttered aesthetics' },
      { hash: 'c314891', date: '2026-08-06', type: 'feat', scope: 'footer', message: 'replace Masuk Pengelola link with Version History page matching actual git commits' },
      { hash: '60aa4e2', date: '2026-08-06', type: 'style', scope: 'login', message: 'redesign login page with luxury glassmorphic hero panel and input icons' },
      { hash: 'fd827b3', date: '2026-08-06', type: 'style', scope: 'dashboard', message: 'neaten up filter toolbar layout, button height, and reset filter text wrapping' },
      { hash: '4b7d211', date: '2026-08-06', type: 'fix', scope: 'auth', message: 'allow logged in users to access voluntary self-service password change route' },
      { hash: 'c78e618', date: '2026-08-06', type: 'feat', scope: 'dashboard', message: 'auto-apply draft status filter when clicking items in needs attention box' },
      { hash: 'e2a1016', date: '2026-08-06', type: 'feat', scope: 'catalog', message: 'limit default catalog grid to 12 top products with interactive expand toggle' },
      { hash: 'cd21532', date: '2026-08-06', type: 'fix', scope: 'analytics', message: 'resolve postgres raw date parameter formatting and upgrade inquiry analytics visual funnel' },
      { hash: 'e7d563f', date: '2026-08-06', type: 'docs', scope: 'dashboard', message: 'document V1.6.1 Dashboard V2 architecture, security, tests, and final verdict' },
    ],
  },
  {
    version: 'v1.6.0',
    title: 'Production Readiness & Multi-role Access Control',
    date: '5 Agustus 2026',
    badge: 'Baseline Stable',
    commits: [
      { hash: 'e52f094', date: '2026-08-05', type: 'docs', scope: 'audit', message: 'finalize V1.6 verification report' },
      { hash: '71624d2', date: '2026-08-05', type: 'chore', scope: 'repo', message: 'remove obsolete audit artifacts' },
      { hash: '8422ea5', date: '2026-08-05', type: 'chore', scope: 'deploy', message: 'remove obsolete Railway configuration' },
      { hash: 'b11a861', date: '2026-08-05', type: 'test', scope: 'e2e', message: 'stabilize browser event coverage' },
      { hash: 'bdcf905', date: '2026-08-05', type: 'fix', scope: 'seed', message: 'make test fixtures deterministic' },
      { hash: '42e431f', date: '2026-08-05', type: 'fix', scope: 'auth', message: 'finalize cookie-only session flow' },
      { hash: '81cb7b9', date: '2026-08-05', type: 'fix', scope: 'deploy', message: 'build backend without test dependencies' },
      { hash: 'c6404ca', date: '2026-08-05', type: 'fix', scope: 'media', message: 'restore cloud uploads and seed recovery' },
      { hash: 'ffdc346', date: '2026-08-04', type: 'fix', scope: 'auth', message: 'restore Bearer token fallback and harden session handling for cloud login' },
      { hash: 'aa22683', date: '2026-08-04', type: 'feat', scope: 'core', message: 'complete production readiness hardening' },
    ],
  },
  {
    version: 'v1.5.0',
    title: 'Media Streaming & Cloud Storage Engine',
    date: '1 Agustus 2026',
    badge: 'Media Core',
    commits: [
      { hash: 'e3b8ed0', date: '2026-08-01', type: 'docs', scope: 'audit', message: 'close local media verification' },
      { hash: 'ea45631', date: '2026-08-01', type: 'test', scope: 'media', message: 'prove fresh upload lifecycle' },
      { hash: 'd4ad2c7', date: '2026-08-01', type: 'fix', scope: 'media', message: 'canonicalize public media delivery' },
      { hash: '6e69a6d', date: '2026-08-01', type: 'docs', scope: 'audit', message: 'add upload-media audit and production closure reports' },
      { hash: '0a10c2e', date: '2026-08-01', type: 'fix', scope: 'media', message: 'serve /media/* via streaming route in all environments' },
      { hash: '5e19e8a', date: '2026-08-01', type: 'fix', scope: 'deploy', message: 'update vercel proxy rewrites and backend CORS for custom domain loningmaju.my.id' },
      { hash: 'e9695e9', date: '2026-08-01', type: 'fix', scope: 'cors', message: 'add Authorization header to allowedHeaders in Fastify CORS configuration to fix cross-origin preflight failure' },
      { hash: '99c858c', date: '2026-08-01', type: 'fix', scope: 'auth', message: 'add Bearer token fallback, Vercel proxy rewrites, and origin guard matching to prevent login redirect loop' },
      { hash: 'a18c2aa', date: '2026-08-01', type: 'fix', scope: 'backend', message: 'allow dynamic Vercel preview/production origins in Fastify CORS configuration' },
    ],
  },
  {
    version: 'v1.0.0',
    title: 'Public Portal Launch & Directory Baseline',
    date: '1 Agustus 2026',
    badge: 'Initial Launch',
    commits: [
      { hash: '94bbe08', date: '2026-08-01', type: 'feat', scope: 'faq', message: 'expand FAQ repository to 16 detailed items across buyer, seller, map, and tech topics' },
      { hash: '031a162', date: '2026-08-01', type: 'style', scope: 'faq', message: 'refine FAQ layout into elegant card-based accordions with category headers' },
      { hash: '9e1c9f6', date: '2026-08-01', type: 'feat', scope: 'faq', message: 'expand informative FAQs with search filter, category tabs, and developer support CTA' },
      { hash: '75b2824', date: '2026-08-01', type: 'feat', scope: 'frontend', message: 'add interactive Developer Contact form chat dialog for technical inquiries' },
      { hash: '43d09c0', date: '2026-08-01', type: 'feat', scope: 'footer', message: 'add Hubungi Developer WhatsApp contact for Michael' },
      { hash: 'd1a41ac', date: '2026-08-01', type: 'refactor', scope: 'frontend', message: 'enhance navbar, footer, mission section, about village page, and category filters' },
    ],
  },
];

const commitTypeStyles: Record<string, { label: string; bg: string; text: string }> = {
  feat: { label: 'Feature', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-700 font-bold' },
  fix: { label: 'Fix', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-700 font-bold' },
  style: { label: 'Style', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-700 font-bold' },
  docs: { label: 'Docs', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-700 font-bold' },
  test: { label: 'Test', bg: 'bg-teal-500/10 border-teal-500/30', text: 'text-teal-700 font-bold' },
  chore: { label: 'Chore', bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-700 font-bold' },
  refactor: { label: 'Refactor', bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-700 font-bold' },
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
      let currentVersion = tagShaMap.get(parsedCommits[0]?.hash) || rawTags[0]?.name || 'v1.6.3';
      let currentTitle = currentVersion === 'v1.6.3' ? 'Mobile Auth Fix & Live Sync' : `Release ${currentVersion}`;
      let currentBadge = 'Versi Terbaru (Live GitHub)';
      let currentCommits: CommitItem[] = [];

      for (const c of parsedCommits) {
        const taggedVersion = tagShaMap.get(c.hash);
        if (taggedVersion && taggedVersion !== currentVersion && currentCommits.length > 0) {
          dynamicGroups.push({
            version: currentVersion,
            title: currentTitle,
            date: currentCommits[0]?.date || '2026-08-06',
            badge: currentBadge,
            commits: currentCommits,
          });
          currentVersion = taggedVersion;
          currentTitle = `Release ${taggedVersion}`;
          currentBadge = taggedVersion === 'v1.6.0' ? 'Baseline Stable' : taggedVersion === 'v1.5.0' ? 'Media Core' : 'GitHub Release';
          currentCommits = [c];
        } else {
          currentCommits.push(c);
        }
      }

      if (currentCommits.length > 0) {
        dynamicGroups.push({
          version: currentVersion,
          title: currentTitle,
          date: currentCommits[0]?.date || '2026-08-06',
          badge: currentBadge,
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
  }, []);

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
      {/* Header Banner */}
      <header className="mx-auto max-w-4xl px-5 pb-8 pt-10 text-center sm:pt-14">
        <h1 className="text-balance break-words text-4xl font-extrabold tracking-[-0.035em] text-charcoal sm:text-5xl">
          Changelog & Version History
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-warm-gray sm:text-base">
          Catatan pembaruan fitur, optimasi UI/UX, perbaikan bug, serta log commit terverifikasi dari GitHub repository LoningMaju.
        </p>

        {/* Live GitHub Fetch Status Bar */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sage-border bg-white px-3.5 py-1 text-xs font-bold text-charcoal shadow-2xs">
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Terhubung ke GitHub REST API (Live)</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-amber-700">Data Lokal (Offline Fallback)</span>
              </>
            )}
            {lastFetchedAt && <span className="text-[11px] font-normal text-warm-gray">({lastFetchedAt})</span>}
          </div>

          <button
            type="button"
            onClick={fetchGitHubData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/10 px-3 py-1 text-xs font-bold text-forest transition-colors hover:bg-forest hover:text-white disabled:opacity-50"
            title="Segarkan data commit langsung dari GitHub"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Mengambil...' : 'Segarkan'}</span>
          </button>
        </div>

        {/* Stats Grid Bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
              <Tag className="h-4 w-4 text-forest" />
              <span>Versi Terbaru</span>
            </div>
            <p className="mt-2 text-xl font-extrabold text-forest">{releases[0]?.version || 'v1.6.1'}</p>
          </div>

          <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
              <GitCommit className="h-4 w-4 text-terracotta" />
              <span>Total Commit</span>
            </div>
            <p className="mt-2 text-xl font-extrabold text-charcoal">{totalCommitsCount} Commit</p>
          </div>

          <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Status Sync</span>
            </div>
            <p className="mt-2 text-sm font-extrabold text-emerald-600">{isLive ? 'Realtime Synced' : 'Static Fallback'}</p>
          </div>

          <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
              <Terminal className="h-4 w-4 text-purple-600" />
              <span>Repository</span>
            </div>
            <a
              href="https://github.com/michaelxdips/LoningMarketplace"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold font-mono text-purple-700 hover:underline truncate"
            >
              <span>LoningMarketplace</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari commit (contoh: login, dashboard, fix, auth, commit hash)..."
              className="focus-ring w-full rounded-xl border border-sage-border bg-white py-2.5 pl-10 pr-4 text-xs text-charcoal placeholder:text-warm-gray/60 sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter size={14} className="shrink-0 text-warm-gray" />
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedType === 'all' ? 'bg-forest text-white' : 'border border-sage-border bg-white text-warm-gray hover:text-charcoal'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('feat')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedType === 'feat' ? 'bg-emerald-700 text-white' : 'border border-sage-border bg-white text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Feature (feat)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('fix')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedType === 'fix' ? 'bg-amber-700 text-white' : 'border border-sage-border bg-white text-amber-700 hover:bg-amber-50'
              }`}
            >
              Fix (bug)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('style')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedType === 'style' ? 'bg-purple-700 text-white' : 'border border-sage-border bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              Style & UI
            </button>
          </div>
        </div>
      </header>

      {/* Release Timeline List */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        {filteredReleases.length > 0 ? (
          <div className="space-y-3">
            {filteredReleases.map((release, idx) => {
              const isExpanded = expandedVersions.has(release.version);
              const isNewest = idx === 0;
              return (
                <article
                  key={release.version}
                  className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-xs"
                >
                  {/* Release Header — single compact row, clickable */}
                  <button
                    type="button"
                    onClick={() => toggleVersion(release.version)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-bg/50"
                    aria-expanded={isExpanded}
                  >
                    {/* Version pill */}
                    <span className="shrink-0 rounded-lg bg-forest px-2.5 py-0.5 text-xs font-extrabold text-white">
                      {release.version}
                    </span>

                    {/* Title — flex-1, truncated */}
                    <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-charcoal">
                      {release.title}
                    </h2>

                    {/* Right side meta */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isNewest && (
                        <span className="hidden rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 sm:inline">
                          Terbaru
                        </span>
                      )}
                      <span className="hidden items-center gap-1 text-[11px] font-medium text-warm-gray sm:flex">
                        <Calendar className="h-3 w-3 text-forest" />
                        {release.date}
                      </span>
                      <span className="text-[11px] font-medium text-warm-gray/70">
                        {release.commits.length}c
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-warm-gray/60 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Commit Items List - Collapsible */}
                  {isExpanded && (
                    <div className="border-t border-sage-border/60 px-4 pb-3 pt-2">
                      <div className="space-y-1">
                        {release.commits.map((commit) => {
                          const badgeMeta = commitTypeStyles[commit.type] || commitTypeStyles.feat;
                          return (
                            <div
                              key={commit.hash}
                              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-cream-bg/60"
                            >
                              {/* Commit Hash */}
                              <a
                                href={`https://github.com/michaelxdips/LoningMarketplace/commit/${commit.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 font-mono text-[10px] font-bold text-forest/70 hover:text-forest hover:underline"
                                title="Buka commit di GitHub"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {commit.hash}
                              </a>

                              {/* Type badge */}
                              <span className={`shrink-0 rounded px-1.5 py-px text-[9px] uppercase font-extrabold tracking-wider border ${badgeMeta.bg} ${badgeMeta.text}`}>
                                {badgeMeta.label}
                              </span>

                              {/* Scope + Message */}
                              <p className="min-w-0 flex-1 truncate text-xs text-charcoal/80">
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
          <div className="rounded-3xl border border-sage-border bg-white p-12 text-center">
            <GitCommit size={40} className="mx-auto text-warm-gray/40 mb-3" />
            <h3 className="text-base font-bold text-charcoal">Tidak ada commit yang cocok</h3>
            <p className="mt-1 text-xs text-warm-gray">
              Coba ganti kata kunci pencarian atau bersihkan filter tipe commit.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
              }}
              className="mt-4 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white uppercase tracking-wider"
            >
              Reset Filter Pencarian
            </button>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-sage-border bg-white px-5 py-3 text-xs font-bold text-charcoal hover:bg-cream-tint transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4 text-forest" />
            Kembali ke Beranda Utama
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
