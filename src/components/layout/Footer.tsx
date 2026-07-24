import React from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-on-background text-white py-16 relative z-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
        
        {/* Brand Summary */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center shadow-md">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">AetherPDF</span>
          </div>
          <p className="text-xs text-white/60 max-w-sm text-center md:text-left leading-relaxed">
            Precision engineering for digital documents. 100% in-browser processing with zero server uploads. Fast, private, and free.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-8 text-xs font-medium text-white/70">
          <Link href="/editor" className="hover:text-white transition-colors">Editor</Link>
          <Link href="/tools" className="hover:text-white transition-colors">All Tools</Link>
          <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        {/* Trust Badge & Copyright */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex items-center gap-4 text-[11px] text-white/50">
            <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-400" /> 100% Secure</span>
            <span className="flex items-center gap-1"><Zap size={13} className="text-amber-400" /> WebAssembly Speed</span>
          </div>
          <div className="text-[11px] text-white/40">
            © {new Date().getFullYear()} AetherPDF. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
