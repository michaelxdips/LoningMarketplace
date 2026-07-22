/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, Sparkles, BookOpen, Heart } from 'lucide-react';
import { BENEFIT_CARDS } from '../../data';

export default function AboutVillageSection() {
  return (
    <section 
      id="about" 
      className="py-16 bg-cream-card border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Narrative Image Column */}
          <div className="lg:col-span-5 relative space-y-4">
            <div className="h-64 overflow-hidden rounded-2xl border border-sage-border shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80"
                alt="Pemandangan Lahan Tani Desa"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Embedded Quote Box */}
            <div className="p-4 bg-cream-bg border border-sage-border rounded-xl">
              <p className="editorial-serif italic text-xs text-forest leading-relaxed">
                "Membangun kemandirian ekonomi desa dimulai dari mengenali dan melestarikan hasil karya warga sendiri."
              </p>
              <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest mt-1.5">
                — Perangkat Desa Loning
              </p>
            </div>
          </div>

          {/* Descriptive Content Column */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block">
              Pemberdayaan Lokal
            </span>
            
            <h2 className="text-2xl font-extrabold text-charcoal tracking-tight leading-tight">
              Mengenal Sekilas <br />
              <span className="editorial-serif font-normal italic text-forest">Geliat Usaha Desa Loning</span>
            </h2>
            
            <p className="text-xs text-warm-gray leading-relaxed">
              Desa Loning yang bertempat di Kecamatan Petarukan, Pemalang, Jawa Tengah, memiliki keragaman potensi alam dan keterampilan kreatif. Mulai dari kebun pertanian kopi lereng, olahan kuliner rumahan, hingga keahlian anyaman bambu turun-temurun.
            </p>
            <p className="text-xs text-warm-gray leading-relaxed">
              Platform Loning Maju dikembangkan sebagai wujud nyata gotong-royong untuk mempublikasikan etalase niaga lokal secara gratis, mandiri, dan berdaulat. Membantu memudahkan warga luar maupun sesama warga dalam menemukan produsen terdekat secara cepat.
            </p>

            {/* Benefit Grid - replacing unverified numerical statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sage-border/60">
              {BENEFIT_CARDS.map((benefit, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="p-2 bg-forest/5 text-forest rounded-lg h-fit shrink-0 mt-0.5">
                    {idx === 0 && <Compass size={14} className="text-terracotta" />}
                    {idx === 1 && <Sparkles size={14} />}
                    {idx === 2 && <BookOpen size={14} />}
                    {idx === 3 && <Heart size={14} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">
                      {benefit.title}
                    </h4>
                    <p className="text-[11px] text-warm-gray/90 leading-relaxed mt-0.5">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
