/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'umkm';
  count?: number;
}

export function ProductCardSkeleton({ count = 3 }: { count?: number }) {
  const skeletons = Array.from({ length: count });
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((_, idx) => (
        <div key={idx} className="flex flex-col overflow-hidden rounded-2xl border border-sage-border bg-cream-card animate-pulse motion-reduce:animate-none">
          <div className="h-52 w-full bg-sage-light" />
          <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
            <div className="space-y-2.5">
              <div className="h-2.5 w-1/4 rounded bg-sage-light" />
              <div className="h-5 w-3/4 rounded bg-sage-light" />
              <div className="h-3 w-1/2 rounded bg-sage-light" />
            </div>
            <div className="h-9 w-full rounded-lg bg-sage-light" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UMKMCardSkeleton({ count = 3 }: { count?: number }) {
  const skeletons = Array.from({ length: count });
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((_, idx) => (
        <div key={idx} className="flex flex-col overflow-hidden rounded-2xl border border-sage-border bg-cream-card animate-pulse motion-reduce:animate-none">
          <div className="h-52 w-full bg-sage-light" />
          <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
            <div className="space-y-2.5">
              <div className="h-2.5 w-1/3 rounded bg-sage-light" />
              <div className="h-5 w-2/3 rounded bg-sage-light" />
              <div className="h-3 w-4/5 rounded bg-sage-light" />
            </div>
            <div className="h-9 w-full rounded-lg bg-sage-light" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  if (type === 'umkm') return <UMKMCardSkeleton count={count} />;
  return <ProductCardSkeleton count={count} />;
}
