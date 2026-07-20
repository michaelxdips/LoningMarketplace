/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list';
  count?: number;
}

export default function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count });

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {skeletons.map((_, idx) => (
          <div key={idx} className="flex gap-4 p-4 bg-cream-card border border-sage-border rounded-xl animate-pulse">
            <div className="w-16 h-16 bg-sage-light rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-sage-light rounded w-1/3" />
              <div className="h-3 bg-sage-light rounded w-1/2" />
              <div className="h-3 bg-sage-light rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletons.map((_, idx) => (
        <div key={idx} className="bg-cream-card border border-sage-border rounded-xl overflow-hidden animate-pulse flex flex-col h-[340px]">
          <div className="h-48 bg-sage-light w-full" />
          <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-3 bg-sage-light rounded w-1/4" />
              <div className="h-4 bg-sage-light rounded w-3/4" />
              <div className="h-3 bg-sage-light rounded w-5/6" />
            </div>
            <div className="h-8 bg-sage-light rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
