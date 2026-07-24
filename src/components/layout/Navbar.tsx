'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <FileText size={18} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
              AetherPDF
            </span>
            <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
              Precision Editor
            </span>
          </div>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="/tools">
            Tools
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="/#features">
            Features
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="/#how-it-works">
            How it Works
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="/#faq">
            FAQ
          </Link>
        </div>
        
        {/* Primary CTA */}
        <div className="flex items-center gap-3">
          <Link 
            href="/editor" 
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all duration-200 shadow-sm"
          >
            <span>Open Editor</span>
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

      </div>
    </nav>
  );
}
