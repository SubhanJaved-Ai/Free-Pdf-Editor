'use client';

import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Plus, Trash2, Copy, Layers, ArrowUp, ArrowDown, X, FileText } from 'lucide-react';
import { CreatorBranding } from '../common/CreatorBranding';

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
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Layers size={15} /></div>
          <h2 className="text-[11px] font-bold text-on-surface tracking-wide">Pages</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant">
            {pageOrders.length}
          </span>
        </div>
        {isMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(null)}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
            aria-label="Close panel"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
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
            <React.Fragment key={`${pageIdx}-${visualIdx}`}>
              {/* Insert-between strip — hover-only, appears between pages */}
              {visualIdx > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleInsertBlank(e, pageOrders[visualIdx - 1])}
                  className="group/insert w-full h-4 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity -my-1 z-10 relative cursor-pointer"
                  title="Insert blank page here"
                >
                  <div className="flex-1 h-px bg-primary/40 group-hover/insert:bg-primary transition-colors" />
                  <div className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[8px] font-bold flex items-center gap-0.5 flex-shrink-0 shadow-sm">
                    <Plus size={8} /> Insert
                  </div>
                  <div className="flex-1 h-px bg-primary/40 group-hover/insert:bg-primary transition-colors" />
                </button>
              )}

              <div
                onClick={() => scrollToPageIndex(pageIdx)}
                className={`group flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-md ring-2 ring-primary/40'
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
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    <FileText size={12} className={isSelected ? 'text-primary' : 'text-on-surface-variant/50'} />
                    Page {visualIdx + 1}
                  </span>
                  <span className="text-[9px] font-mono text-on-surface-variant/60">
                    {Math.round(dims.width)} × {Math.round(dims.height)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Append blank page at end */}
        <button
          type="button"
          onClick={(e) => handleInsertBlank(e, pageOrders[pageOrders.length - 1])}
          className="w-full mt-1 py-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-surface-container/60 hover:bg-primary/8 border border-dashed border-outline-variant/50 hover:border-primary/50 text-[11px] font-bold text-on-surface-variant hover:text-primary transition-all active:scale-98"
        >
          <Plus size={13} className="text-primary" />
          Add Blank Page
        </button>

        {/* Creator Attribution */}
        <div className="pt-4 pb-2 flex justify-center border-t border-outline-variant/20 mt-3">
          <CreatorBranding variant="toolbar" />
        </div>
      </div>
    </aside>
  );
};

export default SidebarLeft;
