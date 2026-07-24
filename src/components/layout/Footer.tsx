import React from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 relative z-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Brand Summary */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FileText size={16} strokeWidth={2} />
            </div>
            <span className="font-bold text-base text-white tracking-tight">AetherPDF</span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm text-center md:text-left">
            Precision engineering for digital documents. 100% in-browser processing with zero server uploads. Fast, private, and free.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-400">
          <Link href="/editor" className="hover:text-white transition-colors">Editor</Link>
          <Link href="/tools" className="hover:text-white transition-colors">All Tools</Link>
          <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        {/* Security & Copyright */}
        <div className="flex flex-col items-center md:items-end gap-1.5">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-400" strokeWidth={2} /> 100% Client-Side</span>
            <span className="flex items-center gap-1"><Zap size={13} className="text-amber-400" strokeWidth={2} /> WebAssembly Speed</span>
          </div>
          <div className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} AetherPDF. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
