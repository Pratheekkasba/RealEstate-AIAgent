import React from 'react';

/**
 * SkeletonCard — shimmer placeholder for loading states.
 *
 * Props:
 *   rows      {number}   Number of text rows to render (default 3)
 *   height    {string}   Tailwind height class for a single-block skeleton (e.g. "h-32")
 *   className {string}   Extra classes on wrapper
 *   variant   {string}   "block" | "rows" | "stat" | "card"
 */
export function SkeletonCard({ rows = 3, height = 'h-6', className = '', variant = 'rows' }) {
  if (variant === 'block') {
    return (
      <div className={`skeleton rounded-2xl ${height} ${className}`} aria-hidden="true" />
    );
  }

  if (variant === 'stat') {
    return (
      <div className={`p-4 bg-white rounded-2xl border border-slate-200/70 flex flex-col gap-3 ${className}`} aria-hidden="true">
        <div className="flex items-center justify-between">
          <div className="skeleton w-8 h-8 rounded-xl" />
          <div className="skeleton w-14 h-5 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <div className="skeleton w-12 h-7 rounded-lg" />
          <div className="skeleton w-20 h-3 rounded-md" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white border border-slate-200/70 rounded-3xl p-5 space-y-3 ${className}`} aria-hidden="true">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton w-1/3 h-3 rounded-md" />
            <div className="skeleton w-2/3 h-5 rounded-lg" />
          </div>
          <div className="skeleton w-16 h-5 rounded-full" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`skeleton h-3 rounded-md ${i === rows - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <div className="skeleton w-16 h-6 rounded-xl" />
          <div className="skeleton w-20 h-6 rounded-xl" />
        </div>
      </div>
    );
  }

  // Default: rows
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 rounded-lg ${
            i === rows - 1 ? 'w-3/4' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * PageSkeleton — structured skeleton that mirrors TodayBrief's actual layout.
 * Used at the top-level when briefData hasn't loaded.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse-slow" aria-label="Loading…" role="status">
      {/* Hero */}
      <div className="skeleton rounded-3xl h-44" />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section label */}
          <div className="space-y-4">
            <div className="skeleton w-48 h-3 rounded-md" />
            <div className="bg-white border border-slate-200/70 rounded-3xl p-7 space-y-4">
              <div className="skeleton w-24 h-5 rounded-full" />
              <div className="skeleton w-2/3 h-6 rounded-lg" />
              <SkeletonCard rows={3} />
            </div>
          </div>
          {/* Opportunities */}
          <div className="space-y-4">
            <div className="skeleton w-44 h-3 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton rounded-2xl h-16" />
              ))}
            </div>
          </div>
        </div>
        {/* Right col */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="skeleton w-32 h-3 rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} variant="stat" />)}
            </div>
          </div>
          <div className="space-y-3">
            <div className="skeleton w-28 h-3 rounded-md" />
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton rounded-2xl h-14" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
