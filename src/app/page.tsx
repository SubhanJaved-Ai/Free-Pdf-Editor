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
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Cpu,
  FileCheck,
  CheckCircle2,
  FileText
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
    { title: 'Edit PDF', description: 'Modify text, fonts, images, and shapes directly inside any PDF file.', icon: <Type size={20} strokeWidth={1.75} />, href: '/editor', category: 'Popular' },
    { title: 'Merge PDF', description: 'Combine multiple PDF files into one organized document seamlessly.', icon: <LayoutPanelTop size={20} strokeWidth={1.75} />, href: '/tools/merge-pdf', category: 'Organize' },
    { title: 'Split PDF', description: 'Extract specific pages or split document into independent files.', icon: <Scissors size={20} strokeWidth={1.75} />, href: '/tools/split-pdf', category: 'Organize' },
    { title: 'Compress PDF', description: 'Reduce PDF file size significantly while retaining crisp visual quality.', icon: <Settings size={20} strokeWidth={1.75} />, href: '/tools/compress-pdf', category: 'Optimize' },
    { title: 'Sign PDF', description: 'Draw or insert professional e-signatures into contract agreements.', icon: <FileSignature size={20} strokeWidth={1.75} />, href: '/editor', category: 'Security' },
    { title: 'Protect PDF', description: 'Encrypt documents with password protection and security rules.', icon: <Lock size={20} strokeWidth={1.75} />, href: '/tools/protect-pdf', category: 'Security' },
  ];

  return (
    <div className="bg-slate-50/50 text-slate-900 min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-x-hidden">
      {/* Background ambient noise and mesh */}
      <div className="grain-bg"></div>
      <div className="mesh-gradient"></div>

      <Navbar />

      <main className="flex-grow pt-28 md:pt-32 pb-20 px-6 flex flex-col items-center relative z-10">
        
        {/* HERO SECTION */}
        <section className="w-full max-w-4xl text-center relative z-10">
          
          {/* Eyebrow Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-up">
            <Sparkles size={13} strokeWidth={2} className="text-indigo-600" />
            <span>100% In-Browser • Zero Server Uploads</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4 animate-fade-up stagger-1 leading-[1.15]">
            Edit Any PDF. <span className="text-indigo-600">Instantly.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg text-slate-600 font-normal mb-8 max-w-xl mx-auto leading-relaxed animate-fade-up stagger-2">
            Professional PDF editing for free. No signup required, no watermarks, and no file uploads to external servers.
          </p>

          {/* PRIMARY HERO PDF UPLOAD BOX (RESTORED FOCUS FEATURE) */}
          <div className="max-w-2xl mx-auto mb-10 animate-fade-up stagger-3">
            {isLoading ? (
              <div className="h-56 md:h-64 rounded-3xl bg-white border-2 border-indigo-200 flex flex-col items-center justify-center gap-3 shadow-xl backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Loader2 size={32} strokeWidth={2} className="animate-spin" />
                </div>
                <div className="text-center">
                  <h4 className="text-base font-bold text-slate-900 mb-0.5">Processing Document Securely...</h4>
                  <p className="text-xs font-medium text-slate-500">Parsing layout & text elements locally in browser memory</p>
                </div>
              </div>
            ) : (
              <div 
                className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden p-8 md:p-12 ${
                  isDragOver 
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-2xl scale-[1.01]' 
                    : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-indigo-400 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-indigo-500/10'
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

                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Upload Icon Box */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    isDragOver 
                      ? 'bg-indigo-600 text-white shadow-lg scale-110' 
                      : 'bg-indigo-50 text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white shadow-sm'
                  }`}>
                    <UploadCloud size={32} strokeWidth={1.75} />
                  </div>
                  
                  <h3 className={`text-xl md:text-2xl font-bold mb-1.5 tracking-tight transition-colors duration-200 ${
                    isDragOver ? 'text-indigo-600' : 'text-slate-900 group-hover:text-indigo-600'
                  }`}>
                    {isDragOver ? 'Drop PDF File Here' : 'Click or Drag PDF file here'}
                  </h3>
                  
                  <p className="text-xs md:text-sm text-slate-500 font-medium mb-4">
                    Supports PDF up to 500MB • Instant browser editing
                  </p>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-600">
                    <Lock size={12} strokeWidth={2} className="text-emerald-600" />
                    <span>Local Sandbox. Zero file server uploads.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MINI TRUST FEATURES */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 animate-fade-up stagger-4 mb-16 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <Zap size={14} strokeWidth={2} className="text-amber-500" /> Instant Processing
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <ShieldCheck size={14} strokeWidth={2} className="text-emerald-500" /> 100% Private
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <Sparkles size={14} strokeWidth={2} className="text-indigo-600" /> Free & No Watermarks
            </div>
          </div>
        </section>


        {/* BENTO GRID TOOLS SECTION */}
        <section className="w-full max-w-5xl my-12 relative z-10" id="features">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-3">
            <div>
              <span className="text-indigo-600 font-semibold text-xs uppercase tracking-wider block mb-1">
                Precision Toolkit
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Engineered for total document control.
              </h2>
            </div>
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <span>View all 12 tools</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool, i) => (
              <Link 
                key={i} 
                href={tool.href} 
                className="bento-card p-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between h-56 group relative shadow-xs"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                    {tool.icon}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {tool.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>


        {/* 3-STEP WORKFLOW SECTION */}
        <section className="w-full max-w-4xl my-12 py-8 relative z-10" id="how-it-works">
          <div className="text-center mb-12">
            <span className="text-indigo-600 font-semibold text-xs uppercase tracking-wider block mb-1">
              Simple Workflow
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Precision in three steps.
            </h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto">
              Streamlined document handling designed for speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm step-number-pulse">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Upload File</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drag and drop your PDF into our encrypted local browser canvas.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm step-number-pulse">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Edit & Customize</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Modify text, insert images, add signatures, or reorder pages easily.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm step-number-pulse">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Export Instantly</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download your edited document in high-res vector quality with zero watermarks.
              </p>
            </div>

          </div>
        </section>


        {/* BEFORE / AFTER SLIDER SHOWCASE */}
        <BeforeAfterSlider />


        {/* PRIVACY & SECURITY SUMMARY */}
        <section className="w-full max-w-4xl my-12 p-8 md:p-10 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <h3 className="text-sm font-bold">100% In-Browser Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your sensitive files remain on your device at all times. WebAssembly eliminates server uploads completely.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                <Cpu size={22} strokeWidth={2} />
              </div>
              <h3 className="text-sm font-bold">High-Speed Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant parsing and rendering without waiting for external server queues.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-indigo-400">
                <FileCheck size={22} strokeWidth={2} />
              </div>
              <h3 className="text-sm font-bold">Crisp Vector Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export text and graphics preserved with original font matching and zero resolution loss.
              </p>
            </div>
          </div>
        </section>


        {/* FAQ SECTION */}
        <FaqAccordion />


        {/* FINAL CTA BANNER */}
        <section className="w-full max-w-3xl my-12 text-center p-8 md:p-12 rounded-3xl bg-white border border-slate-200 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              Ready to edit your PDFs?
            </h2>
            <p className="text-slate-600 text-xs md:text-sm mb-6 max-w-sm mx-auto">
              No registration, no credit cards. Start editing your documents instantly in your browser.
            </p>
            <Link 
              href="/editor" 
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <span>Launch Editor Now</span>
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
