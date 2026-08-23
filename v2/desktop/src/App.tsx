import { useRef } from 'react';
import { Outlet, Route, Routes } from 'react-router';
import { useTheme } from '@v2-shared/lib/useTheme';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import DirectoryPage from './pages/DirectoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import UMKMDetailPage from './pages/UMKMDetailPage';
import PetaUMKMPage from './pages/PetaUMKMPage';
import FaqPage from './pages/FaqPage';
import AboutVillagePage from './pages/AboutVillagePage';
import AboutTeamPage from './pages/AboutTeamPage';
import NotFoundPage from './pages/NotFoundPage';
import V2DashboardRoutes from './dashboard/DashboardRoutes';

/**
 * Shell V2 desktop.
 *
 * `data-ui="v2"` di sini adalah SAKLAR seluruh design system: semua token dan
 * dark mode di tokens.css di-scope ke atribut ini. Tanpa pembungkus ini,
 * halaman V2 akan mewarisi tampilan UI lama.
 *
 * Route ditulis relatif karena shell ini dipasang di bawah `/v2/*` pada router
 * utama, sehingga tidak ada pengulangan prefiks di tiap definisi route.
 *
 * Dua layout berbeda:
 *   - Publik: Navbar + <main> + Footer.
 *   - Dashboard & login: TANPA chrome publik (sidebar sendiri, full-screen).
 */
export default function V2DesktopApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { preference, cycle } = useTheme(rootRef);

  return (
    <div ref={rootRef} data-ui="v2" className="flex min-h-dvh flex-col bg-canvas text-ink antialiased">
      <Routes>
        {/* Dashboard & login — layout mandiri, tanpa navbar/footer publik. */}
        <V2DashboardRoutes />

        {/* Publik — dibungkus chrome editorial. */}
        <Route element={<PublicLayout preference={preference} onCycleTheme={cycle} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="produk" element={<CatalogPage />} />
          <Route path="produk/:identifier" element={<ProductDetailPage />} />
          <Route path="umkm" element={<DirectoryPage />} />
          <Route path="umkm/:identifier" element={<UMKMDetailPage />} />
          <Route path="peta-umkm" element={<PetaUMKMPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="tentang-desa" element={<AboutVillagePage />} />
          <Route path="tentang-kami" element={<AboutTeamPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

function PublicLayout({
  preference,
  onCycleTheme,
}: {
  preference: ReturnType<typeof useTheme>['preference'];
  onCycleTheme: () => void;
}) {
  return (
    <>
      <a
        href="#v2-main"
        className="focus-ring-v2 sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-brand"
      >
        Lewati ke konten utama
      </a>
      <Navbar preference={preference} onCycleTheme={onCycleTheme} />
      <main id="v2-main" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
