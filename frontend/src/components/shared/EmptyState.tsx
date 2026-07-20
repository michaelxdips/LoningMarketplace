/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Archive } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-sage-border rounded-xl bg-white/40">
      <div className="p-3 bg-sage-light text-warm-gray rounded-full mb-3.5">
        <Archive size={24} />
      </div>
      <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
      <p className="text-xs text-warm-gray max-w-xs mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction && <button onClick={onAction} className="mt-4 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-lg focus-ring">{actionLabel}</button>}
    </div>
  );
}
