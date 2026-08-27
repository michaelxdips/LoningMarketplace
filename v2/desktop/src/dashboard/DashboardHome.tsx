import { AlertCircle, ArrowRight, ClipboardList, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { hasCapability } from '@loning/shared/lib/auth';
import { managementApi } from '@loning/shared/lib/management';
import { useSession } from '@loning/shared/hooks/useAuth';
import { LoadingPanel, PageHeader } from './Ui';

/**
 * DashboardHome V2 — pasangan fitur dari DashboardHome UI lama.
 *
 * Layout ledger (angka serif pada hairline, bukan kartu KPI) dipertahankan.
 */
export default function DashboardHome() {
  const user = useSession().data!.user;

  const statsQuery = useQuery({
    queryKey: ['manage', 'stats'],
    queryFn: ({ signal }) => managementApi.stats.get(signal),
  });

  const canViewUsers = hasCapability(user, 'users:view');
  const canViewAnalytics = hasCapability(user, 'analytics:view-global');
  const canCreateUmkm = hasCapability(user, 'umkms:create');
  const canCreateProduct = hasCapability(user, 'products:create');

  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics', 'dashboard-home-30d'],
    queryFn: ({ signal }) => {
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - 30 * 86_400_000);
      return managementApi.analytics.get(fromDate.toISOString().slice(0, 10), toDate.toISOString().slice(0, 10), signal);
    },
    enabled: canViewAnalytics,
  });

  if (statsQuery.isPending) return <LoadingPanel />;
  if (statsQuery.isError) {
    return (
      <div className="border border-danger/40 bg-sunken p-6 text-sm text-danger-ink" role="alert">
        Gagal memuat statistik dashboard. Silakan muat ulang halaman.
      </div>
    );
  }

  const stats = statsQuery.data;
  const draftUmkmsCount = stats?.umkms.draft ?? 0;
  const draftProductsCount = stats?.products.draft ?? 0;

  const needsAttention = [
    ...(draftUmkmsCount > 0 ? [{ text: `${draftUmkmsCount} UMKM masih berstatus Draf`, to: '/v2/dashboard/umkms?status=draft' }] : []),
    ...(draftProductsCount > 0 ? [{ text: `${draftProductsCount} Produk belum diterbitkan (Draf)`, to: '/v2/dashboard/products?status=draft' }] : []),
  ];

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user.displayName}`}
        description={
          hasCapability(user, 'dashboard:view-global-summary')
            ? `Ruang Pengelolaan ${user.roleLabel}. Pantau dan kelola seluruh direktori UMKM Desa Loning.`
            : 'Ruang Pengelolaan. Kelola profil usaha dan katalog produk Anda.'
        }
      />

      {(canCreateUmkm || canCreateProduct || canViewAnalytics) && (
        <nav aria-label="Aksi cepat" className="mb-10 flex flex-wrap items-center gap-x-7 gap-y-2">
          {canCreateUmkm && (
            <Link to="/v2/dashboard/umkms/new" className="focus-ring-v2 group inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-brand">
              <Plus size={15} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" />
              Tambah UMKM
            </Link>
          )}
          {canCreateProduct && (
            <Link to="/v2/dashboard/products/new" className="focus-ring-v2 group inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-brand">
              <Plus size={15} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" />
              Tambah Produk
            </Link>
          )}
          {canViewAnalytics && (
            <Link to="/v2/dashboard/analytics" className="focus-ring-v2 group inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-brand">
              <ClipboardList size={15} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" />
              Insight inquiry
            </Link>
          )}
        </nav>
      )}

      <section aria-label="Ringkasan katalog" className="mb-12 border-t border-line">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <Link to="/v2/dashboard/umkms" className="focus-ring-v2 group border-b border-line py-6 pr-6 transition-colors hover:bg-sunken sm:border-b-0">
            <p className="numeric font-display text-5xl font-light text-brand">{stats?.umkms.total ?? 0}</p>
            <p className="mt-2 text-sm font-medium text-ink">Profil UMKM</p>
            <p className="mt-1 text-xs text-ink-muted">
              {stats?.umkms.published ?? 0} terbit · {stats?.umkms.draft ?? 0} draf
            </p>
          </Link>
          <Link to="/v2/dashboard/products" className="focus-ring-v2 group border-b border-line py-6 pr-6 transition-colors hover:bg-sunken sm:border-b-0">
            <p className="numeric font-display text-5xl font-light text-brand">{stats?.products.total ?? 0}</p>
            <p className="mt-2 text-sm font-medium text-ink">Katalog Produk</p>
            <p className="mt-1 text-xs text-ink-muted">
              {stats?.products.published ?? 0} terbit · {stats?.products.draft ?? 0} draf
            </p>
          </Link>
          {canViewUsers ? (
            <Link to="/v2/dashboard/users" className="focus-ring-v2 group py-6 pr-6 transition-colors hover:bg-sunken">
              <p className="numeric font-display text-5xl font-light text-brand">{stats?.users.total ?? 0}</p>
              <p className="mt-2 text-sm font-medium text-ink">Pengguna</p>
              <p className="mt-1 text-xs text-ink-muted">{stats?.users.active ?? 0} aktif</p>
            </Link>
          ) : (
            <div className="py-6">
              <p className="numeric font-display text-5xl font-light text-brand">{stats?.products.published ?? 0}</p>
              <p className="mt-2 text-sm font-medium text-ink">Terbit publik</p>
              <p className="mt-1 text-xs text-ink-muted">Produk tampil di katalog</p>
            </div>
          )}
        </div>
      </section>

      {needsAttention.length > 0 && (
        <section aria-label="Perlu perhatian" className="mb-12 border-l-2 border-accent pl-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-ink">
            <AlertCircle size={15} strokeWidth={1.5} aria-hidden="true" />
            Perlu perhatian
          </p>
          <ul className="mt-3 space-y-2">
            {needsAttention.map((item, idx) => (
              <li key={idx}>
                <Link to={item.to} className="focus-ring-v2 text-sm font-medium text-ink hover:text-brand hover:underline">
                  {item.text}
                  <ArrowRight size={14} strokeWidth={1.5} className="ml-1.5 inline text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canViewAnalytics && (
        <section aria-label="Performa katalog" className="border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <TrendingUp size={18} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
              Performa 30 hari terakhir
            </h2>
            <Link to="/v2/dashboard/analytics" className="focus-ring-v2 inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline">
              Lihat detail
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>

          {analyticsQuery.isPending ? (
            <p className="mt-4 text-xs text-ink-muted">Memuat data insight...</p>
          ) : analyticsQuery.isError ? (
            <p className="mt-4 text-xs text-warning-ink">Gagal memuat data insight.</p>
          ) : (
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              <div>
                <dd className="numeric font-display text-3xl font-light text-ink">
                  {(analyticsQuery.data?.totals?.umkm_view ?? 0) + (analyticsQuery.data?.totals?.product_view ?? 0)}
                </dd>
                <dt className="mt-1 text-xs text-ink-muted">Tampilan katalog</dt>
              </div>
              <div>
                <dd className="numeric font-display text-3xl font-light text-ink">{analyticsQuery.data?.totals?.inquiry_started ?? 0}</dd>
                <dt className="mt-1 text-xs text-ink-muted">Dialog inquiry dibuka</dt>
              </div>
              <div>
                <dd className="numeric font-display text-3xl font-light text-ink">{analyticsQuery.data?.totals?.whatsapp_opened ?? 0}</dd>
                <dt className="mt-1 text-xs text-ink-muted">Klik menghubungi WA</dt>
              </div>
              <div>
                <dd className="numeric font-display text-3xl font-light text-brand">
                  {(() => {
                    const totalViews = (analyticsQuery.data?.totals?.umkm_view ?? 0) + (analyticsQuery.data?.totals?.product_view ?? 0);
                    const started = analyticsQuery.data?.totals?.inquiry_started ?? 0;
                    return totalViews > 0 ? ((started / totalViews) * 100).toFixed(1) + '%' : '0.0%';
                  })()}
                </dd>
                <dt className="mt-1 text-xs text-ink-muted">Tingkat minat</dt>
              </div>
            </dl>
          )}
        </section>
      )}
    </>
  );
}
