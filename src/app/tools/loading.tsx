'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ToolsLoading() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      {/* Navbar skeleton */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-2xl border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/20 animate-pulse" />
            <div className="h-4 w-20 rounded bg-surface-container animate-pulse" />
          </div>
        </div>
      </nav>

      {/* Content skeleton */}
      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          {/* Title skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 w-64 mx-auto rounded-lg bg-surface-container animate-pulse mb-6" />
            <div className="h-5 w-96 mx-auto rounded-lg bg-surface-container animate-pulse" />
          </div>

          {/* Upload area skeleton */}
          <div className="h-40 md:h-64 rounded-[2rem] bg-surface border border-outline-variant/30 flex flex-col items-center justify-center gap-4 shadow-sm">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-sm font-medium text-outline-variant">Loading tool...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
