/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQS } from '../../data';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const handleToggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section 
      id="faq" 
      className="py-16 bg-cream-bg border-b border-sage-border px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest block mb-1">
            Tanya Jawab Umum
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-charcoal tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs text-warm-gray mt-1 leading-relaxed">
            Temukan penjelasan singkat mengenai cara kerja katalog direktori niaga Desa Loning.
          </p>
        </div>

        {/* Accessible Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="bg-cream-card border border-sage-border rounded-xl overflow-hidden transition-all duration-250"
              >
                {/* Accordion Trigger Button */}
                <button
                  id={`faq-trigger-${idx}`}
                  onClick={() => handleToggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-sage-light/20 transition-colors focus-ring"
                >
                  <span className="text-xs md:text-sm font-bold text-charcoal flex items-center gap-2">
                    <HelpCircle size={15} className="text-terracotta shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-warm-gray transition-transform duration-250 shrink-0 ${isOpen ? 'rotate-180 text-forest' : ''}`} 
                  />
                </button>

                {/* Accordion Content Panel */}
                <div
                  id={`faq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${idx}`}
                  hidden={!isOpen}
                  className={`transition-all duration-300 ease-in-out border-t border-sage-border/40 ${
                    isOpen ? 'max-h-60 p-4 opacity-100 bg-cream-tint/30' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <p className="text-xs text-warm-gray leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
