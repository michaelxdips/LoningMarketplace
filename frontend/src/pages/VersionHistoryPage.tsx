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
import {
  STATIC_RELEASES,
  VERSION_TITLES,
  parseCommitMessage,
  formatDateISO,
  type CommitItem,
  type ReleaseGroup,
  type GitHubCommitResponse,
  type GitHubTagResponse,
} from '@loning/shared/content/versionHistory';


const commitTypeStyles: Record<string, { label: string; text: string }> = {
  feat: { label: 'Feature', text: 'text-forest' },
  fix: { label: 'Fix', text: 'text-terracotta' },
  style: { label: 'Style', text: 'text-warm-gray' },
  docs: { label: 'Docs', text: 'text-warm-gray' },
  test: { label: 'Test', text: 'text-warm-gray' },
  chore: { label: 'Chore', text: 'text-warm-gray' },
  refactor: { label: 'Refactor', text: 'text-warm-gray' },
};

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

