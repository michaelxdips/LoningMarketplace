import { Navigate, Outlet, useLocation } from 'react-router';
import { hasCapability, type UserRole } from '../../lib/auth';
import { useLogout, useSession } from '../../hooks/useAuth';
import { LoadingPanel } from './Ui';

function SessionError({ retry }: { retry: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-cream-bg p-4"><div className="w-full max-w-md rounded-2xl border border-sage-border bg-white p-6 text-center"><h1 className="text-lg font-extrabold text-charcoal">Tidak dapat terhubung ke layanan</h1><p className="mt-2 text-sm leading-6 text-warm-gray">Periksa koneksi backend, lalu coba lagi.</p><button className="focus-ring touch-target mt-5 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white hover:bg-forest-hover" onClick={retry}>Coba Lagi</button></div></main>;
}

export function PublicOnlyGuard() {
  const session = useSession();
  if (session.isPending) return <main className="grid min-h-screen place-items-center"><LoadingPanel /></main>;
  if (session.isError) return <SessionError retry={() => void session.refetch()} />;
  if (session.data?.user) return <Navigate to={session.data.user.mustChangePassword ? '/change-password' : '/dashboard'} replace />;
  return <Outlet />;
}
export function ProtectedGuard() {
  const session = useSession(); const location = useLocation();
  if (session.isPending) return <main className="grid min-h-screen place-items-center"><LoadingPanel /></main>;
  if (session.isError) return <SessionError retry={() => void session.refetch()} />;
  if (!session.data?.user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!hasCapability(session.data.user.role, 'accessDashboard') && location.pathname !== '/unsupported-role' && location.pathname !== '/change-password') return <Navigate to="/unsupported-role" replace />;
  return <Outlet />;
}
export function PasswordGuard() {
  const session = useSession(); const location = useLocation();
  if (session.data?.user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  if (!session.data?.user.mustChangePassword && hasCapability(session.data.user.role, 'accessDashboard') && location.pathname === '/change-password') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
export function UnsupportedRolePage() {
  const session = useSession().data!; const logout = useLogout();
  if (hasCapability(session.user.role, 'accessDashboard')) return <Navigate to="/dashboard" replace />;
  return <main className="grid min-h-screen place-items-center bg-cream-bg p-5"><section className="w-full max-w-lg rounded-3xl border border-sage-border bg-white p-7 shadow-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-terracotta">Akses terbatas</p><h1 className="mt-2 text-2xl font-extrabold text-charcoal">Peran akun belum didukung</h1><p className="mt-3 text-sm leading-6 text-warm-gray">Peran <strong>{session.user.role}</strong> dipertahankan untuk kompatibilitas data, tetapi tidak memiliki akses dashboard. Hubungi administrator untuk penetapan peran yang didukung.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/change-password" className="focus-ring touch-target inline-flex items-center rounded-xl border border-sage-border px-4 py-2.5 text-sm font-bold text-charcoal">Ubah kata sandi</a><button className="focus-ring touch-target rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white" disabled={logout.isPending} onClick={() => logout.mutate()}>{logout.isPending ? 'Keluar...' : 'Keluar'}</button></div></section></main>;
}
export function RoleGuard({ roles }: { roles: UserRole[] }) {
  const session = useSession();
  return session.data?.user && roles.includes(session.data.user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
