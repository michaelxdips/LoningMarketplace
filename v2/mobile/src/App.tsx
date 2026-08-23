import { useRef } from 'react';
import { Outlet, Route, Routes } from 'react-router';
import { useTheme } from '@v2-shared/lib/useTheme';
import BottomNav from './layout/BottomNav';
import Header from './layout/Header';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import DirectoryPage from './pages/DirectoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import UMKMDetailPage from './pages/UMKMDetailPage';
import PetaUMKMPage from './pages/PetaUMKMPage';
import FaqPage from './pages/FaqPage';
import AboutVillagePage from './pages/AboutVillagePage';
import AboutTeamPage from './pages/AboutTeamPage';
import VersionHistoryPage from './pages/VersionHistoryPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Shell V2 mobile web — codebase independen dari v2/desktop.
 *
 * Tata letak mobile: header ringkas (tanpa glass), konten, lalu bottom-nav
 * ≤ 5 item dengan safe-area. Tema memakai useTheme dari v2/shared, tetap
 * di-scope data-ui="v2" supaya token light/dark yang sama berlaku.
 *
 * Halaman yang dipakai bersama (dialog WhatsApp, primitif) diimpor dari
 * @v2-shared — bukan dari @v2-desktop — supaya independensi dua codebase terjaga.
 */
export default function V2MobileApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { preference, cycle } = useTheme(rootRef);

  return (
    <div
      ref={rootRef}
      data-ui="v2"
      className="flex min-h-dvh flex-col bg-canvas text-ink antialiased"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Routes>
        {/* Login — tanpa bottom-nav (fokus penuh ke form). */}
        <Route path="login" element={<LoginPage />} />

        {/* Halaman publik — dengan header + bottom-nav. */}
        <Route element={<Shell preference={preference} onCycleTheme={cycle} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="produk" element={<CatalogPage />} />
          <Route path="produk/:identifier" element={<ProductDetailPage />} />
          <Route path="umkm" element={<DirectoryPage />} />
          <Route path="umkm/:identifier" element={<UMKMDetailPage />} />
          <Route path="peta-umkm" element={<PetaUMKMPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="tentang-desa" element={<AboutVillagePage />} />
          <Route path="tentang-kami" element={<AboutTeamPage />} />
          <Route path="version-history" element={<VersionHistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

function Shell({
  preference,
  onCycleTheme,
}: {
  preference: ReturnType<typeof useTheme>['preference'];
  onCycleTheme: () => void;
}) {
  return (
    <>
      <a
        href="#m-main"
        className="focus-ring-v2 sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-brand"
      >
        Lewati ke konten utama
      </a>
      <Header preference={preference} onCycleTheme={onCycleTheme} />
      <main id="m-main" tabIndex={-1} className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
