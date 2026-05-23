'use client';

import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-2xl border-b border-outline-variant/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
            <span className="text-on-primary font-bold text-xs tracking-widest">V</span>
          </div>
          <span className="font-semibold text-lg text-on-surface tracking-tight group-hover:text-primary transition-colors">
            VeltisPDF
          </span>
        </Link>
        
        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" href="/tools">Tools</Link>
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" href="/#faq">FAQ</Link>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/editor" className="bg-on-surface text-background px-4 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-on-primary hover:shadow-lg hover:shadow-primary/20 transition-all">
            Open Editor
          </Link>
        </div>
      </div>
    </nav>
  );
}
