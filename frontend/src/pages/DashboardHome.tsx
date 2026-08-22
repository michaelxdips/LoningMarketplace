import { AlertCircle, ArrowRight, ClipboardList, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useAuth';
import { managementApi } from '../lib/management';
import { LoadingPanel, PageHeader } from '../components/dashboard/Ui';
import { hasCapability } from '../lib/auth';

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

  if (statsQuery.isPending) {
    return <LoadingPanel />;
  }

  if (statsQuery.isError) {
    return (
      <div className="p-6 text-sm text-red-700 bg-red-50 rounded-2xl border border-red-200">
        Gagal memuat statistik dashboard. Silakan muat ulang halaman.
      </div>
    );
  }

  const stats = statsQuery.data;
  const draftUmkmsCount = stats?.umkms.draft ?? 0;
  const draftProductsCount = stats?.products.draft ?? 0;

  const needsAttention = [
    ...(draftUmkmsCount > 0 ? [{ text: `${draftUmkmsCount} UMKM masih berstatus Draf`, to: '/dashboard/umkms?status=draft' }] : []),
    ...(draftProductsCount > 0 ? [{ text: `${draftProductsCount} Produk belum diterbitkan (Draf)`, to: '/dashboard/products?status=draft' }] : []),
  ];

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user.displayName}`}
        description={
          hasCapability(user, 'dashboard:view-global-summary')
            ? `Ruang Pengelolaan ${user.roleLabel} — Pantau dan kelola seluruh direktori UMKM Desa Loning.`
            : `Ruang Pengelolaan — Kelola profil usaha dan katalog produk Anda.`
        }
      />

      {/* Command strip — primary actions, flat not pill-stacked */}
      {(canCreateUmkm || canCreateProduct || canViewAnalytics) && (
        <nav aria-label="Aksi cepat" className="mb-10 flex flex-wrap items-center gap-x-7 gap-y-2">
          {canCreateUmkm && (
            <Link to="/dashboard/umkms/new" className="focus-ring group inline-flex items-center gap-2 text-sm font-bold text-charcoal transition-colors hover:text-forest">
              <Plus className="h-4 w-4 text-terracotta" />
              Tambah UMKM
            </Link>
          )}
          {canCreateProduct && (
            <Link to="/dashboard/products/new" className="focus-ring group inline-flex items-center gap-2 text-sm font-bold text-charcoal transition-colors hover:text-forest">
              <Plus className="h-4 w-4 text-terracotta" />
              Tambah Produk
            </Link>
          )}
          {canViewAnalytics && (
            <Link to="/dashboard/analytics" className="focus-ring group inline-flex items-center gap-2 text-sm font-bold text-charcoal transition-colors hover:text-forest">
              <ClipboardList className="h-4 w-4 text-terracotta" />
              Insight inquiry
            </Link>
          )}
        </nav>
      )}

      {/* Ledger — catalogue totals on hairline rules, not boxes */}
      <section aria-label="Ringkasan katalog" className="mb-12 border-t border-charcoal/15">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <Link to="/dashboard/umkms" className="focus-ring group border-b border-charcoal/15 py-6 pr-6 transition-colors hover:bg-cream-tint/50 sm:border-b-0">
            <p className="font-serif text-5xl font-light text-forest">{stats?.umkms.total ?? 0}</p>
            <p className="mt-2 text-sm font-bold text-charcoal">Profil UMKM</p>
            <p className="mt-1 text-xs text-warm-gray">{stats?.umkms.published ?? 0} terbit &middot; {stats?.umkms.draft ?? 0} draf</p>
          </Link>
          <Link to="/dashboard/products" className="focus-ring group border-b border-charcoal/15 py-6 pr-6 transition-colors hover:bg-cream-tint/50 sm:border-b-0">
            <p className="font-serif text-5xl font-light text-forest">{stats?.products.total ?? 0}</p>
            <p className="mt-2 text-sm font-bold text-charcoal">Katalog Produk</p>
            <p className="mt-1 text-xs text-warm-gray">{stats?.products.published ?? 0} terbit &middot; {stats?.products.draft ?? 0} draf</p>
          </Link>
          {canViewUsers ? (
            <Link to="/dashboard/users" className="focus-ring group py-6 pr-6 transition-colors hover:bg-cream-tint/50">
              <p className="font-serif text-5xl font-light text-forest">{stats?.users.total ?? 0}</p>
              <p className="mt-2 text-sm font-bold text-charcoal">Pengguna</p>
              <p className="mt-1 text-xs text-warm-gray">{stats?.users.active ?? 0} aktif</p>
            </Link>
          ) : (
            <div className="py-6">
              <p className="font-serif text-5xl font-light text-forest">{stats?.products.published ?? 0}</p>
              <p className="mt-2 text-sm font-bold text-charcoal">Terbit publik</p>
              <p className="mt-1 text-xs text-warm-gray">Produk tampil di katalog</p>
            </div>
          )}
        </div>
      </section>

      {/* Perlu perhatian — quiet inline note, not a banner */}
      {needsAttention.length > 0 && (
        <section aria-label="Perlu perhatian" className="mb-12 border-l-2 border-terracotta pl-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
            <AlertCircle className="h-4 w-4" />
            Perlu perhatian
          </p>
          <ul className="mt-3 space-y-2">
            {needsAttention.map((item, idx) => (
              <li key={idx}>
                <Link to={item.to} className="focus-ring text-sm font-medium text-charcoal hover:text-forest hover:underline">
                  {item.text}
                  <ArrowRight className="ml-1.5 inline h-3.5 w-3.5 text-warm-gray" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Performa — compact line, only for analytics viewers */}
      {canViewAnalytics && (
        <section aria-label="Performa katalog" className="border-t border-charcoal/15 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-charcoal">
              <TrendingUp className="h-5 w-5 text-forest" />
              Performa 30 hari terakhir
            </h2>
            <Link to="/dashboard/analytics" className="focus-ring inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline">
              Lihat detail
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {analyticsQuery.isPending ? (
            <p className="mt-4 text-xs text-warm-gray">Memuat data insight...</p>
          ) : analyticsQuery.isError ? (
            <p className="mt-4 text-xs text-amber-700">Gagal memuat data insight.</p>
          ) : (
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              <div>
                <dd className="font-serif text-3xl font-light text-charcoal">
                  {(analyticsQuery.data?.totals?.umkm_view ?? 0) + (analyticsQuery.data?.totals?.product_view ?? 0)}
                </dd>
                <dt className="mt-1 text-xs text-warm-gray">Tampilan katalog</dt>
              </div>
              <div>
                <dd className="font-serif text-3xl font-light text-charcoal">{analyticsQuery.data?.totals?.inquiry_started ?? 0}</dd>
                <dt className="mt-1 text-xs text-warm-gray">Dialog inquiry dibuka</dt>
              </div>
              <div>
                <dd className="font-serif text-3xl font-light text-charcoal">{analyticsQuery.data?.totals?.whatsapp_opened ?? 0}</dd>
                <dt className="mt-1 text-xs text-warm-gray">Klik menghubungi WA</dt>
              </div>
              <div>
                <dd className="font-serif text-3xl font-light text-forest">
                  {(() => {
                    const totalViews = (analyticsQuery.data?.totals?.umkm_view ?? 0) + (analyticsQuery.data?.totals?.product_view ?? 0);
                    const started = analyticsQuery.data?.totals?.inquiry_started ?? 0;
                    return totalViews > 0 ? ((started / totalViews) * 100).toFixed(1) + '%' : '0.0%';
                  })()}
                </dd>
                <dt className="mt-1 text-xs text-warm-gray">Tingkat minat</dt>
              </div>
            </dl>
          )}
        </section>
      )}
    </>
  );
}
