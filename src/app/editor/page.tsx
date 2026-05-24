'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../../store/useEditorStore';
import { ToolbarTop } from '../../components/editor/ToolbarTop';
import { SidebarLeft } from '../../components/editor/SidebarLeft';
import { SidebarRight } from '../../components/editor/SidebarRight';
import { Canvas } from '../../components/editor/Canvas';
import { exportEditedPdf } from '../../utils/pdfExporter';
import { parsePdfLayout } from '../../utils/pdfParser';
import { useAutoSave, checkAutoSave, clearAutoSave, manualSave, AutoSaveData } from '../../hooks/useAutoSave';
import { SessionRecoveryModal } from '../../components/editor/SessionRecoveryModal';
import { 
  Sparkles, 
  PenTool, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  Type, 
  Image as ImageIcon,
  Check
} from 'lucide-react';

function cloneUint8Array(arr: Uint8Array): Uint8Array {
  const clone = new Uint8Array(arr.length);
  clone.set(arr);
  return clone;
}

export default function EditorPage() {
  const router = useRouter();
  const {
    pdfUrl,
    pdfBytes,
    fileName,
    elements,
    pageOrders,
    pageDimensions,
    setPdf,
    signatures,
    addSignature,
    layoutMode,
    leftSidebarWidth,
    setLeftSidebarWidth,
    rightSidebarWidth,
    setRightSidebarWidth,
    bottomDockHeight,
    setBottomDockHeight,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useEditorStore();

  const [pdfDocInstance, setPdfDocInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<AutoSaveData | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  // Mount the auto-save loop
  useAutoSave();
  
  // Signature creation state
  const [sigTab, setSigTab] = useState<'draw' | 'type'>('draw');
  const [sigTypeWords, setSigTypeWords] = useState('');
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);

  // Redirect to landing if no PDF uploaded, or check for auto-save recovery
  const dragRef = useRef<{ isDragging: boolean; target: 'left' | 'right' | 'bottom' | null; startVal: number; startCoord: number }>({
    isDragging: false,
    target: null,
    startVal: 0,
    startCoord: 0
  });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      const { target, startVal, startCoord } = dragRef.current;
      
      if (target === 'left') {
        const diff = e.clientX - startCoord;
        let newVal = startVal + diff;
        if (newVal < 200) newVal = 200;
        if (newVal > window.innerWidth * 0.4) newVal = window.innerWidth * 0.4;
        setLeftSidebarWidth(newVal);
      } else if (target === 'right') {
        // Dragging right sidebar handle moves left to increase width
        const diff = startCoord - e.clientX;
        let newVal = startVal + diff;
        if (newVal < 200) newVal = 200;
        if (newVal > window.innerWidth * 0.4) newVal = window.innerWidth * 0.4;
        setRightSidebarWidth(newVal);
      } else if (target === 'bottom') {
        // Dragging bottom dock handle moves up to increase height
        const diff = startCoord - e.clientY;
        let newVal = startVal + diff;
        if (newVal < 150) newVal = 150;
        if (newVal > window.innerHeight * 0.5) newVal = window.innerHeight * 0.5;
        setBottomDockHeight(newVal);
      }
    };

    const handleUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        dragRef.current.target = null;
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [setLeftSidebarWidth, setRightSidebarWidth, setBottomDockHeight]);

  const startDrag = (target: 'left' | 'right' | 'bottom', e: React.PointerEvent) => {
    dragRef.current = {
      isDragging: true,
      target,
      startVal: target === 'left' ? leftSidebarWidth : target === 'right' ? rightSidebarWidth : bottomDockHeight,
      startCoord: target === 'bottom' ? e.clientY : e.clientX
    };
    document.body.style.cursor = target === 'bottom' ? 'row-resize' : 'col-resize';
  };

  useEffect(() => {
    async function initDocument() {
      if (pdfBytes) {
        try {
          // Load document in PDF.js
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          
          const clonedBytes = cloneUint8Array(pdfBytes);
          const loadingTask = pdfjs.getDocument({ data: clonedBytes });
          const doc = await loadingTask.promise;
          setPdfDocInstance(doc);
          
          // Hydrate layout elements if store list is empty!
          const state = useEditorStore.getState();
          if (state.elements.length === 0) {
            const parsed = await parsePdfLayout(doc);
            useEditorStore.setState({ 
              elements: parsed.elements,
              pageDimensions: parsed.pageDimensions,
              totalPages: parsed.pageDimensions.length,
              pageOrders: Array.from({ length: parsed.pageDimensions.length }, (_, i) => i)
            });
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error("Error parsing pdf bytes in editor:", err);
          setIsLoading(false);
        }
      } else {
        // No PDF in store — check for auto-save recovery
        try {
          const savedData = await checkAutoSave();
          if (savedData && savedData.pdfBytes && savedData.pdfBytes.length > 0) {
            setRecoveryData(savedData);
            setShowRecovery(true);
            setIsLoading(false);
            return; // Wait for user decision
          }
        } catch (err) {
          console.error('Recovery check failed:', err);
        }
        // No recovery data — redirect to landing
        router.push('/');
      }
    }
    initDocument();
  }, [pdfBytes, router]);

  // Render Page Miniature Thumbnails for left sidebar page reorderer
  const renderThumbnail = async (pageIndex: number, canvas: HTMLCanvasElement | null) => {
    if (!canvas || !pdfDocInstance) return;
    try {
      const page = await pdfDocInstance.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: 0.25 });
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    } catch (err) {
      console.error(`Error rendering thumbnail page ${pageIndex}:`, err);
    }
  };

  // Perform compilation and download of edited document
  const handleExportPdf = async () => {
    // Fetch latest state directly to avoid stale closures due to React hydration errors
    const currentState = useEditorStore.getState();
    const currentPdfBytes = currentState.pdfBytes;
    const currentElements = currentState.elements;
    const currentPageDimensions = currentState.pageDimensions;
    const currentPageOrders = currentState.pageOrders;
    const currentFileName = currentState.fileName;
    
    if (!currentPdfBytes || !currentPageDimensions.length) return;
    
    setIsExporting(true);
    try {
      const completedBytes = await exportEditedPdf(
        currentPdfBytes,
        currentElements,
        currentPageOrders,
        currentPageDimensions,
        {
          fileName: currentFileName || 'edited-document.pdf',
          optimizeSize: true
        }
      );
      // Trigger file download
      const blob = new Blob([completedBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = currentFileName ? `veltis_${currentFileName}` : 'veltis_document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to compile export: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await manualSave();
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  // Session recovery handler
  const handleRestoreSession = async () => {
    if (!recoveryData) return;
    setIsLoading(true);
    setShowRecovery(false);
    
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      
      const bytes = new Uint8Array(recoveryData.pdfBytes);
      const clonedBytes = cloneUint8Array(bytes);
      const loadingTask = pdfjs.getDocument({ data: clonedBytes });
      const doc = await loadingTask.promise;
      setPdfDocInstance(doc);
      
      // Restore full state
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      setPdf(url, cloneUint8Array(bytes), recoveryData.fileName || 'recovered.pdf', recoveryData.pageDimensions || []);
      
      useEditorStore.setState({
        elements: recoveryData.elements || [],
        zoom: recoveryData.zoom || 1,
        currentPageIndex: recoveryData.pageIndex || 0,
        totalPages: recoveryData.totalPages || doc.numPages,
        pageOrders: recoveryData.pageOrders || Array.from({ length: doc.numPages }, (_, i) => i),
        pageDimensions: recoveryData.pageDimensions || [],
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Session restore failed:', err);
      setIsLoading(false);
      router.push('/');
    }
  };

  const handleStartFresh = async () => {
    await clearAutoSave();
    setShowRecovery(false);
    setRecoveryData(null);
    router.push('/');
  };

  // Signature drawing canvas triggers
  const handleSigMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawingSig(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleSigMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const handleSigMouseUp = () => {
    setIsDrawingSig(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    let sigDataUrl = '';
    
    if (sigTab === 'draw') {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      sigDataUrl = canvas.toDataURL('image/png');
    } else {
      // Draw Typed Signature text onto offscreen canvas to convert to PNG
      if (!sigTypeWords.trim()) return;
      const offscreen = document.createElement('canvas');
      offscreen.width = 300;
      offscreen.height = 100;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 100);
        ctx.font = '36px cursive';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sigTypeWords, 150, 50);
        sigDataUrl = offscreen.toDataURL('image/png');
      }
    }

    if (sigDataUrl) {
      addSignature(sigDataUrl);
      setShowSignatureModal(false);
      clearSigCanvas();
      setSigTypeWords('');
      
      // Auto active signature tool
      useEditorStore.setState({ activeTool: 'signature' });
      alert("Signature captured successfully! Click anywhere on the document canvas to drop it.");
    }
  };

  const triggerUploadNewPdf = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const url = URL.createObjectURL(file);
        
        const clonedBytes = cloneUint8Array(bytes);
        const parsed = await parsePdfLayout(clonedBytes);
        setPdf(url, cloneUint8Array(bytes), file.name, parsed.pageDimensions);
        
        // Populate elements
        if (parsed.elements.length > 0) {
          useEditorStore.setState({ elements: parsed.elements });
        }

        // Debugging log for element hydration
        const state = useEditorStore.getState();
        console.log({
          elementsCount: state.elements.length,
          pageCount: state.totalPages,
          editableTextCount: state.elements.filter(e => e.type === 'text').length
        });
      }
    };
    input.click();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-on-background overflow-hidden font-sans">
      {/* Session Recovery Modal */}
      {showRecovery && recoveryData && (
        <SessionRecoveryModal
          saveData={recoveryData}
          onRestore={handleRestoreSession}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* Top Header Controls bar */}
      <ToolbarTop 
        onExport={handleExportPdf} 
        onUploadClick={triggerUploadNewPdf}
        onSaveClick={handleSaveChanges}
      />

      {/* Editor Layout Splitter */}
      <div className={`flex-1 w-full flex ${layoutMode === 'horizontal' ? 'flex-col' : ''} overflow-hidden pb-16 pt-[64px] md:pt-0 md:pb-0`}>
        {/* Top/Middle Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {layoutMode === 'vertical' && (
            <>
              {/* Mobile overlay handled inside SidebarLeft */}
              <SidebarLeft pdfDoc={pdfDocInstance} />
              
              {/* Left Sidebar Resize Handle */}
              <div 
                onPointerDown={(e) => startDrag('left', e)}
                className="hidden md:block w-1.5 h-full bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors z-50 flex-shrink-0 relative group"
              >
                <div className="absolute inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 left-0 right-0">
                  <div className="h-10 w-0.5 bg-primary/40 rounded-full"></div>
                </div>
              </div>
            </>
          )}
          
          {/* Dynamic Zooming Canvas workspace */}
          {isLoading ? (
            <div className="flex-1 h-full flex flex-col items-center justify-center gap-3 bg-surface-container-low">
              <Loader2 size={32} className="text-primary animate-spin" />
              <span className="text-sm font-bold text-outline">Loading document pages...</span>
            </div>
          ) : (
            <Canvas pdfDoc={pdfDocInstance} />
          )}

          {layoutMode === 'vertical' && (
            <>
              {/* Right Sidebar Resize Handle */}
              <div 
                onPointerDown={(e) => startDrag('right', e)}
                className="hidden md:block w-1.5 h-full bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors z-50 flex-shrink-0 relative group"
              >
                <div className="absolute inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 left-0 right-0">
                  <div className="h-10 w-0.5 bg-primary/40 rounded-full"></div>
                </div>
              </div>
              
              <SidebarRight />
            </>
          )}
        </div>

        {/* Bottom Dock (Horizontal Mode) */}
        {layoutMode === 'horizontal' && (
          <>
            {/* Bottom Dock Resize Handle */}
            <div 
              onPointerDown={(e) => startDrag('bottom', e)}
              className="hidden md:block h-1.5 w-full bg-transparent hover:bg-primary/50 cursor-row-resize transition-colors z-50 flex-shrink-0 relative group"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="w-10 h-0.5 bg-primary/40 rounded-full"></div>
              </div>
            </div>
            <div 
              className="flex-shrink-0 flex overflow-hidden border-t border-outline-variant/30 shadow-2xl z-40 bg-surface"
              style={{ height: `${bottomDockHeight}px` }}
            >
              <SidebarLeft pdfDoc={pdfDocInstance} />
              
              {/* Left Sidebar Resize Handle (Inside Horizontal Dock) */}
              <div 
                onPointerDown={(e) => startDrag('left', e)}
                className="hidden md:block w-1.5 h-full bg-transparent hover:bg-primary/50 cursor-col-resize transition-colors z-50 flex-shrink-0 relative group border-l border-outline-variant/30"
              >
                <div className="absolute inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 left-0 right-0">
                  <div className="h-6 w-0.5 bg-primary/40 rounded-full"></div>
                </div>
              </div>
              
              <SidebarRight />
            </div>
          </>
        )}
      </div>

      {/* Signature Modals Dialog overlay */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[400px] bg-surface rounded-xl p-6 shadow-2xl relative select-none border border-outline-variant/30">
            <button 
              onClick={() => setShowSignatureModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded hover:bg-surface-variant text-outline hover:text-on-surface transition"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <PenTool size={14} className="text-primary" />
              <span>Create Premium Signature</span>
            </h3>

            {/* Tab Swappers */}
            <div className="flex bg-surface-container-high border border-outline-variant/30 p-1 rounded-lg mb-4">
              <button
                onClick={() => setSigTab('draw')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                  sigTab === 'draw' ? 'bg-white text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Draw Smoothly
              </button>
              <button
                onClick={() => setSigTab('type')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                  sigTab === 'type' ? 'bg-white text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Cursive Typography
              </button>
            </div>

            {/* Content Sheets */}
            {sigTab === 'draw' ? (
              <div className="flex flex-col gap-2">
                <canvas
                  ref={sigCanvasRef}
                  width={352}
                  height={150}
                  onMouseDown={handleSigMouseDown}
                  onMouseMove={handleSigMouseMove}
                  onMouseUp={handleSigMouseUp}
                  className="bg-white border border-white/10 rounded-lg cursor-pencil"
                />
                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                  <span>Draw inside the bounding box using your pointer.</span>
                  <button onClick={clearSigCanvas} className="text-red-400 font-bold hover:underline">
                    Clear Screen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={sigTypeWords}
                  onChange={(e) => setSigTypeWords(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 text-sm p-3 rounded-lg text-white font-medium focus:outline-none focus:border-veltis-indigo"
                />
                
                {/* Cursive Live Preview */}
                {sigTypeWords.trim() && (
                  <div className="h-24 bg-white border border-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-3xl text-black select-none pointer-events-none" style={{ fontFamily: 'cursive' }}>
                      {sigTypeWords}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Save Buttons */}
            <button
              onClick={saveSignature}
              disabled={sigTab === 'type' && !sigTypeWords.trim()}
              className="w-full mt-6 py-2.5 rounded-lg bg-gradient-to-r from-veltis-violet to-veltis-cyan font-bold text-xs text-white shadow-lg shadow-veltis-indigo/20 hover:opacity-95 transition"
            >
              Save Signature
            </button>
          </div>
        </div>
      )}

      {/* Floating Signature creator shortcut removed due to overlap issues */}
      {/* Save Notification Overlay */}
      {isSaving && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant/30 shadow-lg shadow-black/5 rounded-full animate-in slide-in-from-top-4 duration-300">
          <Check size={16} className="text-primary" />
          <span className="text-sm font-medium text-on-surface">Session Saved!</span>
        </div>
      )}

      {/* Export overlay loading blocks */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm select-none">
          <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-surface border border-outline-variant/30 shadow-2xl">
            <Loader2 size={36} className="text-primary animate-spin" />
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-widest animate-pulse">
              Vector Compiling PDF...
            </h4>
            <p className="text-[10px] text-outline">Injecting shapes, drawings, and edited font vectors directly to binary.</p>
          </div>
        </div>
      )}
    </div>
  );
}
