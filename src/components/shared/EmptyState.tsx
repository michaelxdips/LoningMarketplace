/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Archive } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-sage-border rounded-xl bg-white/40">
      <div className="p-3 bg-sage-light text-warm-gray rounded-full mb-3.5">
        <Archive size={24} />
      </div>
      <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
      <p className="text-xs text-warm-gray max-w-xs mt-1 leading-relaxed">{description}</p>
    </div>
  );
}
