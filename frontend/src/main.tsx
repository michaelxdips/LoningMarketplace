import { lazy, StrictMode, Suspense, useLayoutEffect, useRef } from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router';
import App from './App.tsx';
import { PasswordGuard, ProtectedGuard, PublicOnlyGuard, RoleGuard, UnsupportedRolePage } from './components/dashboard/Guards.tsx';
import { LoadingPanel } from './components/dashboard/Ui.tsx';
import { Component, type ErrorInfo, type ReactNode } from 'react';
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage.tsx'));
const DashboardShell = lazy(() => import('./components/dashboard/DashboardShell.tsx'));
const DashboardHome = lazy(() => import('./pages/DashboardHome.tsx'));
const UMKMListPage = lazy(() => import('./pages/ManagementLists.tsx').then(module => ({ default: module.UMKMListPage })));
const ProductListPage = lazy(() => import('./pages/ManagementLists.tsx').then(module => ({ default: module.ProductListPage })));
const UserListPage = lazy(() => import('./pages/ManagementLists.tsx').then(module => ({ default: module.UserListPage })));
const AuditListPage = lazy(() => import('./pages/ManagementLists.tsx').then(module => ({ default: module.AuditListPage })));
const InquiryAnalyticsPage = lazy(() => import('./pages/InquiryAnalyticsPage.tsx'));
const FaqPage = lazy(() => import('./pages/FaqPage.tsx'));
const AboutVillagePage = lazy(() => import('./pages/AboutVillagePage.tsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.tsx'));
const UMKMDetailPage = lazy(() => import('./pages/UMKMDetailPage.tsx'));
const PetaUMKMPage = lazy(() => import('./pages/PetaUMKMPage.tsx'));
const BusinessLocationPage = lazy(() => import('./pages/BusinessLocationPage.tsx'));
const UMKMFormPage = lazy(() => import('./pages/ManagementForms.tsx').then(module => ({ default: module.UMKMFormPage })));
const ProductFormPage = lazy(() => import('./pages/ManagementForms.tsx').then(module => ({ default: module.ProductFormPage })));
const UserFormPage = lazy(() => import('./pages/ManagementForms.tsx').then(module => ({ default: module.UserFormPage })));
class LazyRouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  declare readonly props: { children: ReactNode };
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Keep route chunk failures recoverable. */ }
  render() { return this.state.failed ? <main className="grid min-h-screen place-items-center p-6"><div className="text-center"><h1 className="text-xl font-extrabold">Halaman tidak dapat dimuat</h1><button className="mt-4 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white" onClick={() => window.location.reload()}>Muat ulang</button></div></main> : this.props.children; }
}
import NotFoundPage from './pages/NotFoundPage.tsx';
import { setUnauthorizedHandler, shouldRetryApiRequest } from './lib/api.ts';
import { shouldFocusMain } from './lib/navigation-focus.ts';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: shouldRetryApiRequest } } });
setUnauthorizedHandler(() => {
  void queryClient.cancelQueries({ queryKey: ['auth'] });
  queryClient.removeQueries({ queryKey: ['manage'] }); queryClient.removeQueries({ queryKey: ['admin'] });
  queryClient.setQueryData(['auth', 'session'], null); queryClient.setQueryData(['auth', 'csrf'], null);
});

function PublicNavigationManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathnameRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = location.pathname;

    if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' });
      return;
    }

    if (!shouldFocusMain(previousPathname, location.pathname, location.hash)) return;

    // Initial/direct loads and pathname transitions focus the main landmark. POP keeps native scroll
    // restoration; PUSH/REPLACE pathname transitions reset scroll before transferring focus.
    if (navigationType !== 'POP') {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      root.style.scrollBehavior = previousScrollBehavior;
    }

    const main = document.querySelector<HTMLElement>('main');
    if (!main) return;
    main.tabIndex = -1;
    main.focus({ preventScroll: true });
  }, [location.key, location.pathname, location.hash, navigationType]);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter><LazyRouteBoundary><Suspense fallback={<main className="grid min-h-screen place-items-center"><LoadingPanel /></main>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/tentang-desa" element={<AboutVillagePage />} />
          <Route path="/peta-umkm" element={<PetaUMKMPage />} />
          <Route path="/produk/:identifier" element={<ProductDetailPage />} />
          <Route path="/umkm/:identifier" element={<UMKMDetailPage />} />
          <Route element={<PublicOnlyGuard />}><Route path="/login" element={<LoginPage />} /></Route>
          <Route element={<ProtectedGuard />}>
            <Route path="/unsupported-role" element={<UnsupportedRolePage />} />
            <Route element={<PasswordGuard />}>
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/dashboard" element={<DashboardShell />}>
                <Route index element={<DashboardHome />} />
                <Route path="umkms" element={<UMKMListPage />} />
                <Route path="umkms/:id" element={<UMKMFormPage />} />
                <Route path="umkms/:id/location" element={<BusinessLocationPage />} />
                <Route path="location" element={<Navigate to="/dashboard/umkms" replace />} />
                <Route path="products" element={<ProductListPage />} />
                <Route path="products/new" element={<ProductFormPage />} />
                <Route path="products/:id" element={<ProductFormPage />} />
                <Route element={<RoleGuard roles={['admin']} />}>
                   <Route path="umkms/new" element={<UMKMFormPage />} />
                   <Route path="users" element={<UserListPage />} />
                   <Route path="users/new" element={<UserFormPage />} />
                   <Route path="users/:id" element={<UserFormPage />} />
                   <Route path="audit" element={<AuditListPage />} />
                   <Route path="analytics" element={<InquiryAnalyticsPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <PublicNavigationManager />
      </Suspense></LazyRouteBoundary></BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
