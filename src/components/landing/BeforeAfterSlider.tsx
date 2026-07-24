'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UnfoldHorizontal, Sparkles, CheckCircle2, Shield, Edit3, FileCheck } from 'lucide-react';

export function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  return (
    <div className="w-full max-w-5xl mx-auto my-16">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles size={13} /> Interactive Showcase
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
          The Aether Transformation
        </h2>
        <p className="text-on-surface-variant text-base max-w-xl mx-auto mt-2">
          Drag the slider to compare raw unedited PDF output with AetherPDF precision editing.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[320px] md:h-[420px] rounded-3xl overflow-hidden border border-outline-variant/60 shadow-2xl bg-surface select-none cursor-ew-resize group"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
      >
        {/* AFTER Side (Edited PDF) - Full Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low via-surface to-surface-container p-6 md:p-10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold">
              <FileCheck size={14} /> EDITED WITH AETHERPDF
            </div>
            <span className="text-xs font-medium text-outline">High-Resolution Export</span>
          </div>

          {/* Sample Document Graphic Mockup */}
          <div className="w-full max-w-xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-primary/10 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">PDF</div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Executive_Summary_2026.pdf</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">Original Font Matched • Digitally Signed</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-semibold">Ready to Share</span>
            </div>
            
            <div className="space-y-2 text-xs text-on-surface-variant">
              <p className="font-medium text-on-surface">1. Key Financial Milestones</p>
              <div className="h-2.5 bg-primary/10 rounded-full w-3/4"></div>
              <div className="h-2.5 bg-surface-container-high rounded-full w-full"></div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1 text-primary font-medium"><Edit3 size={12} /> Replaced Text & Signature</span>
              <span className="text-outline">100% Crisp Vector</span>
            </div>
          </div>

          <div className="flex justify-end">
            <span className="text-xs text-on-surface-variant/70 font-medium">Clean, watermark-free layout</span>
          </div>
        </div>

        {/* BEFORE Side (Raw PDF) - Clipped Overlay */}
        <div 
          className="absolute inset-0 bg-slate-100 p-6 md:p-10 flex flex-col justify-between border-r border-primary/40 overflow-hidden transition-all duration-75"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="w-[1000px] md:w-[1200px] flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                RAW UNEDITED PDF
              </div>
            </div>

            {/* Unedited Document Mockup */}
            <div className="w-full max-w-xl bg-white/80 rounded-2xl p-6 shadow border border-slate-300 space-y-4 my-auto filter grayscale opacity-75">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">PDF</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Scan_Document_Draft.pdf</h4>
                    <p className="text-[11px] text-slate-500">Read-Only Static Document</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-[11px] font-semibold">Uneditable</span>
              </div>
              
              <div className="space-y-2 text-xs text-slate-400">
                <p className="font-medium text-slate-600">1. Draft Financial Notes [Typo Here]</p>
                <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                <div className="h-2 bg-slate-200 rounded w-5/6"></div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Fixed raster text</span>
                <span>Missing Signature</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium">Standard locked file format</span>
            </div>
          </div>
        </div>

        {/* Divider Handle */}
        <div 
          className="slider-handle group-hover:scale-105 transition-transform"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-xl border-2 border-white pointer-events-none">
            <UnfoldHorizontal size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
