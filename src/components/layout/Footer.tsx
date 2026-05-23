import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background border-t border-outline-variant/30 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
            <span className="text-on-primary font-bold text-[10px] tracking-widest">V</span>
          </div>
          <span className="font-semibold text-on-surface text-sm">VeltisPDF</span>
        </div>
        
        <div className="flex gap-6 text-sm text-on-surface-variant font-medium">
          <Link href="/editor" className="hover:text-primary transition-colors">Editor</Link>
          <Link href="/tools" className="hover:text-primary transition-colors">Tools</Link>
          <Link href="/#faq" className="hover:text-primary transition-colors">FAQ</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
        </div>
        
        <div className="text-xs text-on-surface-variant/70">
          © {new Date().getFullYear()} VeltisPDF
        </div>
      </div>
    </footer>
  );
}
