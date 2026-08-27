import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, ExternalLink, GitCommit, RotateCw, Search, Tag, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router';
import { usePageMetadata } from '@loning/shared/lib/seo';
import {
  fetchGitHubReleaseData,
  STATIC_RELEASES,
  type ReleaseGroup,
} from '@loning/shared/content/versionHistory';
import { Button } from '@v2-shared/ui/Button';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { EmptyState } from '@v2-shared/ui/EmptyState';
import { cn } from '@v2-shared/ui/cn';

/**
 * Riwayat Versi V2 — pasangan fitur dari /version-history UI lama.
 *
 * Data & parser kini dari @loning/shared/content/versionHistory (satu sumber
 * kebenaran). UI memakai editorial list tanpa kartu ber-shadow: accordion
 * release -> commit items, dengan status sinkronisasi GitHub.
 */
const commitTypeStyles: Record<string, string> = {
  feat: 'text-brand',
  fix: 'text-accent-ink',
  style: 'text-ink-muted',
  docs: 'text-ink-muted',
  test: 'text-ink-muted',
  chore: 'text-ink-muted',
  refactor: 'text-ink-muted',
};

export default function VersionHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [releases, setReleases] = useState<ReleaseGroup[]>(STATIC_RELEASES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([STATIC_RELEASES[0]?.version ?? '']));

  const toggleVersion = useCallback((version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
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
      const resolved = await fetchGitHubReleaseData('michaelxdips/LoningMarketplace');
      setReleases(resolved);
      setExpandedVersions(new Set([resolved[0]?.version ?? '']));
      setIsLive(true);
      setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      setReleases(STATIC_RELEASES);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGitHubData();
  }, [fetchGitHubData]);

  const totalCommitsCount = useMemo(() => releases.reduce((acc, rel) => acc + rel.commits.length, 0), [releases]);

  const filteredReleases = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return releases
      .map((group) => ({
        ...group,
        commits: group.commits.filter((commit) => {
          const matchesType = selectedType === 'all' || commit.type === selectedType;
          const matchesQuery =
            !query || commit.hash.toLowerCase().includes(query) || commit.message.toLowerCase().includes(query) || (commit.scope && commit.scope.toLowerCase().includes(query));
          return matchesType && matchesQuery;
        }),
      }))
      .filter((group) => group.commits.length > 0);
  }, [releases, searchQuery, selectedType]);

  return (
    <>
      {/* Header */}
      <div className="border-b border-line">
        <div className="mx-auto max-w-4xl px-6 pb-10 pt-16 lg:px-10">
          <Eyebrow>Catatan rilis</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance sm:text-4xl">
            Riwayat pembaruan & commit log
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Catatan rilis terverifikasi langsung dari repository GitHub LoningMaju.
          </p>

          <div className="mt-6 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Tag size={13} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
                <span className="text-ink-muted">Versi Aktif:</span>
                <span className="numeric rounded bg-sunken px-2 py-0.5 font-medium text-brand">{releases[0]?.version || 'v2.2.0'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitCommit size={13} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" />
                <span className="text-ink-muted">Total:</span>
                <span className="numeric font-medium text-ink">{totalCommitsCount} Commit</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-ink">
                    <Wifi size={13} strokeWidth={1.5} aria-hidden="true" />
                    GitHub Live {lastFetchedAt ? <span className="font-normal text-ink-muted">({lastFetchedAt})</span> : null}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                    <WifiOff size={13} strokeWidth={1.5} aria-hidden="true" />
                    Data Lokal
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchGitHubData}
                disabled={isLoading}
                className="focus-ring-v2 inline-flex h-9 items-center gap-1.5 rounded-control border border-control-border px-3 text-xs font-medium text-ink hover:bg-sunken disabled:opacity-50"
                title="Segarkan commit langsung dari GitHub API"
              >
                <RotateCw size={13} strokeWidth={1.5} className={cn('text-brand', isLoading && 'animate-spin')} aria-hidden="true" />
                {isLoading ? 'Syncing...' : 'Segarkan'}
              </button>
              <a
                href="https://github.com/michaelxdips/LoningMarketplace"
                target="_blank"
                rel="noreferrer"
                className="focus-ring-v2 inline-flex h-9 items-center gap-1.5 rounded-control border border-control-border px-3 text-xs font-medium text-ink hover:bg-sunken"
              >
                Repo GitHub
                <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Search & filter toolbar */}
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="v2-version-search" className="sr-only">
                Cari commit
              </label>
              <Search size={14} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
              <input
                id="v2-version-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari commit (contoh: media, fix, auth, commit hash)..."
                className="focus-ring-v2 h-9 w-full rounded-control border border-control-border bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                ['all', 'Semua'],
                ['feat', 'Feature'],
                ['fix', 'Fix'],
                ['style', 'Style & UI'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedType(value)}
                  aria-pressed={selectedType === value}
                  className={cn(
                    'focus-ring-v2 h-9 shrink-0 whitespace-nowrap rounded-control border px-3 text-xs font-medium transition-colors',
                    selectedType === value ? 'border-brand bg-brand text-on-brand' : 'border-control-border text-ink hover:bg-sunken',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Release timeline */}
      <section className="mx-auto max-w-4xl px-6 pb-16 lg:px-10">
        {filteredReleases.length === 0 ? (
          <EmptyState
            title="Tidak ada commit yang cocok"
            description="Coba kata kunci lain atau bersihkan filter tipe commit."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
              >
                Reset Filter
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {filteredReleases.map((release, idx) => {
              const isExpanded = expandedVersions.has(release.version);
              const isNewest = idx === 0;
              return (
                <article key={release.version} className="border border-line">
                  <button
                    type="button"
                    onClick={() => toggleVersion(release.version)}
                    className="focus-ring-v2 flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-sunken"
                    aria-expanded={isExpanded}
                  >
                    <span className="numeric shrink-0 rounded-sm bg-brand px-2 py-0.5 text-xs font-medium text-on-brand">{release.version}</span>
                    <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{release.title}</h2>
                    <div className="flex shrink-0 items-center gap-2">
                      {isNewest && <span className="hidden rounded-sm bg-accent-ink/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-accent-ink sm:inline">Terbaru</span>}
                      <span className="hidden items-center gap-1 text-xs text-ink-muted sm:flex">
                        <Calendar size={13} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
                        {release.date}
                      </span>
                      <span className="rounded-sm bg-sunken px-1.5 py-0.5 text-xs font-medium text-ink-muted">{release.commits.length} commit</span>
                      <ChevronDown size={15} strokeWidth={1.5} className={cn('text-ink-muted transition-transform duration-200', isExpanded && 'rotate-180')} aria-hidden="true" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 border-t border-line px-3.5 pb-2.5 pt-2">
                      {release.commits.map((commit, commitIdx) => (
                        <div key={`${release.version}-${commit.hash}-${commitIdx}`} className="group flex items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-sunken">
                          <a
                            href={`https://github.com/michaelxdips/LoningMarketplace/commit/${commit.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="numeric shrink-0 rounded-sm bg-sunken px-1.5 py-0.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-on-brand"
                            title="Buka commit di GitHub"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {commit.hash}
                          </a>
                          <span className={cn('shrink-0 text-xs font-semibold uppercase tracking-wider', commitTypeStyles[commit.type] || 'text-ink-muted')}>
                            {commit.type}
                          </span>
                          <p className="min-w-0 flex-1 truncate text-sm text-ink">
                            {commit.scope && <span className="font-medium text-brand">({commit.scope}): </span>}
                            {commit.message}
                          </p>
                          <span className="hidden shrink-0 text-xs text-ink-subtle sm:block">{commit.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/v2" className="focus-ring-v2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </>
  );
}
