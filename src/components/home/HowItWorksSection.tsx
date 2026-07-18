/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, PhoneCall, CheckSquare } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Telusuri Produk & UMKM',
      description: 'Pilih kategori bidang usaha atau ketik nama produk lokal Desa Loning yang Anda butuhkan melalui kolom pencarian.',
      icon: <Search className="text-forest" size={20} />
    },
    {
      step: '02',
      title: 'Kunjungi Detail Informasi',
      description: 'Baca deskripsi produk, profil operasional usaha, alamat tinggal, serta katalog penawaran lengkap secara mendalam.',
      icon: <CheckSquare className="text-forest" size={20} />
    },
    {
      step: '03',
      title: 'Tanya Langsung via WhatsApp',
      description: 'Klik tombol tanya produk atau hubungi UMKM untuk meluncurkan chat WhatsApp resmi yang terisi teks pesan otomatis.',
      icon: <PhoneCall className="text-forest" size={20} />
    }
  ];

  return (
    <section className="py-16 bg-cream-bg border-b border-sage-border px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
            Panduan Sederhana
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-charcoal tracking-tight">
            Bagaimana Cara Menghubungi UMKM?
          </h2>
          <p className="text-xs text-warm-gray mt-1.5 leading-relaxed">
            Tidak ada transaksi di dalam website. Semua pesanan diteruskan langsung ke kontak pribadi pelaku usaha demi komunikasi yang akrab dan amanah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="relative p-5 bg-cream-card border border-sage-border rounded-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-sage-light/60 text-forest rounded-lg">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs font-bold text-terracotta/40 uppercase tracking-widest">
                    Langkah {step.step}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-charcoal mb-1.5">
                  {step.title}
                </h4>
                <p className="text-xs text-warm-gray leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
