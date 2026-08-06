import { AlertCircle, ArrowRight, ClipboardList, ExternalLink, Eye, MessageSquare, Package, Plus, Store, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useAuth';
import { useManagedList } from '../hooks/useManagement';
import { managementApi, pageItems } from '../lib/management';
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

      {/* Quick Action Shortcuts */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {hasCapability(user, 'umkms:create') && (
          <Link
            to="/dashboard/umkms/new"
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white hover:bg-forest/90"
          >
            <Plus className="h-4 w-4" />
            Tambah UMKM
          </Link>
        )}

        {hasCapability(user, 'products:create') && (
          <Link
            to="/dashboard/products/new"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-sage-border bg-white px-4 py-2.5 text-xs font-bold text-charcoal hover:bg-cream-bg"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Link>
        )}

        {canViewAnalytics && (
          <Link
            to="/dashboard/analytics"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-sage-border bg-white px-4 py-2.5 text-xs font-bold text-charcoal hover:bg-cream-bg"
          >
            <ClipboardList className="h-4 w-4 text-forest" />
            Lihat Insight Inquiry
          </Link>
        )}
      </div>

      {/* Perlu Perhatian Alert Banner */}
      {needsAttention.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Perlu Perhatian ({needsAttention.length})
          </div>
          <ul className="space-y-1.5 pl-7 text-xs font-semibold text-amber-900 list-disc">
            {needsAttention.map((item, idx) => (
              <li key={idx}>
                <Link to={item.to} className="hover:underline">
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Real Metric KPI Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          to="/dashboard/umkms"
          className="focus-ring transition-card rounded-2xl border border-sage-border bg-white p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest/10 text-forest">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {stats?.umkms.published ?? 0} Terbit
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-forest">{stats?.umkms.total ?? 0}</p>
          <h2 className="mt-1 font-extrabold text-charcoal">Profil UMKM</h2>
          <p className="mt-1.5 text-xs leading-5 text-warm-gray">Total usaha terdaftar di katalog desa.</p>
        </Link>

        <Link
          to="/dashboard/products"
          className="focus-ring transition-card rounded-2xl border border-sage-border bg-white p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest/10 text-forest">
              <Package className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {stats?.products.published ?? 0} Terbit
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-forest">{stats?.products.total ?? 0}</p>
          <h2 className="mt-1 font-extrabold text-charcoal">Katalog Produk</h2>
          <p className="mt-1.5 text-xs leading-5 text-warm-gray">Total produk terdaftar di katalog desa.</p>
        </Link>

        {canViewUsers && (
          <Link
            to="/dashboard/users"
            className="focus-ring transition-card rounded-2xl border border-sage-border bg-white p-5 shadow-xs hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest/10 text-forest">
                <Users className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-forest bg-cream-bg px-2.5 py-1 rounded-full border border-sage-border">
                {stats?.users.active ?? 0} Aktif
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-forest">{stats?.users.total ?? 0}</p>
            <h2 className="mt-1 font-extrabold text-charcoal">Pengguna Dashboard</h2>
            <p className="mt-1.5 text-xs leading-5 text-warm-gray">Akun pengelola dan pemilik usaha.</p>
          </Link>
        )}
      </section>

      {/* Mini Analytics & Performa (30 Hari Terakhir) */}
      {canViewAnalytics && (
        <section className="rounded-2xl border border-sage-border bg-white p-6 shadow-xs">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-extrabold text-charcoal">
                <TrendingUp className="h-5 w-5 text-forest" />
                Performa Katalog & Inquiry (30 Hari Terakhir)
              </h3>
              <p className="text-xs text-warm-gray">Ringkasan aktivitas pengunjung dan minat pembeli di katalog desa.</p>
            </div>
            <Link to="/dashboard/analytics" className="focus-ring mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline sm:mt-0">
              Lihat detail insight
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {analyticsQuery.isPending ? (
            <div className="py-6 text-center text-xs text-warm-gray">Memuat data insight...</div>
          ) : analyticsQuery.isError ? (
            <div className="py-4 text-xs text-amber-700">Gagal memuat data insight.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-sage-border bg-cream-bg/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
                  <Eye className="h-4 w-4 text-forest" />
                  Total Tampilan Katalog
                </div>
                <p className="mt-2 text-2xl font-extrabold text-forest">
                  {(analyticsQuery.data?.totals?.umkm_view ?? 0) + (analyticsQuery.data?.totals?.product_view ?? 0)}
                </p>
                <p className="mt-1 text-[11px] text-warm-gray">
                  {analyticsQuery.data?.totals?.product_view ?? 0} produk & {analyticsQuery.data?.totals?.umkm_view ?? 0} UMKM
                </p>
              </div>

              <div className="rounded-xl border border-sage-border bg-cream-bg/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  Dialog Inquiry Dibuka
                </div>
                <p className="mt-2 text-2xl font-extrabold text-charcoal">
                  {analyticsQuery.data?.totals?.inquiry_started ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-warm-gray">Pengunjung membuka dialog tanya</p>
              </div>

              <div className="rounded-xl border border-sage-border bg-cream-bg/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  Klik Menghubungi WA
                </div>
                <p className="mt-2 text-2xl font-extrabold text-charcoal">
                  {analyticsQuery.data?.totals?.whatsapp_opened ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-warm-gray">Upaya pesan ke WhatsApp seller</p>
              </div>

              <div className="rounded-xl border border-sage-border bg-cream-bg/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-warm-gray">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  Tingkat Minat (Intent Rate)
                </div>
                <p className="mt-2 text-2xl font-extrabold text-forest">
                  {(() => {
                    const totalViews = (analyticsQuery.data?.totals?.umkm_view ?? 0) + (analyticsQuery.data?.totals?.product_view ?? 0);
                    const started = analyticsQuery.data?.totals?.inquiry_started ?? 0;
                    return totalViews > 0 ? ((started / totalViews) * 100).toFixed(1) + '%' : '0.0%';
                  })()}
                </p>
                <p className="mt-1 text-[11px] text-warm-gray">Rasio pengunjung vs yang berminat</p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

