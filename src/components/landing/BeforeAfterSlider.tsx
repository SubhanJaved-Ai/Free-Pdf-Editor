'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UnfoldHorizontal, Sparkles, CheckCircle2, FileCheck, Edit3 } from 'lucide-react';

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
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={13} strokeWidth={2} /> Interactive Showcase
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          The Transformation
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mt-1">
          Drag the slider to compare raw PDF output with AetherPDF precision editing.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[300px] md:h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white select-none cursor-ew-resize group"
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
        {/* AFTER Side (Edited PDF) */}
        <div className="absolute inset-0 bg-slate-50 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <FileCheck size={13} strokeWidth={2} /> EDITED WITH AETHERPDF
            </div>
            <span className="text-xs font-medium text-slate-400">Vector Output</span>
          </div>

          <div className="w-full max-w-lg mx-auto bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-3 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">PDF</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Executive_Summary_2026.pdf</h4>
                  <p className="text-[10px] text-emerald-600 font-medium">Original Font Matched • Digitally Signed</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">Ready</span>
            </div>
            
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">1. Key Financial Milestones</p>
              <div className="h-2 bg-indigo-100 rounded-full w-3/4"></div>
              <div className="h-2 bg-slate-100 rounded-full w-full"></div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1 text-indigo-600 font-medium"><Edit3 size={11} strokeWidth={2} /> Replaced Text & Signature</span>
              <span>100% Vector Quality</span>
            </div>
          </div>

          <div className="flex justify-end">
            <span className="text-[11px] text-slate-400">Watermark-free layout</span>
          </div>
        </div>

        {/* BEFORE Side (Raw PDF) */}
        <div 
          className="absolute inset-0 bg-slate-200/60 p-6 md:p-8 flex flex-col justify-between border-r border-indigo-500 overflow-hidden transition-all duration-75"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="w-[800px] md:w-[1000px] flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-300 text-slate-700 text-xs font-semibold">
                RAW UNEDITED PDF
              </div>
            </div>

            <div className="w-full max-w-lg bg-white/70 rounded-xl p-5 shadow-none border border-slate-300 space-y-3 my-auto filter grayscale opacity-75">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">PDF</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Scan_Document_Draft.pdf</h4>
                    <p className="text-[10px] text-slate-500">Read-Only Static File</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold">Locked</span>
              </div>
              
              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-600">1. Draft Financial Notes [Typo]</p>
                <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                <div className="h-2 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Static document format</span>
            </div>
          </div>
        </div>

        {/* Divider Handle */}
        <div 
          className="slider-handle"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white pointer-events-none">
            <UnfoldHorizontal size={15} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
