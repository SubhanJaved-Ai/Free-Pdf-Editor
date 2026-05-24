'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorPage } from './EditorPage';
import { Sparkles, Maximize2, Move, ZoomIn, ZoomOut, Lock, Unlock, GripHorizontal, Settings2 } from 'lucide-react';
import { runOcrOnPage } from '../../utils/ocrWorker';

const DraggableZoomWidget = () => {
  const {
    zoom, setZoom,
    zoomPanelPos, setZoomPanelPos,
    zoomPanelLocked, setZoomPanelLocked,
    zoomPanelSize, setZoomPanelSize
  } = useEditorStore();

  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initLeft: 0, initTop: 0 });
  const [pos, setPos] = useState<{left: number, top: number} | null>(null);

  // Sync with global store on mount
  useEffect(() => {
    if (zoomPanelPos) {
      setPos({ left: zoomPanelPos.x, top: zoomPanelPos.y });
    }
  }, [zoomPanelPos]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      let newL = dragRef.current.initLeft + dx;
      let newT = dragRef.current.initTop + dy;
      
      // Constrain to viewport bounds
      if (widgetRef.current) {
         const rect = widgetRef.current.getBoundingClientRect();
         if (newL < 0) newL = 0;
         if (newT < 0) newT = 0;
         if (newL + rect.width > window.innerWidth) newL = window.innerWidth - rect.width;
         if (newT + rect.height > window.innerHeight) newT = window.innerHeight - rect.height;
      }
      
      setPos({ left: newL, top: newT });
    };

    const handleUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        setPos((currentPos) => {
          if (currentPos) {
            setZoomPanelPos({ x: currentPos.left, y: currentPos.top });
          }
          return currentPos;
        });
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [setZoomPanelPos]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoomPanelLocked) return;
    if ((e.target as HTMLElement).closest('button')) return;

    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initLeft: rect.left,
        initTop: rect.top
      };
    }
  };

  const isPos = pos !== null;
  const defaultBottom = typeof window !== 'undefined' && window.innerWidth <= 768 ? '90px' : '24px';
  const style = isPos ? { left: pos.left, top: pos.top, right: 'auto', bottom: 'auto' } : { bottom: defaultBottom, right: '24px' };
  
  const sizeMap = {
    sm: { scale: 'scale-90', icon: 14, pad: 'p-0.5' },
    md: { scale: 'scale-100', icon: 16, pad: 'p-1' },
    lg: { scale: 'scale-110', icon: 18, pad: 'p-1.5' }
  };
  const sm = sizeMap[zoomPanelSize];

  return (
    <div 
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      style={style}
      className={`fixed z-50 flex items-center gap-1 ${sm.pad} rounded-xl bg-surface/95 backdrop-blur-md border border-outline-variant/40 shadow-xl ${zoomPanelLocked ? '' : 'cursor-grab active:cursor-grabbing hover:ring-2 ring-primary/50'} transition-transform origin-bottom-right ${sm.scale}`}
    >
      {!zoomPanelLocked && (
        <div className="flex items-center text-outline cursor-grab p-1" title="Drag to move">
          <GripHorizontal size={14} />
        </div>
      )}
      <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))} title="Zoom Out" className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition">
        <ZoomOut size={sm.icon} />
      </button>
      <div onClick={() => setZoom(1)} title="Reset Zoom" className="w-16 text-center select-none cursor-pointer hover:bg-surface-container-high rounded px-1 py-1 transition">
        <span className="text-xs font-bold text-on-surface">{Math.round(zoom * 100)}%</span>
      </div>
      <button onClick={() => setZoom(z => Math.min(z + 0.1, 4.0))} title="Zoom In" className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition">
        <ZoomIn size={sm.icon} />
      </button>
      <div className="w-[1px] h-6 bg-outline-variant/30 mx-1"></div>
      <button 
        onClick={() => setZoomPanelSize(zoomPanelSize === 'sm' ? 'md' : zoomPanelSize === 'md' ? 'lg' : 'sm')} 
        title="Toggle Panel Size" 
        className="p-2 rounded-lg text-on-surface-variant hover:text-primary transition"
      >
        <Settings2 size={14} />
      </button>
      <button 
        onClick={() => setZoomPanelLocked(!zoomPanelLocked)} 
        title={zoomPanelLocked ? 'Unlock Position' : 'Lock Position'} 
        className={`p-2 rounded-lg transition ${zoomPanelLocked ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'}`}
      >
        {zoomPanelLocked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
    </div>
  );
};

