'use client';

import React, { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../store/useEditorStore';
import { checkAutoSave, clearAutoSave, AutoSaveData } from '../hooks/useAutoSave';
import { parsePdfLayout } from '../utils/pdfParser';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Loader2, FileText, ChevronDown, Type, Image as ImageIcon, PenTool, Hexagon } from 'lucide-react';

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
  const [savedSession, setSavedSession] = useState<AutoSaveData | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Slider state
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    checkAutoSave().then(data => {
      if (data && data.pdfBytes) {
        setSavedSession(data);
      }
    });
  }, []);

  // Handle window mouse events for slider
  useEffect(() => {
    const handleMouseUp = () => setIsResizing(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && sliderContainerRef.current) {
        const rect = sliderContainerRef.current.getBoundingClientRect();
        let pos = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, pos)));
      }
    };
    
    const handleTouchEnd = () => setIsResizing(false);
    const handleTouchMove = (e: TouchEvent) => {
      if (isResizing && sliderContainerRef.current) {
        const rect = sliderContainerRef.current.getBoundingClientRect();
        let pos = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, pos)));
      }
    };

    if (isResizing) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isResizing]);

  const handleRestoreSession = () => {
    if (!savedSession) return;
    setIsLoading(true);
    try {
      const url = URL.createObjectURL(new Blob([savedSession.pdfBytes as any], { type: 'application/pdf' }));
      setPdf(url, savedSession.pdfBytes, savedSession.fileName || 'restored_document.pdf', []);
      useEditorStore.setState({ 
        elements: savedSession.elements || [],
        zoom: savedSession.zoom || 100,
        currentPageIndex: savedSession.pageIndex || 0
      });
      router.push('/editor');
    } catch (e) {
      console.error(e);
      alert('Failed to restore session.');
      setIsLoading(false);
    }
  };

  const handleDiscardSession = async () => {
    await clearAutoSave();
    setSavedSession(null);
  };

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

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-secondary-container selection:text-on-secondary-container relative overflow-x-hidden min-h-screen">
      {/* Heavy SVG grain and animations removed for 60fps performance */}
      <div className="mesh-gradient-optimized"></div>

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-6">
          <div className="flex items-center gap-3">
            <Hexagon className="w-8 h-8 text-primary" fill="currentColor" />
            <span className="font-display text-headline-md font-bold text-primary tracking-tight">AetherPDF</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors font-medium" href="#home">Home</a>
            <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors font-medium" href="#features">Features</a>
            <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors font-medium" href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <label className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all cursor-pointer">
              Upload PDF
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Recovery Modal */}
          {savedSession && !isLoading && (
            <div className="max-w-2xl mx-auto mb-8 p-6 rounded-2xl bg-white border border-primary/20 shadow-xl shadow-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-up">
              <div className="text-left">
                <h3 className="font-headline-md text-primary mb-1">Restore previous session?</h3>
                <p className="text-sm text-on-surface-variant">We found an unsaved document from {new Date(savedSession.timestamp).toLocaleTimeString()}.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDiscardSession} className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors">
                  Start Fresh
                </button>
                <button onClick={handleRestoreSession} className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-lg shadow-md hover:bg-primary-container transition-colors">
                  Restore
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="max-w-3xl mx-auto h-72 rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-outline-variant flex flex-col items-center justify-center gap-4 shadow-xl">
              <Loader2 size={48} className="text-primary animate-spin" />
              <h4 className="font-headline-md text-primary">Processing PDF Document...</h4>
              <p className="text-sm text-on-surface-variant">Engineering native text boundaries.</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-display md:text-[72px] mb-6 animate-fade-up">
                Edit Any PDF. <span className="text-primary">Instantly.</span>
              </h1>
              <p className="font-body-lg text-on-surface-variant mb-12 max-w-2xl mx-auto animate-fade-up stagger-1">
                Professional PDF editing for free. No signup, no login, just precision tools designed for high-stakes productivity.
              </p>

              {/* Drag and Drop Zone */}
              <div 
                className="max-w-3xl mx-auto group animate-fade-up stagger-2"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`border-2 border-dashed rounded-[2.5rem] p-16 transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isDragOver ? 'border-primary bg-primary/5 scale-[1.01] shadow-2xl shadow-primary/10' : 'border-outline-variant bg-surface-container-lowest/60 hover:border-primary shadow-2xl shadow-primary/5'
                }`}>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <input type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner">
                      <FileText className="text-primary w-12 h-12" />
                    </div>
                    <h3 className="font-headline-md text-primary mb-2">Drop your PDF here</h3>
                    <p className="font-body-sm text-on-surface-variant">or click to browse your files</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <span className="text-secondary font-label-sm uppercase tracking-widest mb-4 block">Precision Toolkit</span>
              <h2 className="font-display text-headline-lg">Engineered for total document control.</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="reveal p-10 bg-gradient-to-br from-white to-surface-container-lowest backdrop-blur-xl border border-outline-variant/40 rounded-[2.5rem] flex flex-col justify-between h-80 group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(42,20,180,0.3)] hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform duration-500 group-hover:scale-150"></div>
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/30 relative z-10">
                <Type className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="relative z-10 mt-auto">
                <h4 className="font-headline-md text-[28px] font-bold mb-3 text-on-surface group-hover:text-primary transition-colors">Edit Text</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">Modify text directly within the PDF. We automatically match your original font, size, and styling.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="reveal p-10 bg-gradient-to-br from-white to-surface-container-lowest backdrop-blur-xl border border-outline-variant/40 rounded-[2.5rem] flex flex-col justify-between h-80 group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(129,39,207,0.3)] hover:border-secondary/50 transition-all duration-500 relative overflow-hidden" style={{ transitionDelay: '100ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full transition-transform duration-500 group-hover:scale-150"></div>
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-secondary/30 relative z-10">
                <ImageIcon className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="relative z-10 mt-auto">
                <h4 className="font-headline-md text-[28px] font-bold mb-3 text-on-surface group-hover:text-secondary transition-colors">Edit Images</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">Replace, resize, or reposition images flawlessly without ever losing layout quality or breaking margins.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="reveal p-10 bg-gradient-to-br from-white to-surface-container-lowest backdrop-blur-xl border border-outline-variant/40 rounded-[2.5rem] flex flex-col justify-between h-80 group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(42,20,180,0.3)] hover:border-primary/50 transition-all duration-500 relative overflow-hidden" style={{ transitionDelay: '200ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform duration-500 group-hover:scale-150"></div>
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/30 relative z-10">
                <PenTool className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="relative z-10 mt-auto">
                <h4 className="font-headline-md text-[28px] font-bold mb-3 text-on-surface group-hover:text-primary transition-colors">Sign PDFs</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">Create professional e-signatures. Upload your own, or choose from our extensive premium cursive library.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Removed Before/After Slider due to broken/inconsistent images */}

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 relative z-10 bg-surface-container-lowest/50 border-t border-outline-variant/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-[48px] font-bold text-on-surface mb-6 tracking-tight">Frequently Asked Questions</h2>
            <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Everything you need to know about AetherPDF's capabilities, security, and privacy.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { q: 'Is it truly 100% free?', a: 'Yes. AetherPDF provides its core engineering engine completely for free. There are no daily limits, no hidden paywalls, and absolutely no watermarks on your exported PDFs.' },
              { q: 'How secure are my highly sensitive files?', a: 'Military-grade secure. All document processing happens entirely locally within your browser\'s memory. Your files are NEVER uploaded to any external server. Once you close the tab, your data is gone forever.' },
              { q: 'Do I need to create an account or provide my email?', a: 'No registration, no emails, no hassle. We strongly value your privacy and time; you can simply drag and drop your file to start editing immediately.' },
              { q: 'Can I edit the actual original text, or is it just an overlay?', a: 'AetherPDF uses advanced layout parsing to actually extract and modify the native text elements inside your document, perfectly matching the original font sizes and styles.' },
            ].map((faq, i) => (
              <div 
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`rounded-3xl p-8 transition-all duration-300 cursor-pointer border ${
                  openFaq === i 
                    ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.02]' 
                    : 'bg-white hover:bg-surface-container-lowest border-outline-variant/30 hover:border-primary/40 hover:shadow-xl'
                }`}
              >
                <div className="flex justify-between items-center gap-6">
                  <h6 className={`text-xl md:text-2xl font-semibold leading-tight ${openFaq === i ? 'text-white' : 'text-on-surface'}`}>
                    {faq.q}
                  </h6>
                  <div className={`p-2 rounded-full transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'bg-white/20 rotate-180' : 'bg-surface-container'}`}>
                    <ChevronDown className={`w-6 h-6 ${openFaq === i ? 'text-white' : 'text-primary'}`} />
                  </div>
                </div>
                {openFaq === i && (
                  <p className="text-lg mt-6 leading-relaxed opacity-90 animate-fade-up">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-on-background text-white py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-headline-md text-white font-bold">AetherPDF</span>
            </div>
            <p className="font-body-sm text-outline-variant/60 max-w-sm text-center md:text-left">
              Precision engineering for digital documents. Built for the modern professional.
            </p>
          </div>
          <div className="text-outline-variant/40 font-body-sm">
            © 2026 AetherPDF.
          </div>
        </div>
      </footer>
    </div>
  );
}
