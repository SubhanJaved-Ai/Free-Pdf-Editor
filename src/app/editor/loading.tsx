'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function EditorLoading() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-on-background overflow-hidden font-sans">
      {/* Top toolbar skeleton */}
      <header className="h-16 w-full bg-surface-container/80 border-b border-outline-variant/30 flex items-center justify-between px-4 shadow-sm z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded bg-primary/20 animate-pulse" />
          <div className="h-4 w-16 rounded bg-surface-container animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 rounded-lg bg-surface-container animate-pulse" />
          <div className="h-9 w-20 rounded-lg bg-primary/20 animate-pulse" />
        </div>
      </header>

      {/* Editor area */}
      <div className="flex-1 flex items-center justify-center bg-surface-container-low">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="text-primary animate-spin" />
          <span className="text-sm font-bold text-outline">Loading editor...</span>
        </div>
      </div>
    </div>
  );
}
