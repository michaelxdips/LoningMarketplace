/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router';
import { Compass, HelpCircle } from 'lucide-react';
import { brand } from '../../config/brand';

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
}

export default function Footer({ onScrollToSection }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-cream-tint pt-12 pb-8 border-t border-sage-border/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          
          {/* Column 1: Branding and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Compass size={22} className="text-terracotta" />
              <span className="font-sans font-extrabold uppercase tracking-wide text-base" aria-label={brand.name}>
                Loning<span className="text-terracotta">Maju</span>
              </span>
            </div>
            <p className="text-xs text-cream-tint/70 leading-relaxed max-w-sm">
              Direktori resmi dan etalase produk digital Desa Loning, Kecamatan Petarukan, Kabupaten Pemalang, Jawa Tengah. Disediakan secara gratis untuk mendukung kedaulatan ekonomi masyarakat desa.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-semibold text-white uppercase tracking-widest">Peta Situs</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => onScrollToSection('home')} 
                className="text-left text-cream-tint/70 hover:text-white transition-colors"
              >
                Beranda
              </button>
              <button 
                onClick={() => onScrollToSection('categories')} 
                className="text-left text-cream-tint/70 hover:text-white transition-colors"
              >
                Kategori
              </button>
              <button 
                onClick={() => onScrollToSection('featured-products')} 
                className="text-left text-cream-tint/70 hover:text-white transition-colors"
              >
                Produk
              </button>
              <button 
                onClick={() => onScrollToSection('umkm')} 
                className="text-left text-cream-tint/70 hover:text-white transition-colors"
              >
                Profil UMKM
              </button>
              <button 
                onClick={() => onScrollToSection('about')} 
                className="text-left text-cream-tint/70 hover:text-white transition-colors"
              >
                Tentang Desa
              </button>
              <button 
                onClick={() => onScrollToSection('faq')} 
                className="text-left text-cream-tint/70 hover:text-white transition-colors"
              >
                FAQ
              </button>
            </div>
            <div className="border-t border-white/10 pt-3">
              <h6 className="text-[10px] font-semibold text-white uppercase tracking-widest">Akses Pengelola</h6>
              <Link
                to="/login"
                className="focus-ring mt-2 inline-flex rounded px-1 py-1 text-xs text-cream-tint/70 transition-colors hover:text-white"
              >
                Masuk Dashboard
              </Link>
            </div>
          </div>

          {/* Column 3: Disclaimer & Notice */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-semibold text-white uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle size={12} className="text-terracotta" />
              <span>Pemberitahuan Transaksi</span>
            </h5>
            <p className="text-[11px] text-cream-tint/60 leading-relaxed">
              Seluruh transaksi, negoisasi harga, pengiriman, dan pembayaran dilakukan secara langsung antara pembeli dan pelaku usaha bersangkutan lewat aplikasi WhatsApp. Pengelola platform tidak bertanggung jawab atas segala bentuk kesepakatan transaksi mandiri tersebut.
            </p>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-cream-tint/40">
          <div>
            &copy; {currentYear} {brand.name}. Seluruh Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="flex gap-4">
            <span className="font-medium">Dikembangkan untuk Desa Loning Mandiri</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
