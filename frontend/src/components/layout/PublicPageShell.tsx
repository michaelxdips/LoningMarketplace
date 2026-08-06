import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="editorial-page flex min-h-dvh flex-col antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-forest focus:px-4 focus:py-2.5 focus:text-xs focus:font-bold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Lewati ke konten utama
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
