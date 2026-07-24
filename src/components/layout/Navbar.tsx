'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
            <FileText size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-on-surface tracking-tight leading-none group-hover:text-primary transition-colors">
              AetherPDF
            </span>
            <span className="text-[10px] font-medium text-on-surface-variant tracking-wider uppercase">
              Precision Editor
            </span>
          </div>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm text-on-surface-variant hover:text-primary font-medium transition-colors" href="/tools">
            Tools
          </Link>
          <Link className="text-sm text-on-surface-variant hover:text-primary font-medium transition-colors" href="/#features">
            Features
          </Link>
          <Link className="text-sm text-on-surface-variant hover:text-primary font-medium transition-colors" href="/#how-it-works">
            How it Works
          </Link>
          <Link className="text-sm text-on-surface-variant hover:text-primary font-medium transition-colors" href="/#faq">
            FAQ
          </Link>
        </div>
        
        {/* Primary CTA */}
        <div className="flex items-center gap-3">
          <Link 
            href="/editor" 
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all"
          >
            <span>Open Editor</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
