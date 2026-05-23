'use client';

import React, { useState, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../store/useEditorStore';
import { parsePdfLayout } from '../utils/pdfParser';
import { Loader2, FileText, ChevronDown, CheckCircle2, Shield, Zap, UploadCloud, ArrowRight, LayoutPanelTop, MousePointer2, Type, Image as ImageIcon, Scissors, Settings, Lock, FileSignature } from 'lucide-react';
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const popularTools = [
    { title: 'Edit PDF', icon: <Type size={20} />, href: '/editor?tool=edit-pdf' },
    { title: 'Merge PDF', icon: <LayoutPanelTop size={20} />, href: '/editor?tool=merge-pdf' },
    { title: 'Split PDF', icon: <Scissors size={20} />, href: '/editor?tool=split-pdf' },
    { title: 'Compress PDF', icon: <Settings size={20} />, href: '/editor?tool=compress-pdf' },
    { title: 'Sign PDF', icon: <FileSignature size={20} />, href: '/editor?tool=sign-pdf' },
    { title: 'Protect PDF', icon: <Lock size={20} />, href: '/editor?tool=protect-pdf' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-16">
        {/* SECTION 1: HERO */}
        <section className="relative pt-24 pb-32 overflow-hidden px-6">
          {/* Subtle mesh background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Phase 1 Live — 100% Free Engine
            </div>
            
            <h1 className="font-display text-[56px] md:text-[80px] leading-[1.1] font-bold tracking-tight mb-6 animate-fade-up stagger-1 text-on-surface">
              Edit Any PDF Like a Pro <span className="text-primary">— Free</span>
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto mb-10 font-medium animate-fade-up stagger-2">
              Fast. Beautiful. No Login Required. Experience the ultimate browser-based PDF workspace.
            </p>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12 animate-fade-up stagger-2 font-medium text-on-surface-variant text-sm md:text-base">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-5 h-5 text-primary" /> Free</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-5 h-5 text-primary" /> No Sign Up</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-5 h-5 text-primary" /> Fast</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-5 h-5 text-primary" /> Secure</span>
            </div>

            {/* Drag & Drop Area */}
            <div className="max-w-3xl mx-auto animate-fade-up stagger-3">
              {isLoading ? (
                <div className="h-80 rounded-3xl bg-white border border-outline-variant shadow-xl flex flex-col items-center justify-center gap-4">
                  <Loader2 size={48} className="text-primary animate-spin" />
                  <h4 className="font-headline-md text-primary font-semibold">Processing Document...</h4>
                  <p className="text-sm text-on-surface-variant">Extracting text blocks securely.</p>
                </div>
              ) : (
                <div 
                  className={`relative group border-2 border-dashed rounded-3xl p-16 transition-all duration-300 overflow-hidden cursor-pointer bg-white ${
                    isDragOver ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/20' : 'border-outline-variant hover:border-primary shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/10'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="relative z-10 flex flex-col items-center pointer-events-none">
                    <div className="w-24 h-24 bg-surface-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white text-primary transition-colors duration-300">
                      <UploadCloud className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface mb-2">Drag & Drop Upload Area</h3>
                    <p className="text-on-surface-variant mb-6">or click to browse your files</p>
                    <div className="bg-primary text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 group-hover:scale-105 transition-transform pointer-events-auto shadow-md">
                      Edit PDF Now <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 animate-fade-up stagger-3">
              <Link href="/tools" className="text-on-surface font-semibold hover:text-primary transition-colors inline-flex items-center gap-2 group">
                Explore All Tools <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 2: POPULAR TOOLS GRID */}
        <section className="py-24 bg-surface-container-lowest border-y border-outline-variant/30 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-display text-4xl font-bold text-on-surface mb-4">Popular PDF Tools</h2>
                <p className="text-on-surface-variant text-lg">The most powerful suite for your daily document needs.</p>
              </div>
              <Link href="/tools" className="bg-surface-container text-on-surface px-6 py-2.5 rounded-lg font-semibold hover:bg-outline-variant/30 transition-colors">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {popularTools.map((tool, i) => (
                <Link key={i} href={tool.href} className="bg-white p-6 rounded-2xl border border-outline-variant/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-surface-container text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface text-lg mb-1">{tool.title}</h3>
                    <p className="text-on-surface-variant text-sm">Professional utility</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: WHY VELTISPDF */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold text-on-surface mb-6">Why users choose VeltisPDF</h2>
              <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">Engineered differently from the ground up to respect your time and privacy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Lightning Fast</h3>
                <p className="text-on-surface-variant">Everything runs entirely inside your browser. No uploading to external servers means instant processing.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Privacy First</h3>
                <p className="text-on-surface-variant">Your documents never leave your device. We couldn't look at them even if we wanted to.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-veltis-cyan/10 flex items-center justify-center text-veltis-cyan mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Professional Output</h3>
                <p className="text-on-surface-variant">Native vector graphics and text extraction ensures your exported PDFs remain crisp and unpixelated.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: LIVE PRODUCT PREVIEW (CSS Mockup) */}
        <section className="py-24 bg-[#0A0A0F] text-white overflow-hidden px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold mb-6">Experience Premium Craftsmanship</h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">A UI designed to stay out of your way, giving you full control over your document.</p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-[#12121A] shadow-2xl overflow-hidden ring-1 ring-white/5 aspect-video md:aspect-[16/9] max-w-5xl mx-auto flex flex-col group">
              {/* Window Header */}
              <div className="h-12 border-b border-white/10 bg-[#0D0D12] flex items-center px-4 justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="text-xs font-semibold text-zinc-500 font-mono">VeltisPDF Editor Pro</div>
                <div className="w-16"></div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar (Pages) */}
                <div className="w-48 border-r border-white/5 bg-[#0F0F14] hidden md:flex flex-col p-4 gap-4">
                  <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Pages</div>
                  <div className="aspect-[1/1.4] bg-white rounded flex items-center justify-center ring-2 ring-primary relative">
                    <div className="w-full h-full p-2 opacity-50 flex flex-col gap-1">
                      <div className="w-full h-1 bg-zinc-300 rounded"></div>
                      <div className="w-3/4 h-1 bg-zinc-300 rounded"></div>
                      <div className="w-full h-1 bg-zinc-300 rounded mt-2"></div>
                    </div>
                  </div>
                  <div className="aspect-[1/1.4] bg-white/10 rounded border border-white/5"></div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-[#1A1A24] relative flex items-center justify-center p-8">
                  {/* Floating Toolbar Mock */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#2A2A35]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <Type size={16} className="text-white" />
                    <ImageIcon size={16} className="text-zinc-400" />
                    <Settings size={16} className="text-zinc-400" />
                    <div className="w-px h-4 bg-white/20"></div>
                    <div className="text-xs font-medium text-white px-2 py-1 bg-primary rounded-full">Save</div>
                  </div>

                  {/* Document Paper */}
                  <div className="bg-white w-full max-w-sm aspect-[1/1.4] rounded shadow-2xl relative p-8">
                    <div className="w-full h-8 bg-zinc-100 rounded mb-6 flex items-center px-4 relative group/elem cursor-pointer">
                      <div className="w-1/2 h-4 bg-zinc-300 rounded"></div>
                      {/* Selection Box Mock */}
                      <div className="absolute inset-0 border-2 border-primary rounded opacity-0 group-hover/elem:opacity-100 transition-opacity">
                         <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                         <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                         <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                         <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-3 bg-zinc-200 rounded"></div>
                      <div className="w-full h-3 bg-zinc-200 rounded"></div>
                      <div className="w-4/5 h-3 bg-zinc-200 rounded"></div>
                      <div className="w-full h-3 bg-zinc-200 rounded mt-6"></div>
                      <div className="w-3/4 h-3 bg-zinc-200 rounded"></div>
                    </div>
                    
                    {/* Fake Cursor */}
                    <div className="absolute top-[40%] left-[30%] text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-300 animate-bounce">
                      <MousePointer2 size={24} fill="currentColor" />
                    </div>
                  </div>
                </div>

                {/* Right Sidebar (Properties) */}
                <div className="w-56 border-l border-white/5 bg-[#0F0F14] hidden lg:flex flex-col p-5 gap-6">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Typography</div>
                    <div className="bg-[#1A1A24] border border-white/10 rounded p-2 flex justify-between items-center mb-2">
                      <span className="text-xs text-white">Inter</span>
                      <ChevronDown size={14} className="text-zinc-500" />
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-[#1A1A24] border border-white/10 rounded p-2 flex-1 text-center text-xs text-white">Regular</div>
                      <div className="bg-[#1A1A24] border border-white/10 rounded p-2 flex-1 text-center text-xs text-white">16px</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Color</div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/20"></div>
                      <div className="w-6 h-6 rounded-full bg-primary border border-primary"></div>
                      <div className="w-6 h-6 rounded-full bg-red-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: WORKFLOW */}
        <section className="py-32 px-6 bg-surface">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="font-display text-4xl font-bold text-on-surface mb-16">Simple 3-Step Flow</h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-outline-variant/50 -z-10 -translate-y-1/2"></div>
              
              <div className="flex flex-col items-center bg-surface p-6">
                <div className="w-20 h-20 rounded-full bg-white border border-outline-variant shadow-xl flex items-center justify-center mb-6 text-2xl font-bold text-primary">1</div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Upload PDF</h3>
                <p className="text-on-surface-variant text-sm">Drag & drop your file securely.</p>
              </div>
              <div className="flex flex-col items-center bg-surface p-6">
                <div className="w-20 h-20 rounded-full bg-primary shadow-xl shadow-primary/20 flex items-center justify-center mb-6 text-2xl font-bold text-white">2</div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Edit Easily</h3>
                <p className="text-on-surface-variant text-sm">Modify text, images, and pages.</p>
              </div>
              <div className="flex flex-col items-center bg-surface p-6">
                <div className="w-20 h-20 rounded-full bg-white border border-outline-variant shadow-xl flex items-center justify-center mb-6 text-2xl font-bold text-primary">3</div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Export Instantly</h3>
                <p className="text-on-surface-variant text-sm">Download your perfect document.</p>
              </div>
            </div>
          </div>
        </section>


        {/* SECTION 7: FAQ */}
        <section className="py-32 px-6" id="faq">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold text-on-surface mb-6">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: 'Is it free?', a: 'Yes. VeltisPDF provides its core engine completely free of charge with no hidden paywalls.' },
                { q: 'Is signup required?', a: 'No registration or emails needed. Just drag, drop, and edit.' },
                { q: 'Is my PDF secure?', a: '100% secure. Processing happens locally in your browser. Your files are never uploaded to our servers.' },
                { q: 'Can I edit scanned PDFs?', a: 'We currently support native vector PDFs for text extraction. OCR for scanned PDFs is on our roadmap.' },
                { q: 'Does it work on mobile?', a: 'Yes, VeltisPDF is responsive and works flawlessly on tablets and mobile devices.' },
              ].map((faq, i) => (
                <div 
                  key={i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`rounded-2xl p-6 transition-all duration-300 cursor-pointer border ${
                    openFaq === i 
                      ? 'bg-surface-container-low border-primary/30 shadow-md' 
                      : 'bg-white hover:bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <div className="flex justify-between items-center gap-4">
                    <h6 className="text-lg font-semibold text-on-surface">
                      {faq.q}
                    </h6>
                    <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-primary' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-on-surface-variant">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
