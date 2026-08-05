import { AlertCircle, ArrowRight, ClipboardList, Clock, MapPin, Package, Plus, ShieldAlert, Store, Users } from 'lucide-react';
import { Link } from 'react-router';
import { useSession } from '../hooks/useAuth';
import { useManagedList } from '../hooks/useManagement';
import { managementApi, pageItems, type AuditLog } from '../lib/management';
import { LoadingPanel, PageHeader } from '../components/dashboard/Ui';
import { hasCapability } from '../lib/auth';
import { formatAuditEvent } from '../lib/auditEvents';

export default function DashboardHome() {
  const user = useSession().data!.user;
  const params = { limit: 100 };

  const umkmsQuery = useManagedList('manage', 'umkms', params, signal => managementApi.umkms.list(params, signal));
  const productsQuery = useManagedList('manage', 'products', params, signal => managementApi.products.list(params, signal));

  const canViewUsers = hasCapability(user, 'users:view');
  const usersQuery = useManagedList('admin', 'users', params, signal => managementApi.users.list(params, signal), canViewUsers);

  const canViewAudit = hasCapability(user, 'audit:view-global');
  const auditQuery = useManagedList('admin', 'audit-logs', { limit: 6 }, signal => managementApi.audit.list({ limit: 6 }, signal), canViewAudit);

  const canViewAnalytics = hasCapability(user, 'analytics:view-global');

  if (umkmsQuery.isPending || productsQuery.isPending || (canViewUsers && usersQuery.isPending)) {
    return <LoadingPanel />;
  }

  const umkms = pageItems(umkmsQuery.data);
  const products = pageItems(productsQuery.data);
  const users = pageItems(usersQuery.data);
  const auditLogs = pageItems(auditQuery.data);

  const publishedUmkms = umkms.filter(u => u.publicationStatus === 'published');
  const draftUmkms = umkms.filter(u => u.publicationStatus === 'draft');

  const publishedProducts = products.filter(p => p.publicationStatus === 'published');
  const draftProducts = products.filter(p => p.publicationStatus === 'draft');

  const needsAttention = [
    ...(draftUmkms.length > 0 ? [{ text: `${draftUmkms.length} UMKM masih berstatus Draf`, to: '/dashboard/umkms?status=draft' }] : []),
    ...(draftProducts.length > 0 ? [{ text: `${draftProducts.length} Produk belum diterbitkan (Draf)`, to: '/dashboard/products?status=draft' }] : []),
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
              {publishedUmkms.length} Terbit
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-forest">{umkms.length}</p>
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
              {publishedProducts.length} Terbit
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-forest">{products.length}</p>
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
                {users.filter(u => u.isActive).length} Aktif
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-forest">{users.length}</p>
            <h2 className="mt-1 font-extrabold text-charcoal">Pengguna Dashboard</h2>
            <p className="mt-1.5 text-xs leading-5 text-warm-gray">Akun pengelola dan pemilik usaha.</p>
          </Link>
        )}
      </section>

      {/* Recent Activity Audit Feed */}
      {canViewAudit && auditLogs.length > 0 && (
        <section className="rounded-2xl border border-sage-border bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-charcoal">
              <Clock className="h-5 w-5 text-forest" />
              Aktivitas Terbaru
            </h3>
            <Link to="/dashboard/audit" className="focus-ring flex items-center gap-1 text-xs font-bold text-forest hover:underline">
              Lihat semua audit log
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-sage-border">
            {auditLogs.map((log: AuditLog) => {
              const human = formatAuditEvent(log.action);
              return (
                <div key={log.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-bold text-charcoal">{human.title}</p>
                    <p className="text-warm-gray">
                      {log.actor?.displayName ? `Oleh ${log.actor.displayName}` : 'Oleh Sistem'}
                    </p>
                  </div>
                  <time dateTime={log.createdAt} className="text-warm-gray font-medium">
                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(log.createdAt))}
                  </time>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
