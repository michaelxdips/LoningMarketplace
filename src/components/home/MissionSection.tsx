/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, Compass, ShieldCheck } from 'lucide-react';

export default function MissionSection() {
  return (
    <section className="py-14 bg-forest text-white px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      {/* Decorative vector shape overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="10" x2="100" y2="90" stroke="currentColor" strokeWidth="0.5" />
          <line x1="100" y1="10" x2="0" y2="90" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="inline-flex p-2.5 bg-white/10 rounded-full text-terracotta">
          <Heart size={18} fill="currentColor" />
        </div>
        
        <h2 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight">
          Satu Klik untuk Menghubungkan Usaha Desa,<br />
          <span className="editorial-serif font-normal italic text-white/90">Menggerakkan Perekonomian Berdikari</span>
        </h2>
        
        <p className="text-xs md:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
          Setiap pesan pertanyaan yang Anda kirimkan kepada pelaku usaha di Desa Loning merupakan dukungan nyata bagi keberlangsungan penghidupan keluarga dan pengrajin lokal. Kami percaya kekuatan ekonomi sejati lahir dari rasa saling percaya dan kemudahan akses tanpa sekat perantara.
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-6 text-[11px] font-semibold text-white/90 tracking-wider uppercase">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <Compass size={13} className="text-terracotta" />
            <span>100% Milik Pelaku Usaha</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <ShieldCheck size={13} className="text-terracotta" />
            <span>Komunikasi Aman via WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  );
}
