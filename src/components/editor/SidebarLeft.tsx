'use client';

import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Plus, Trash2, Copy, Layers, ArrowUp, ArrowDown, X, FileText } from 'lucide-react';

interface PageThumbnailProps {
  pdfDoc: unknown;
  pageIdx: number;
}

const PageThumbnail: React.FC<PageThumbnailProps> = React.memo(({ pdfDoc, pageIdx }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let renderTask: unknown = null;
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await (pdfDoc as { getPage: (n: number) => Promise<unknown> }).getPage(pageIdx + 1);
        if (isCancelled) return;

        const viewport = (page as { getViewport: (opt: { scale: number }) => { width: number; height: number } }).getViewport({ scale: 0.3 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = (page as { render: (opt: unknown) => { promise: Promise<void>; cancel: () => void } }).render({
          canvasContext: context,
          viewport: viewport
        });
        
        await (renderTask as { promise: Promise<void> }).promise;
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering thumbnail page ${pageIdx}:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        (renderTask as { cancel: () => void }).cancel();
      }
    };
  }, [pdfDoc, pageIdx]);

  return (
    <canvas 
      ref={canvasRef} 
      className="max-w-full max-h-full object-contain select-none pointer-events-none rounded"
    />
  );
});
PageThumbnail.displayName = 'PageThumbnail';

interface SidebarLeftProps {
  pdfDoc: unknown;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ pdfDoc }) => {
  const {
    pageOrders,
    currentPageIndex,
    setCurrentPageIndex,
    scrollToPageIndex,
    duplicatePageInState,
    deletePageInState,
    insertBlankPageInState,
    pageDimensions,
    layoutMode,
    leftSidebarWidth,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useEditorStore();

  const handleDuplicate = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    duplicatePageInState(idx);
  };

  const handleDelete = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (pageOrders.length <= 1) {
      alert("Cannot delete the only page in the document.");
      return;
    }
    deletePageInState(idx);
  };

  const handleInsertBlank = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    insertBlankPageInState(idx);
  };

  const handleMoveUp = (e: React.MouseEvent, visualIndex: number) => {
    e.stopPropagation();
    if (visualIndex === 0) return;
    const newOrders = [...pageOrders];
    const temp = newOrders[visualIndex];
    newOrders[visualIndex] = newOrders[visualIndex - 1];
    newOrders[visualIndex - 1] = temp;
    useEditorStore.setState({ pageOrders: newOrders });
  };

  const handleMoveDown = (e: React.MouseEvent, visualIndex: number) => {
    e.stopPropagation();
    if (visualIndex === pageOrders.length - 1) return;
    const newOrders = [...pageOrders];
    const temp = newOrders[visualIndex];
    newOrders[visualIndex] = newOrders[visualIndex + 1];
    newOrders[visualIndex + 1] = temp;
    useEditorStore.setState({ pageOrders: newOrders });
  };

  const isMobileOpen = mobileSidebarOpen === 'left';
  const mobileClasses = isMobileOpen 
    ? 'fixed inset-y-0 left-0 z-50 shadow-2xl translate-x-0 transition-transform bg-surface' 
    : 'hidden md:flex md:relative md:translate-x-0';

  return (
    <aside 
      className={`${mobileClasses} ${
        layoutMode === 'horizontal' ? 'h-full flex-shrink-0' : 'h-[calc(100vh-4rem)]'
      } bg-surface border-r border-outline-variant/30 flex flex-col z-30 select-none max-w-full custom-scrollbar`}
      style={{ width: `${leftSidebarWidth}px` }}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between relative flex-shrink-0">
        <div className="flex items-center gap-2.5 text-on-surface">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Layers size={16} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">Pages Overview</h2>
            <p className="text-[10px] text-on-surface-variant">Reorder, duplicate & manage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
            {pageOrders.length} {pageOrders.length === 1 ? 'Page' : 'Pages'}
          </span>
          {isMobileOpen && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
              aria-label="Close panel"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Pages Thumbnails Stack */}
      <div className={`flex-1 overflow-y-auto p-4 flex ${
        layoutMode === 'horizontal' ? 'flex-row flex-wrap gap-4 content-start' : 'flex-col space-y-4'
      }`}>
        {pageOrders.map((pageIdx, visualIdx) => {
          const isSelected = currentPageIndex === pageIdx;
          const dims = pageDimensions[pageIdx] || { width: 595, height: 842 };
          const aspectRatio = dims.height / dims.width;
          const thumbnailHeight = 145 * aspectRatio;

          return (
            <div
              key={`${pageIdx}-${visualIdx}`}
              onClick={() => scrollToPageIndex(pageIdx)}
              className={`group flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative ${
                isSelected 
                  ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/30' 
                  : 'bg-surface-container-lowest/80 border-outline-variant/30 hover:border-outline-variant/60 hover:bg-surface-container-high/60 shadow-2xs'
              }`}
            >
              {/* Floating Reorder Actions */}
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                <button
                  type="button"
                  onClick={(e) => handleMoveUp(e, visualIdx)}
                  disabled={visualIdx === 0}
                  className="p-1 rounded-lg bg-surface/90 border border-outline-variant/40 text-on-surface-variant hover:text-primary disabled:opacity-20 transition shadow-xs"
                  title="Move Page Up"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleMoveDown(e, visualIdx)}
                  disabled={visualIdx === pageOrders.length - 1}
                  className="p-1 rounded-lg bg-surface/90 border border-outline-variant/40 text-on-surface-variant hover:text-primary disabled:opacity-20 transition shadow-xs"
                  title="Move Page Down"
                >
                  <ArrowDown size={12} />
                </button>
              </div>

              {/* Floating Quick Operations */}
              <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                <button
                  type="button"
                  onClick={(e) => handleDuplicate(e, pageIdx)}
                  className="p-1.5 rounded-lg bg-surface/90 border border-outline-variant/40 text-on-surface-variant hover:text-primary transition shadow-xs"
                  title="Duplicate Page"
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, pageIdx)}
                  className="p-1.5 rounded-lg bg-surface/90 border border-outline-variant/40 text-on-surface-variant hover:text-error transition shadow-xs"
                  title="Delete Page"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Thumbnail Container */}
              <div 
                className={`${layoutMode === 'horizontal' ? 'w-28' : 'w-44'} overflow-hidden rounded-xl bg-white border border-outline-variant/40 flex items-center justify-center relative shadow-xs group-hover:shadow-sm transition-shadow`}
                style={{ height: `${layoutMode === 'horizontal' ? thumbnailHeight * 0.66 : thumbnailHeight}px` }}
              >
                <PageThumbnail pdfDoc={pdfDoc} pageIdx={pageIdx} />
              </div>

              {/* Page Label & Dimensions */}
              <div className="w-full flex items-center justify-between mt-2.5 px-1">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <FileText size={13} className={isSelected ? 'text-primary' : 'text-on-surface-variant/60'} />
                  Page {visualIdx + 1}
                </span>
                <span className="text-[9px] font-mono text-on-surface-variant/70">
                  {Math.round(dims.width)} × {Math.round(dims.height)}
                </span>
              </div>

              {/* Insert Blank Page Trigger */}
              <button
                type="button"
                onClick={(e) => handleInsertBlank(e, pageIdx)}
                className="w-full mt-2.5 py-1.5 flex items-center justify-center gap-1 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[10px] font-bold text-on-surface-variant hover:text-on-surface active:scale-98 transition-all"
              >
                <Plus size={12} className="text-primary" />
                <span>Add Blank Page</span>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default SidebarLeft;
