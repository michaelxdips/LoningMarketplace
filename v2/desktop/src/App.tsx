import { useRef } from 'react';
import { Route, Routes } from 'react-router';
import { useTheme } from '@v2-shared/lib/useTheme';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import DirectoryPage from './pages/DirectoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import UMKMDetailPage from './pages/UMKMDetailPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Shell V2 desktop.
 *
 * `data-ui="v2"` di sini adalah SAKLAR seluruh design system: semua token dan
 * dark mode di tokens.css di-scope ke atribut ini. Tanpa pembungkus ini,
 * halaman V2 akan mewarisi tampilan UI lama.
 *
 * Route ditulis relatif karena shell ini dipasang di bawah `/v2/*` pada router
 * utama, sehingga tidak ada pengulangan prefiks di tiap definisi route.
 */
export default function V2DesktopApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { preference, cycle } = useTheme(rootRef);

  return (
    <div ref={rootRef} data-ui="v2" className="flex min-h-dvh flex-col bg-canvas text-ink antialiased">
      <a
        href="#v2-main"
        className="focus-ring-v2 sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-brand"
      >
        Lewati ke konten utama
      </a>

      <Navbar preference={preference} onCycleTheme={cycle} />

      <main id="v2-main" tabIndex={-1} className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="produk" element={<CatalogPage />} />
          <Route path="produk/:identifier" element={<ProductDetailPage />} />
          <Route path="umkm" element={<DirectoryPage />} />
          <Route path="umkm/:identifier" element={<UMKMDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
