'use client';

import React, { useState, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../store/useEditorStore';
import { parsePdfLayout } from '../utils/pdfParser';
import { 
  Loader2, 
  UploadCloud, 
  Type, 
  LayoutPanelTop, 
  Scissors, 
  Settings, 
  Lock, 
  FileSignature, 
  Zap, 
  Shield, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  FileCheck,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BeforeAfterSlider } from '../components/landing/BeforeAfterSlider';
import { FaqAccordion } from '../components/landing/FaqAccordion';
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
    { title: 'Edit PDF', description: 'Modify text, fonts, images, and shapes directly inside any PDF file.', icon: <Type size={22} />, href: '/editor', badge: 'Popular' },
    { title: 'Merge PDF', description: 'Combine multiple PDF files into one organized document seamlessly.', icon: <LayoutPanelTop size={22} />, href: '/tools/merge-pdf', badge: 'Organize' },
    { title: 'Split PDF', description: 'Extract specific pages or split document into independent files.', icon: <Scissors size={22} />, href: '/tools/split-pdf', badge: 'Organize' },
    { title: 'Compress PDF', description: 'Reduce PDF file size significantly while retaining crisp visual quality.', icon: <Settings size={22} />, href: '/tools/compress-pdf', badge: 'Optimize' },
    { title: 'Sign PDF', description: 'Draw or insert professional e-signatures into contract agreements.', icon: <FileSignature size={22} />, href: '/editor', badge: 'Security' },
    { title: 'Protect PDF', description: 'Encrypt documents with 256-bit AES password protection.', icon: <Lock size={22} />, href: '/tools/protect-pdf', badge: 'Security' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container relative overflow-x-hidden">
      {/* Background ambient noise and mesh */}
      <div className="grain-bg"></div>
      <div className="mesh-gradient"></div>

      <Navbar />

      <main className="flex-grow pt-28 md:pt-36 pb-20 px-6 flex flex-col items-center relative z-10">
        
        {/* HERO SECTION */}
        <section className="w-full max-w-5xl text-center relative z-10">
          
          {/* Eyebrow Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-up">
            <Sparkles size={14} className="text-secondary" />
            <span>Precision PDF Engine 2.0 • 100% In-Browser</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-on-surface mb-6 animate-fade-up stagger-1 leading-[1.1]">
            Edit Any PDF. <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">Instantly.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-on-surface-variant font-normal mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up stagger-2">
            Professional PDF editing with zero setup. No signup, no daily limits — just precision tools engineered for high-stakes productivity.
          </p>

          {/* UPLOAD DROP ZONE */}
          <div className="max-w-3xl mx-auto mt-6 mb-12 animate-fade-up stagger-3 parallax-float">
            {isLoading ? (
              <div className="h-56 md:h-72 rounded-[2.5rem] bg-white/90 border-2 border-primary/30 flex flex-col items-center justify-center gap-4 shadow-2xl backdrop-blur-xl">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Loader2 size={36} className="animate-spin" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-bold text-on-surface mb-1">Parsing Document Layout...</h4>
                  <p className="text-xs font-medium text-on-surface-variant">Processing text boxes and vectors safely in local memory</p>
                </div>
              </div>
            ) : (
              <div 
                className={`relative group rounded-[2.5rem] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden p-10 md:p-14 ${
                  isDragOver 
                    ? 'border-secondary bg-secondary/10 shadow-2xl shadow-secondary/20 scale-[1.02]' 
                    : 'border-outline-variant/60 bg-white/60 hover:bg-white hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 backdrop-blur-md'
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
                  aria-label="Upload PDF file"
                />
                
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Upload Icon Container */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 ${
                    isDragOver 
                      ? 'scale-110 bg-primary text-white shadow-xl shadow-primary/30 animate-bounce' 
                      : 'bg-surface-container text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25'
                  }`}>
                    <UploadCloud size={38} />
                  </div>
                  
                  <h3 className={`text-2xl md:text-3xl font-bold mb-2 tracking-tight transition-colors duration-300 ${
                    isDragOver ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                  }`}>
                    {isDragOver ? 'Drop PDF File Here' : 'Drop your PDF here'}
                  </h3>
                  
                  <p className="text-sm text-on-surface-variant font-medium mb-4">
                    or <span className="text-primary font-semibold underline underline-offset-4">click to browse</span> from your device
                  </p>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container/70 border border-outline-variant/40 text-xs font-medium text-on-surface-variant">
                    <Lock size={12} className="text-emerald-600" />
                    <span>Local processing. Zero server uploads.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MINI TRUST FEATURE BADGES */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 animate-fade-up stagger-4 mb-20 text-xs sm:text-sm font-semibold text-on-surface-variant">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-outline-variant/30">
              <Zap size={16} className="text-amber-500" /> Instant Processing
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-outline-variant/30">
              <Shield size={16} className="text-emerald-500" /> 100% Private & Secure
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-outline-variant/30">
              <Sparkles size={16} className="text-primary" /> Free & No Watermarks
            </div>
          </div>
        </section>


        {/* BENTO GRID TOOLS SECTION */}
        <section className="w-full max-w-6xl my-16 relative z-10" id="features">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="text-secondary font-semibold text-xs uppercase tracking-widest block mb-2">
                Precision Toolkit
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
                Engineered for total document control.
              </h2>
            </div>
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-secondary transition-colors"
            >
              <span>View all 12 tools</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, i) => (
              <Link 
                key={i} 
                href={tool.href} 
                className="bento-card p-7 bg-white/70 backdrop-blur-md border border-outline-variant/50 rounded-3xl flex flex-col justify-between h-64 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                    {tool.icon}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-variant/60 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>


        {/* 3-STEP WORKFLOW SECTION */}
        <section className="w-full max-w-5xl my-16 py-12 relative z-10" id="how-it-works">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest block mb-2">
              Simple & Fast
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-3">
              Precision in three steps.
            </h2>
            <p className="text-on-surface-variant text-base max-w-md mx-auto">
              Your PDF editing workflow, streamlined for maximum efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/50 border border-outline-variant/30 relative">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl mb-6 shadow-xl shadow-primary/25 step-number-pulse">
                1
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Upload File</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                Drag and drop your PDF into our encrypted local browser canvas. No server uploads.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/50 border border-outline-variant/30 relative">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl mb-6 shadow-xl shadow-primary/25 step-number-pulse">
                2
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Edit & Customize</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                Modify text, insert images, add signatures, or reorder pages with full precision.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/50 border border-outline-variant/30 relative">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl mb-6 shadow-xl shadow-primary/25 step-number-pulse">
                3
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Export Instantly</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                Download your edited document in high-res vector quality with zero watermarks.
              </p>
            </div>

          </div>
        </section>


        {/* BEFORE / AFTER SLIDER SHOWCASE */}
        <BeforeAfterSlider />


        {/* SECURITY & PRIVACY HIGHLIGHT SECTION */}
        <section className="w-full max-w-5xl my-16 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-on-background via-slate-900 to-on-background text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={26} />
              </div>
              <h3 className="text-lg font-bold">100% In-Browser Privacy</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Your sensitive files remain on your device at all times. We use WebAssembly to eliminate server uploads completely.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                <Cpu size={26} />
              </div>
              <h3 className="text-lg font-bold">High-Speed Engine</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Experience instant rendering and modification without waiting for slow cloud processing queues.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-primary-light">
                <FileCheck size={26} />
              </div>
              <h3 className="text-lg font-bold">Pixel-Perfect Vector Export</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Export crisp text and vector graphics preserved with original font matching and 0 quality degradation.
              </p>
            </div>
          </div>
        </section>


        {/* FAQ SECTION */}
        <FaqAccordion />


        {/* FINAL CTA BANNER */}
        <section className="w-full max-w-4xl my-16 text-center p-10 md:p-16 rounded-[2.5rem] bg-white border border-primary/20 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">
              Ready to edit your PDFs?
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg mb-8 max-w-md mx-auto">
              No registration, no credit cards. Start editing your documents in seconds.
            </p>
            <Link 
              href="/editor" 
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-base font-bold shadow-xl shadow-primary/30 hover:bg-primary-light hover:scale-105 active:scale-95 transition-all"
            >
              <span>Launch Editor Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
