import { Navigate, Outlet, useLocation } from 'react-router';
import { hasCapability, type Capability } from '../../lib/auth';
import { useSession } from '../../hooks/useAuth';
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
  return <Outlet />;
}
export function PasswordGuard() {
  const session = useSession(); const location = useLocation();
  if (session.data?.user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  if (!session.data?.user.mustChangePassword && hasCapability(session.data.user, 'dashboard:view') && location.pathname === '/change-password') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
export function CapabilityGuard({ capabilities }: { capabilities: readonly Capability[] }) {
  const session = useSession();
  return session.data?.user && capabilities.some((capability) => hasCapability(session.data.user, capability)) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
