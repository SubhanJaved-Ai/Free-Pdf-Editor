'use client';

import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded bg-gradient-to-tr from-primary via-primary-container to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <span className="text-on-primary font-bold text-sm tracking-widest">V</span>
          </div>
          <span className="font-display text-xl font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
            Veltis<span className="text-primary">PDF</span>
          </span>
        </Link>
        
        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link className="font-body-sm text-on-surface-variant hover:text-primary transition-colors font-medium" href="/">Home</Link>
          <Link className="font-body-sm text-on-surface-variant hover:text-primary transition-colors font-medium" href="/tools">Tools Hub</Link>
          <Link className="font-body-sm text-on-surface-variant hover:text-primary transition-colors font-medium" href="/#faq">FAQ</Link>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/editor" className="bg-primary text-on-primary px-5 py-2 rounded-lg font-label-md hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-2">
            Open Editor
          </Link>
        </div>
      </div>
    </nav>
  );
}
