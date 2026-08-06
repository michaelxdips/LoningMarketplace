/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, LogIn } from 'lucide-react';
import { brand } from '../../config/brand';

interface NavbarProps {
  onScrollToSection?: (sectionId: string) => void;
  activeSection?: string;
}

const navItems = [
  { label: 'Produk', href: '/#featured-products' },
  { label: 'Profil UMKM', href: '/#umkm' },
  { label: 'Peta UMKM', href: '/peta-umkm' },
  { label: 'Tentang Desa', href: '/tentang-desa' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Masuk Pengelola', href: '/login' },
] as const;

export default function Navbar({ onScrollToSection, activeSection }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const goHomeSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/' && onScrollToSection && href.includes('#')) {
      event.preventDefault();
      onScrollToSection(href.split('#')[1]);
    }
  };

  const handleLogoClick = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 z-30 w-full border-b border-sage-border bg-cream-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={handleLogoClick}
          aria-label={`${brand.name} — kembali ke beranda`}
          className="focus-ring flex min-w-0 items-center gap-3 rounded-lg px-1.5 py-1 text-forest transition-opacity hover:opacity-90"
        >
          <img src={brand.logoSvg} alt="" className="h-9 w-9 object-contain shrink-0" />
          <span className="truncate text-base font-black uppercase tracking-wider md:text-lg">
            LONING<span className="text-terracotta">MAJU</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => {
            const active = item.href.startsWith('/#')
              ? location.pathname === '/' && activeSection === item.href.split('#')[1]
              : location.pathname === item.href;

            return item.href.startsWith('/#') ? (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => goHomeSection(event, item.href)}
                className={`focus-ring rounded-lg px-2.5 py-2 text-[13px] font-bold uppercase tracking-wider transition-colors hover:bg-sage-light/60 hover:text-forest ${
                  active ? 'text-forest' : 'text-warm-gray'
                }`}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                className={item.href === '/login'
                  ? 'focus-ring ml-1 inline-flex min-h-10 items-center gap-2 rounded-lg bg-forest px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-forest-hover'
                  : `focus-ring rounded-lg px-2.5 py-2 text-[13px] font-bold uppercase tracking-wider transition-colors hover:bg-sage-light/60 hover:text-forest ${active ? 'text-forest' : 'text-warm-gray'}`
                }
              >
                {item.href === '/login' && <LogIn size={15} aria-hidden="true" />}
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          id="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label="Buka atau tutup navigasi"
          className="focus-ring touch-target rounded-lg p-2 text-warm-gray md:hidden"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Navigasi seluler"
          className="border-t border-sage-border bg-cream-card px-4 py-4 shadow-lg md:hidden"
        >
          {navItems.map((item) =>
            item.href.startsWith('/#') ? (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => goHomeSection(event, item.href)}
                className="focus-ring touch-target flex items-center rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-warm-gray hover:bg-sage-light"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={item.href === '/login'
                  ? 'focus-ring touch-target mt-3 flex items-center justify-center gap-2 rounded-lg border-t border-sage-border bg-forest px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-forest-hover'
                  : 'focus-ring touch-target flex items-center rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-warm-gray hover:bg-sage-light'
                }
              >
                {item.href === '/login' && <LogIn size={16} aria-hidden="true" />}
                {item.label}
              </Link>
            )
          )}
        </nav>
      )}
    </nav>
  );
}
