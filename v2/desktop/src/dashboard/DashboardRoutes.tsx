import { Route } from 'react-router';
import { CapabilityGuard, PasswordGuard, ProtectedGuard, PublicOnlyGuard } from './Guards';
import DashboardShell from './DashboardShell';
import DashboardHome from './DashboardHome';
import ChangePasswordPage from './ChangePasswordPage';
import LoginPage from './LoginPage';

/**
 * Route dashboard V2 — di-inline ke <Routes> utama App.tsx (bukan <Routes> sendiri)
 * supaya path relatif ke prefiks /v2 tetap satu tingkat.
 *
 * Struktur guard identik dengan main.tsx UI lama:
 * PublicOnly (login) -> Protected -> Password -> Capability.
 * Sub-route manajemen ditambahkan bertahap di Phase 3b/3c.
 */
export default function V2DashboardRoutes() {
  return (
    <>
      <Route element={<PublicOnlyGuard />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedGuard />}>
        <Route element={<PasswordGuard />}>
          <Route path="dashboard/change-password" element={<ChangePasswordPage />} />

          <Route element={<CapabilityGuard capabilities={['dashboard:view']} />}>
            <Route path="dashboard" element={<DashboardShell />}>
              <Route index element={<DashboardHome />} />
              <Route path="*" element={<DashboardHome />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </>
  );
}