interface CanvasProps {
  pdfDoc: any; // PDF.js doc instance
}

export const Canvas: React.FC<CanvasProps> = ({ pdfDoc }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pagesStackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const {
    pageOrders,
    currentPageIndex,
    setCurrentPageIndex,
    zoom,
    setZoom,
    activeTool,
    setActiveTool,
    selectedElementIds,
    setSelectedElementIds,
    deleteElement,
    elements,
    undo,
    redo,
    isOcrRunning,
    setOcrState,
    pageDimensions
  } = useEditorStore();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Setup Keyboard Shortcuts (Figma/Adobe Standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if typing inside an active textbox / inputs
      const isTyping = document.activeElement?.tagName === 'INPUT' || 
                       document.activeElement?.tagName === 'TEXTAREA' ||
                       document.activeElement?.getAttribute('contenteditable') === 'true';
      
      if (isTyping) return;

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
      
      // Delete selected elements
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          selectedElementIds.forEach(id => deleteElement(id));
        }
      }

      // Spacebar toggling pan
      else if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        setActiveTool('select'); // fallback to select
      }

      // Zoom triggers
      else if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(z + 0.1, 4.0));
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(z - 0.1, 0.1));
      }

      // Enter key to edit selected text element
      else if (e.key === 'Enter' && selectedElementIds.length === 1) {
        const currentElements = useEditorStore.getState().elements;
        const el = currentElements.find(item => item.id === selectedElementIds[0]);
        if (el && el.type === 'text') {
          e.preventDefault();
          useEditorStore.getState().setActiveElementId(el.id);
        }
      }

      // Arrow keys to nudge selected elements (Figma style)
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElementIds.length > 0) {
        e.preventDefault();
        const currentElements = useEditorStore.getState().elements;
        const nudgeAmount = e.shiftKey ? 10 : 1; // 10px or 1px nudge
        
        selectedElementIds.forEach(id => {
          const el = currentElements.find(item => item.id === id);
          if (!el) return;
          const pageDim = pageDimensions[el.pageIndex] || { width: 595, height: 842 };
          const dx = (nudgeAmount / pageDim.width) * 100;
          const dy = (nudgeAmount / pageDim.height) * 100;
          
          let newX = el.x;
          let newY = el.y;
          
          if (e.key === 'ArrowUp') newY -= dy;
          if (e.key === 'ArrowDown') newY += dy;
          if (e.key === 'ArrowLeft') newX -= dx;
          if (e.key === 'ArrowRight') newX += dx;
          
          useEditorStore.getState().updateElement(id, {
            x: Math.min(Math.max(newX, 0), 100 - el.width),
            y: Math.min(Math.max(newY, 0), 100 - el.height)
          });
        });
        
        // Push nudge end snapshot to history
        useEditorStore.setState(state => ({
          past: [...state.past, currentElements],
          future: []
        }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementIds, deleteElement, undo, redo, setZoom, isSpacePressed, setActiveTool, pageDimensions]);

  // Ctrl+Mousewheel zoom (native listener for passive:false to preventDefault browser zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z: number) => Math.min(Math.max(z + delta, 0.25), 4.0));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // Handle Spacebar or Pan tool panning interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSpacePressed || activeTool === 'pan' || (activeTool === 'select' && e.button === 1)) {
      setIsPanning(true);
      if (containerRef.current) {
        setPanStart({ 
          x: e.clientX, 
          y: e.clientY, 
          scrollLeft: containerRef.current.scrollLeft, 
          scrollTop: containerRef.current.scrollTop 
        });
      }
    }
  };

  // Setup window event listeners for panning to ensure stability outside container
  useEffect(() => {
    if (!isPanning) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        if (containerRef.current) {
          // Native scrolling replaces CSS transforms
          containerRef.current.scrollLeft = panStart.scrollLeft - deltaX;
          containerRef.current.scrollTop = panStart.scrollTop - deltaY;
        }
      });
    };

    const handleWindowPointerUp = () => {
      setIsPanning(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPanning, panStart]);

  // Run AI OCR on current page
  const handleOcrActivePage = async () => {
    const pageIdx = currentPageIndex;
    const dims = pageDimensions[pageIdx];
    if (!dims) return;
    
    // Find rendered canvas matching active index
    const pageCanvases = document.querySelectorAll('canvas');
    let targetCanvas: HTMLCanvasElement | null = null;
    
    // PDFJS rendered page index maps to canvas search
    // We locate the canvas currently visible on the active page block
    // Alternatively, we can find by index or let Tesseract read directly
    if (pageCanvases.length > 0) {
      // Find canvas belonging to currentPageIndex (which is pageIndex)
      targetCanvas = pageCanvases[pageIdx] as HTMLCanvasElement;
    }
    
    if (!targetCanvas) {
      alert("Failed to capture active page rendering. Make sure the document is loaded.");
      return;
    }

    setOcrState(true, 0.1, pageIdx);
    
    try {
      const result = await runOcrOnPage(
        targetCanvas,
        pageIdx,
        dims.width,
        dims.height,
        (progress) => setOcrState(true, progress, pageIdx)
      );

      // Inject OCR text layers into editor elements
      if (result && result.elements && Array.isArray(result.elements) && result.elements.length > 0) {
        result.elements.forEach((el) => {
          // Add OCR-extracted editable overlay elements directly to Zustand store
          useEditorStore.setState((state) => ({
            elements: [...state.elements, el]
          }));
        });
        
        // Record undo snapshot
        const { elements: els } = useEditorStore.getState();
        useEditorStore.setState((state) => ({
          past: [...state.past, els],
          future: []
        }));

        alert(`OCR complete! Automatically converted ${result.elements.length} scanned text rows into editable elements.`);
      } else {
        alert("OCR did not detect any readable text on this page.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`OCR failed: ${err.message}`);
    } finally {
      setOcrState(false, 0, null);
    }
  };

  const currentVisualPageNumber = pageOrders.indexOf(currentPageIndex) + 1;

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`flex-1 h-[calc(100vh-4rem)] overflow-auto canvas-grid-bg relative flex flex-col items-center focus:outline-none touch-none ${
        isPanning ? 'cursor-grabbing' : (isSpacePressed || activeTool === 'pan') ? 'cursor-grab' : 'cursor-default'
      }`}
      tabIndex={0}
    >


      {/* Pages Vertical Layout Stack */}
      <div 
        ref={pagesStackRef}
        className="py-12 flex flex-col items-center gap-8 relative"
      >
        {pageOrders.map((pageIdx, visualIdx) => (
          <div 
            key={`${pageIdx}-${visualIdx}`}
            className={`transition-colors duration-200 border-2 rounded-lg ${
              currentPageIndex === pageIdx ? 'border-veltis-indigo/60 shadow-2xl shadow-veltis-indigo/5' : 'border-transparent'
            }`}
            onClick={() => setCurrentPageIndex(pageIdx)}
          >
            <EditorPage 
              pageIndex={pageIdx} 
              pdfDoc={pdfDoc} 
            />
          </div>
        ))}
      </div>

      {/* Floating Zoom Widget */}
      <DraggableZoomWidget />
    </div>
  );
};
export default Canvas;
