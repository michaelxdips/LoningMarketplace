import { Route } from 'react-router';
import { CapabilityGuard, PasswordGuard, ProtectedGuard, PublicOnlyGuard } from './Guards';
import DashboardShell from './DashboardShell';
import DashboardHome from './DashboardHome';
import ChangePasswordPage from './ChangePasswordPage';
import LoginPage from './LoginPage';
import { AuditListPage, ProductListPage, UMKMListPage, UserListPage } from './ManagementLists';
import { ProductFormPage, UMKMFormPage, UserFormPage } from './ManagementForms';
import InquiryAnalyticsPage from './InquiryAnalyticsPage';
import AdminHelpPage from './AdminHelpPage';
import BusinessLocationPage from './BusinessLocationPage';

/**
 * Route dashboard V2 — fragment <Route> yang di-inline ke <Routes> utama App.tsx.
 *
 * PENTING: ini BUKAN komponen React. React Router 7 menolak komponen custom
 * sebagai child langsung <Routes> (error "[X] is not a <Route> component").
 * Karena itu file ini mengekspor FRAGMENT <Route> yang kemudian di-render
 * sebagai `{V2DashboardRoutes}` di dalam <Routes>. Struktur guard identik
 * dengan main.tsx UI lama: PublicOnly (login) -> Protected -> Password ->
 * Capability.
 */
const V2DashboardRoutes = (
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
            <Route path="bantuan" element={<AdminHelpPage />} />

            <Route element={<CapabilityGuard capabilities={['umkms:view-all', 'umkms:view-own']} />}>
              <Route path="umkms" element={<UMKMListPage />} />
              <Route path="umkms/:id" element={<UMKMFormPage />} />
            </Route>
            <Route element={<CapabilityGuard capabilities={['umkms:create']} />}>
              <Route path="umkms/new" element={<UMKMFormPage />} />
            </Route>
            <Route
              element={<CapabilityGuard capabilities={['umkms:manage-location-all', 'umkms:manage-location-own']} />}
            >
              <Route path="umkms/:id/location" element={<BusinessLocationPage />} />
            </Route>

            <Route element={<CapabilityGuard capabilities={['products:view-all', 'products:view-own']} />}>
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:id" element={<ProductFormPage />} />
            </Route>
            <Route element={<CapabilityGuard capabilities={['products:create']} />}>
              <Route path="products/new" element={<ProductFormPage />} />
            </Route>

            <Route element={<CapabilityGuard capabilities={['users:view']} />}>
              <Route path="users" element={<UserListPage />} />
            </Route>
            <Route
              element={
                <CapabilityGuard
                  capabilities={[
                    'users:create-superadmin',
                    'users:create-admin',
                    'users:create-perangkat-desa',
                    'users:create-pelaku-umkm',
                  ]}
                />
              }
            >
              <Route path="users/new" element={<UserFormPage />} />
            </Route>
            <Route element={<CapabilityGuard capabilities={['users:update']} />}>
              <Route path="users/:id" element={<UserFormPage />} />
            </Route>

            <Route element={<CapabilityGuard capabilities={['audit:view-global']} />}>
              <Route path="audit" element={<AuditListPage />} />
            </Route>
            <Route element={<CapabilityGuard capabilities={['analytics:view-global']} />}>
              <Route path="analytics" element={<InquiryAnalyticsPage />} />
            </Route>

            <Route path="*" element={<DashboardHome />} />
          </Route>
        </Route>
      </Route>
    </Route>
  </>
);

export default V2DashboardRoutes;
