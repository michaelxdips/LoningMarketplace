/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, Compass } from 'lucide-react';
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
  { label: 'FAQ', href: '/faq' }
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

  return <nav aria-label="Navigasi utama" className="sticky top-0 z-30 w-full border-b border-sage-border bg-cream-card/95 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link to="/" aria-label={`${brand.name} — kembali ke beranda`} className="focus-ring flex items-center gap-2 rounded-lg px-1.5 py-1 text-forest">
        <Compass size={22} className="text-terracotta"/><span className="text-sm font-extrabold uppercase tracking-wide md:text-base">Loning<span className="text-terracotta">Maju</span></span>
      </Link>
      <div className="hidden items-center gap-5 md:flex">{navItems.map((item) => {
        const active = item.href.startsWith('/#') ? location.pathname === '/' && activeSection === item.href.split('#')[1] : location.pathname === item.href;
        return item.href.startsWith('/#') ? <a key={item.href} href={item.href} onClick={(event) => goHomeSection(event, item.href)} className={`focus-ring rounded px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-forest ${active ? 'text-forest' : 'text-warm-gray'}`}>{item.label}</a> : <Link key={item.href} to={item.href} className={`focus-ring rounded px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-forest ${active ? 'text-forest' : 'text-warm-gray'}`}>{item.label}</Link>;
      })}<Link to="/login" className="focus-ring rounded-lg border border-terracotta px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-terracotta transition-colors hover:bg-terracotta hover:text-white">Masuk Pengelola</Link><a href="/#featured-products" onClick={(event) => goHomeSection(event, '/#featured-products')} className="focus-ring rounded-lg bg-forest px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-forest-hover">Jelajahi Produk</a></div>
      <button id="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-expanded={isMobileMenuOpen} aria-controls="mobile-nav-menu" aria-label="Buka atau tutup navigasi" className="focus-ring touch-target rounded-lg p-2 text-warm-gray md:hidden">{isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
    </div>
    {isMobileMenuOpen && <div id="mobile-nav-menu" className="border-t border-sage-border bg-cream-card px-4 py-4 shadow-lg md:hidden">{navItems.map((item) => item.href.startsWith('/#') ? <a key={item.href} href={item.href} onClick={(event) => goHomeSection(event, item.href)} className="focus-ring touch-target flex items-center rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-warm-gray hover:bg-sage-light">{item.label}</a> : <Link key={item.href} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="focus-ring touch-target flex items-center rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-warm-gray hover:bg-sage-light">{item.label}</Link>)}<div className="mt-3 grid gap-2 border-t border-sage-border pt-3"><Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="focus-ring touch-target flex items-center justify-center rounded-lg border border-terracotta text-xs font-bold uppercase tracking-wider text-terracotta">Masuk Pengelola</Link><a href="/#featured-products" onClick={(event) => goHomeSection(event, '/#featured-products')} className="focus-ring touch-target flex items-center justify-center rounded-lg bg-forest text-xs font-bold uppercase tracking-wider text-white">Jelajahi Produk</a></div></div>}
  </nav>;
}
