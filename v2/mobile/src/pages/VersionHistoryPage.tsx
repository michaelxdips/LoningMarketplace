import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, GitCommit, RotateCw, Search, Tag, Wifi, WifiOff } from 'lucide-react';
import { usePageMetadata } from '@loning/shared/lib/seo';
import {
  STATIC_RELEASES,
  VERSION_TITLES,
  parseCommitMessage,
  formatDateISO,
  type CommitItem,
  type GitHubCommitResponse,
  type GitHubTagResponse,
  type ReleaseGroup,
} from '@loning/shared/content/versionHistory';
import { Button } from '@v2-shared/ui/Button';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { EmptyState } from '@v2-shared/ui/EmptyState';
import { cn } from '@v2-shared/ui/cn';

/**
 * Riwayat Versi V2 mobile — accordion release satu kolom.
 */
const commitTypeStyles: Record<string, string> = { feat: 'text-brand', fix: 'text-accent-ink', style: 'text-ink-muted', docs: 'text-ink-muted', test: 'text-ink-muted', chore: 'text-ink-muted', refactor: 'text-ink-muted' };

export default function VersionHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [releases, setReleases] = useState<ReleaseGroup[]>(STATIC_RELEASES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([STATIC_RELEASES[0]?.version ?? '']));

  usePageMetadata({ title: 'Riwayat Versi & Commit — Loning Maju', description: 'Log lengkap riwayat versi, changelog pembaruan, perbaikan bug, dan commit GitHub resmi platform Loning Maju.' });

  const toggleVersion = useCallback((version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  }, []);

  const fetchGitHubData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [page1Res, page2Res, tagsRes] = await Promise.all([
        fetch('https://api.github.com/repos/michaelxdips/LoningMarketplace/commits?per_page=100&page=1', { headers: { Accept: 'application/vnd.github.v3+json' } }),
        fetch('https://api.github.com/repos/michaelxdips/LoningMarketplace/commits?per_page=100&page=2', { headers: { Accept: 'application/vnd.github.v3+json' } }),
        fetch('https://api.github.com/repos/michaelxdips/LoningMarketplace/tags', { headers: { Accept: 'application/vnd.github.v3+json' } }),
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
        const { type, scope, message } = parseCommitMessage(item.commit?.message || '');
        return { hash: item.sha.slice(0, 7), date: formatDateISO(item.commit?.committer?.date || item.commit?.author?.date), type, scope, message };
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
        } else currentCommits.push(c);
      }
      if (currentCommits.length > 0) {
        const derivedTitle = VERSION_TITLES[currentVersion] || (currentCommits[0] ? `${currentCommits[0].scope ? `[${currentCommits[0].scope}] ` : ''}${currentCommits[0].message}` : `Release ${currentVersion}`);
        dynamicGroups.push({ version: currentVersion, title: derivedTitle, date: currentCommits[0]?.date || '2026-08-06', badge: 'Release', commits: currentCommits });
      }
      const resolved = dynamicGroups.length > 0 ? dynamicGroups : STATIC_RELEASES;
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

  useEffect(() => { fetchGitHubData(); }, [fetchGitHubData]);

  const filteredReleases = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return releases
      .map((group) => ({ ...group, commits: group.commits.filter((commit) => {
        const matchesType = selectedType === 'all' || commit.type === selectedType;
        const matchesQuery = !query || commit.hash.toLowerCase().includes(query) || commit.message.toLowerCase().includes(query) || (commit.scope && commit.scope.toLowerCase().includes(query));
        return matchesType && matchesQuery;
      }) }))
      .filter((group) => group.commits.length > 0);
  }, [releases, searchQuery, selectedType]);

  return (
    <>
      <div className="px-4 pb-6 pt-8">
        <Eyebrow>Catatan rilis</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink text-balance">Riwayat pembaruan & commit log</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5"><Tag size={14} strokeWidth={1.5} className="text-brand" aria-hidden="true" /><span className="text-ink-muted">Versi:</span><span className="numeric rounded-sm bg-sunken px-2 py-0.5 font-medium text-brand">{releases[0]?.version || 'v1.7.2'}</span></div>
          <div className="flex items-center gap-1.5"><GitCommit size={14} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" /><span className="numeric font-medium text-ink">{releases.reduce((a, r) => a + r.commits.length, 0)} Commit</span></div>
          <div className="flex items-center gap-1.5">
            {isLive ? <span className="inline-flex items-center gap-1 text-xs font-medium text-success-ink"><Wifi size={14} strokeWidth={1.5} aria-hidden="true" />Live{lastFetchedAt ? ` (${lastFetchedAt})` : ''}</span> : <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted"><WifiOff size={14} strokeWidth={1.5} aria-hidden="true" />Lokal</span>}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="m-version-search" className="sr-only">Cari commit</label>
            <Search size={15} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input id="m-version-search" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari commit…" className="focus-ring-v2 min-h-12 w-full rounded-control border border-control-border bg-surface pl-9 pr-3 text-base text-ink placeholder:text-ink-subtle" />
          </div>
          <button type="button" onClick={fetchGitHubData} disabled={isLoading} title="Segarkan dari GitHub" className="focus-ring-v2 touch-44 inline-flex shrink-0 items-center justify-center rounded-control border border-control-border text-ink-muted hover:bg-sunken hover:text-ink disabled:opacity-50">
            <RotateCw size={16} strokeWidth={1.5} className={cn(isLoading && 'animate-spin')} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[['all', 'Semua'], ['feat', 'Feature'], ['fix', 'Fix'], ['style', 'Style & UI']].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setSelectedType(value)} aria-pressed={selectedType === value} className={cn('focus-ring-v2 min-h-11 shrink-0 rounded-control border px-3 text-sm font-medium transition-colors', selectedType === value ? 'border-brand bg-brand text-on-brand' : 'border-control-border text-ink hover:bg-sunken')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 pb-12">
        {filteredReleases.length === 0 ? (
          <EmptyState title="Tidak ada commit yang cocok" description="Coba kata kunci lain atau bersihkan filter." action={<Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedType('all'); }}>Reset Filter</Button>} />
        ) : (
          <div className="space-y-2.5">
            {filteredReleases.map((release) => {
              const isExpanded = expandedVersions.has(release.version);
              return (
                <article key={release.version} className="border border-line">
                  <button type="button" onClick={() => toggleVersion(release.version)} aria-expanded={isExpanded} className="focus-ring-v2 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sunken">
                    <span className="numeric shrink-0 rounded-sm bg-brand px-2 py-0.5 text-xs font-medium text-on-brand">{release.version}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{release.title}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{release.commits.length}</span>
                    <ChevronDown size={15} strokeWidth={1.5} className={cn('shrink-0 text-ink-muted transition-transform duration-200', isExpanded && 'rotate-180')} aria-hidden="true" />
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 border-t border-line px-3 pb-2.5 pt-2">
                      {release.commits.map((commit, commitIdx) => (
                        <div key={`${release.version}-${commit.hash}-${commitIdx}`} className="flex items-start gap-2 rounded-sm px-1 py-1">
                          <a href={`https://github.com/michaelxdips/LoningMarketplace/commit/${commit.hash}`} target="_blank" rel="noreferrer" className="numeric shrink-0 rounded-sm bg-sunken px-1.5 py-0.5 text-xs font-medium text-brand">{commit.hash}</a>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-ink">
                              <span className={cn('mr-1 text-xs font-semibold uppercase', commitTypeStyles[commit.type] || 'text-ink-muted')}>{commit.type}</span>
                              {commit.scope && <span className="font-medium text-brand">({commit.scope}): </span>}
                              {commit.message}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-subtle"><Calendar size={12} strokeWidth={1.5} aria-hidden="true" />{commit.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
