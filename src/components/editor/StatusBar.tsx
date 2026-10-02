'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
  Check
} from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const {
    currentPageIndex,
    pageOrders,
    scrollToPageIndex,
    zoom,
    setZoom,
    pageDimensions,
    fileName
  } = useEditorStore();

  const totalPages = pageOrders.length || 1;
  const currentVisualPage = pageOrders.indexOf(currentPageIndex) + 1 || 1;

  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputVal, setPageInputVal] = useState(String(currentVisualPage));
  const pageInputRef = useRef<HTMLInputElement>(null);

  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageInputVal(String(currentVisualPage));
  }, [currentVisualPage]);

  useEffect(() => {
    if (isEditingPage && pageInputRef.current) {
      pageInputRef.current.focus();
      pageInputRef.current.select();
    }
  }, [isEditingPage]);

  // Click outside to close zoom dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsZoomDropdownOpen(false);
      }
    };
    if (isZoomDropdownOpen) {
      window.addEventListener('mousedown', handleClickOutside);
      return () => window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isZoomDropdownOpen]);

  const handlePageSubmit = () => {
    setIsEditingPage(false);
    const parsed = parseInt(pageInputVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      const targetPageIndex = pageOrders[parsed - 1];
      scrollToPageIndex(targetPageIndex);
    } else {
      setPageInputVal(String(currentVisualPage));
    }
  };

  const handlePrevPage = () => {
    const currentIdx = pageOrders.indexOf(currentPageIndex);
    if (currentIdx > 0) {
      scrollToPageIndex(pageOrders[currentIdx - 1]);
    }
  };

  const handleNextPage = () => {
    const currentIdx = pageOrders.indexOf(currentPageIndex);
    if (currentIdx < pageOrders.length - 1) {
      scrollToPageIndex(pageOrders[currentIdx + 1]);
    }
  };

  const handleFitWidth = () => {
    // Standard fit width zoom based on common viewport width
    if (typeof window !== 'undefined') {
      const mainWidth = window.innerWidth - 650; // account for sidebars
      const currentDims = pageDimensions[currentPageIndex] || { width: 595, height: 842 };
      if (mainWidth > 300 && currentDims.width > 0) {
        const calculatedZoom = Math.min(2.5, Math.max(0.4, (mainWidth - 60) / currentDims.width));
        setZoom(Number(calculatedZoom.toFixed(2)));
        return;
      }
    }
    setZoom(1.2);
  };

  const handleFitPage = () => {
    if (typeof window !== 'undefined') {
      const mainHeight = window.innerHeight - 150; // account for header & footer
      const currentDims = pageDimensions[currentPageIndex] || { width: 595, height: 842 };
      if (mainHeight > 300 && currentDims.height > 0) {
        const calculatedZoom = Math.min(2.0, Math.max(0.3, (mainHeight - 40) / currentDims.height));
        setZoom(Number(calculatedZoom.toFixed(2)));
        return;
      }
    }
    setZoom(0.85);
  };

  const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
  const currentDims = pageDimensions[currentPageIndex] || pageDimensions[0] || { width: 595, height: 842 };

  return (
    <footer
      className={`h-9 w-full bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 flex items-center justify-between px-3 text-xs select-none z-40 flex-shrink-0 ${className}`}
      aria-label="Editor status bar"
    >
      {/* LEFT ZONE: Page Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentVisualPage <= 1}
          className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-on-surface">
          <span className="text-[11px] text-on-surface-variant font-medium">Page</span>
          {isEditingPage ? (
            <input
              ref={pageInputRef}
              type="text"
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              onBlur={handlePageSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePageSubmit();
                if (e.key === 'Escape') {
                  setPageInputVal(String(currentVisualPage));
                  setIsEditingPage(false);
                }
              }}
              className="w-8 text-center text-xs font-bold bg-surface-container border border-primary rounded px-0.5 py-0 text-on-surface focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingPage(true)}
              className="px-1.5 py-0.5 rounded hover:bg-surface-container font-bold text-xs text-primary transition-colors"
              title="Click to jump to page"
            >
              {currentVisualPage}
            </button>
          )}
          <span className="text-[11px] text-on-surface-variant/70">of {totalPages}</span>
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentVisualPage >= totalPages}
          className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* CENTER ZONE: Zoom and View Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-surface-container/60 p-0.5 rounded-lg border border-outline-variant/20">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
            className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Zoom Out (Ctrl+-)"
            aria-label="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>

          {/* Zoom Percentage Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-on-surface hover:bg-surface-container-high transition-colors min-w-[50px] text-center"
              title="Change zoom level"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Presets popover menu */}
            {isZoomDropdownOpen && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-28 bg-surface rounded-xl shadow-xl border border-outline-variant/30 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {ZOOM_PRESETS.map((preset) => {
                  const isCurrent = Math.abs(zoom - preset) < 0.05;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setZoom(preset);
                        setIsZoomDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1 text-left text-xs font-mono flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <span>{Math.round(preset * 100)}%</span>
                      {isCurrent && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4.0, Number((z + 0.1).toFixed(2))))}
            className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Zoom In (Ctrl++)"
            aria-label="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Fit Width / Fit Page Quick Buttons */}
        <div className="hidden sm:flex items-center gap-1 border-l border-outline-variant/30 pl-2">
          <button
            type="button"
            onClick={handleFitWidth}
            className="px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Fit Width"
          >
            Fit Width
          </button>
          <button
            type="button"
            onClick={handleFitPage}
            className="px-2 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Fit Page"
          >
            Fit Page
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.0)}
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-on-surface-variant/70 hover:text-primary hover:bg-surface-container transition-colors"
            title="Reset Zoom to 100%"
          >
            100%
          </button>
        </div>
      </div>

      {/* RIGHT ZONE: Document Metadata Info */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-on-surface-variant/70 font-medium">
        <div className="flex items-center gap-1.5">
          <FileText size={12} className="text-primary/70" />
          <span className="truncate max-w-[140px]" title={fileName || 'Document'}>
            {fileName || 'Document.pdf'}
          </span>
        </div>
        <span className="text-outline-variant/40">•</span>
        <span className="font-mono text-[10px]">
          {Math.round(currentDims.width)} × {Math.round(currentDims.height)} pt
        </span>
      </div>
    </footer>
  );
};

export default StatusBar;
