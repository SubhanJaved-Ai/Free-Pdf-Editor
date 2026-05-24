'use client';

import React, { useState, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../store/useEditorStore';
import { parsePdfLayout } from '../utils/pdfParser';
import { Loader2, UploadCloud, Type, LayoutPanelTop, Scissors, Settings, Lock, FileSignature, Zap, Shield, Sparkles } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import Link from 'next/link';

function cloneUint8Array(arr: Uint8Array): Uint8Array {
  const clone = new Uint8Array(arr.length);
  clone.set(arr);
  return clone;
}

export default function HomePage() {
  const router = useRouter();
  const { setPdf } = useEditorStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processPdfFile = async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const url = URL.createObjectURL(file);
      
      const clonedBytes = cloneUint8Array(bytes);
      const parsed = await parsePdfLayout(clonedBytes);
      setPdf(url, cloneUint8Array(bytes), file.name, parsed.pageDimensions);
      
      if (parsed.elements.length > 0) {
        useEditorStore.setState({ elements: parsed.elements });
      }
      router.push('/editor');
    } catch (err: any) {
      console.error(err);
      alert(`Error loading PDF: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdfFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      processPdfFile(file);
    } else {
      alert("Please upload a valid PDF document.");
    }
  };

  const tools = [
    { title: 'Edit', icon: <Type size={18} />, href: '/editor' },
    { title: 'Merge', icon: <LayoutPanelTop size={18} />, href: '/tools/merge-pdf' },
    { title: 'Split', icon: <Scissors size={18} />, href: '/tools/split-pdf' },
    { title: 'Compress', icon: <Settings size={18} />, href: '/tools/compress-pdf' },
    { title: 'Sign', icon: <FileSignature size={18} />, href: '/editor' },
    { title: 'Protect', icon: <Lock size={18} />, href: '/tools/protect-pdf' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        {/* Subtle mesh background */}
        <div className="mesh-gradient-optimized"></div>

        {/* HERO */}
        <div className="w-full max-w-4xl text-center relative z-10 animate-fade-up">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-on-surface mb-6">
            The elegant way to edit PDFs.
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant font-medium mb-12">
            Fast, secure, and entirely in your browser.
          </p>

          {/* UPLOAD AREA */}
          <div className="max-w-3xl mx-auto mt-12 mb-16 animate-fade-up stagger-1">
            {isLoading ? (
              <div className="h-40 md:h-64 rounded-[2rem] bg-white border border-outline-variant/30 flex flex-col items-center justify-center gap-4 shadow-sm">
                <Loader2 size={32} className="text-primary animate-spin" />
                <p className="text-sm font-medium text-outline-variant">Processing document securely...</p>
              </div>
            ) : (
              <div 
                className={`relative group h-40 md:h-64 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden ${
                  isDragOver 
                    ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/20 scale-[1.02]' 
                    : 'border-outline-variant/50 bg-white/50 hover:bg-white hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 backdrop-blur-sm'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-lowest/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className={`w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-6 transition-all duration-500 ${isDragOver ? 'scale-110 bg-primary text-white shadow-lg shadow-primary/30' : 'text-primary group-hover:scale-110 group-hover:bg-primary/10'}`}>
                  <UploadCloud size={32} className={isDragOver ? 'animate-bounce' : ''} />
                </div>
                
                <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${isDragOver ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                  {isDragOver ? 'Drop PDF here' : 'Click or Drag PDF here'}
                </h3>
                
                <p className="text-sm font-medium text-outline-variant/60 flex items-center gap-2">
                  <Lock size={14} /> Local processing. No uploads to server.
                </p>
              </div>
            )}
          </div>

          {/* MINI FEATURES */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 animate-fade-up stagger-2 mb-24">
            <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <Zap size={16} className="text-primary" /> Instant Processing
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <Shield size={16} className="text-primary" /> 100% Private
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <Sparkles size={16} className="text-primary" /> Free to use
            </div>
          </div>
        </div>

        {/* TOOLS GRID */}
        <div className="w-full max-w-5xl relative z-10 animate-fade-up stagger-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tools.map((tool, i) => (
              <Link 
                key={i} 
                href={tool.href} 
                className="bento-card bg-surface p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center text-center group"
              >
                <div className="text-on-surface-variant group-hover:text-primary transition-colors mb-3">
                  {tool.icon}
                </div>
                <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                  {tool.title}
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tools" className="text-sm font-medium text-primary hover:text-secondary transition-colors inline-flex items-center gap-1">
              View all tools &rarr;
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
