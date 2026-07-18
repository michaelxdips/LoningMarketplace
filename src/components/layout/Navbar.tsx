/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Compass } from 'lucide-react';

interface NavbarProps {
  onScrollToSection: (sectionId: string) => void;
  activeSection: string;
}

export default function Navbar({ onScrollToSection, activeSection }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Beranda', id: 'home' },
    { label: 'Kategori', id: 'categories' },
    { label: 'Produk Unggulan', id: 'featured-products' },
    { label: 'Profil UMKM', id: 'umkm' },
    { label: 'Tentang Desa', id: 'about' },
    { label: 'FAQ', id: 'faq' }
  ];

  const handleNavItemClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    onScrollToSection(sectionId);
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-cream-card/95 backdrop-blur-md border-b border-sage-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo Wordmark */}
          <button 
            onClick={() => onScrollToSection('home')}
            className="flex items-center gap-2 text-forest hover:opacity-90 focus-ring rounded-lg py-1 px-1.5 font-bold tracking-tight text-lg"
          >
            <Compass size={22} className="text-terracotta" />
            <span className="font-sans font-extrabold uppercase tracking-wide text-sm md:text-base">
              Loning<span className="text-terracotta">Digital</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-forest focus-ring rounded px-2 py-1 ${
                  activeSection === item.id ? 'text-forest font-bold' : 'text-warm-gray'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Primary CTA */}
            <button
              onClick={() => handleNavItemClick('featured-products')}
              className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors focus-ring shadow-xs"
            >
              Jelajahi Produk
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label="Toggle navigasi"
              className="p-1.5 rounded-lg text-warm-gray hover:bg-sage-light hover:text-charcoal transition-colors focus-ring touch-target"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-nav-menu"
          className="md:hidden bg-cream-card border-b border-sage-border transition-all duration-300 ease-in-out px-4 pt-2 pb-6 space-y-2.5 shadow-lg"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className={`block w-full text-left py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-sage-light ${
                activeSection === item.id ? 'text-forest bg-sage-light/60 font-bold' : 'text-warm-gray'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={() => handleNavItemClick('featured-products')}
              className="w-full text-center py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm focus-ring"
            >
              Jelajahi Produk
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
