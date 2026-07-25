/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router';
import { Compass, HelpCircle } from 'lucide-react';
import { brand } from '../../config/brand';

export default function Footer() {
  return <footer className="border-t border-white/10 bg-charcoal pb-8 pt-12 text-cream-tint"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.25fr_.75fr_1fr]">
      <div><Link to="/" className="focus-ring flex w-fit items-center gap-2 rounded text-white"><Compass size={22} className="text-terracotta"/><span className="text-base font-extrabold uppercase tracking-wide" aria-label={brand.name}>Loning<span className="text-terracotta">Maju</span></span></Link><p className="mt-4 max-w-sm text-xs leading-6 text-cream-tint/65">Direktori dan etalase produk digital Desa Loning, Kecamatan Petarukan, Kabupaten Pemalang. Membantu karya warga lebih mudah ditemukan.</p></div>
      <div><h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Peta Situs</h2><nav aria-label="Peta situs" className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs"><a href="/#featured-products" className="focus-ring rounded text-cream-tint/65 hover:text-white">Produk</a><a href="/#umkm" className="focus-ring rounded text-cream-tint/65 hover:text-white">Profil UMKM</a><Link to="/tentang-desa" className="focus-ring rounded text-cream-tint/65 hover:text-white">Tentang Desa</Link><Link to="/faq" className="focus-ring rounded text-cream-tint/65 hover:text-white">FAQ</Link><Link to="/login" className="focus-ring rounded text-cream-tint/65 hover:text-white">Pengelola</Link></nav></div>
      <div><h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white"><HelpCircle size={12} className="text-terracotta"/>Pemberitahuan Transaksi</h2><p className="mt-4 text-[11px] leading-6 text-cream-tint/55">Seluruh transaksi, negosiasi harga, pengiriman, dan pembayaran dilakukan langsung antara pengunjung dan pelaku usaha melalui WhatsApp. Loning Maju tidak memproses transaksi.</p></div>
    </div>
    <div className="flex flex-col gap-3 pt-6 text-[11px] text-cream-tint/35 sm:flex-row sm:items-center sm:justify-between"><span>&copy; {new Date().getFullYear()} {brand.name}.</span><span>Dirawat untuk Desa Loning</span></div>
  </div></footer>;
}
