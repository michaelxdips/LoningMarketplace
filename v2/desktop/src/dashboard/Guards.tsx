import { Navigate, Outlet, useLocation } from 'react-router';
import { hasCapability, type Capability } from '@loning/shared/lib/auth';
import { useSession } from '@loning/shared/hooks/useAuth';
import { LoadingPanel } from './Ui';

/**
 * Guard V2 — pasangan fitur dari frontend/src/components/dashboard/Guards.tsx.
 *
 * Logika routing identik; hanya styling SessionError yang memakai token V2.
 * Route V2 dashboard dipasang di bawah prefiks /v2/dashboard di router utama,
 * jadi redirect tetap menunjuk path V2 (/v2/login, /v2/dashboard, ...).
 */

function SessionError({ retry }: { retry: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <div className="w-full max-w-md border border-line bg-surface p-6 text-center">
        <h1 className="font-display text-lg font-semibold tracking-tight text-ink">
          Tidak dapat terhubung ke layanan
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">Periksa koneksi backend, lalu coba lagi.</p>
        <button
          className="focus-ring-v2 mt-5 min-h-11 rounded-control bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
          onClick={retry}
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}

export function PublicOnlyGuard() {
  const session = useSession();
  if (session.isPending) return <main className="grid min-h-dvh place-items-center"><LoadingPanel /></main>;
  if (session.isError) return <SessionError retry={() => void session.refetch()} />;
  if (session.data?.user) {
    return <Navigate to={session.data.user.mustChangePassword ? '/v2/dashboard/change-password' : '/v2/dashboard'} replace />;
  }
  return <Outlet />;
}

export function ProtectedGuard() {
  const session = useSession();
  const location = useLocation();
  if (session.isPending) return <main className="grid min-h-dvh place-items-center"><LoadingPanel /></main>;
  if (session.isError) return <SessionError retry={() => void session.refetch()} />;
  if (!session.data?.user) return <Navigate to="/v2/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

export function PasswordGuard() {
  const session = useSession();
  const location = useLocation();
  if (session.data?.user?.mustChangePassword && location.pathname !== '/v2/dashboard/change-password') {
    return <Navigate to="/v2/dashboard/change-password" replace />;
  }
  return <Outlet />;
}

export function CapabilityGuard({ capabilities }: { capabilities: readonly Capability[] }) {
  const session = useSession();
  const user = session.data?.user;
  return user && capabilities.some((capability) => hasCapability(user, capability)) ? (
    <Outlet />
  ) : (
    <Navigate to="/v2/dashboard" replace />
  );
}
