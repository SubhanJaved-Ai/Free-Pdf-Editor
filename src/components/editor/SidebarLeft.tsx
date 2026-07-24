'use client';

import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Plus, Trash2, Copy, Layers, ArrowUp, ArrowDown, X, FileText } from 'lucide-react';

interface PageThumbnailProps {
  pdfDoc: any;
  pageIdx: number;
}

const PageThumbnail: React.FC<PageThumbnailProps> = React.memo(({ pdfDoc, pageIdx }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageIdx + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });
        
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering thumbnail page ${pageIdx}:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageIdx]);

  return (
    <canvas 
      ref={canvasRef} 
      className="max-w-full max-h-full object-contain select-none pointer-events-none"
    />
  );
});

interface SidebarLeftProps {
  pdfDoc: any;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ pdfDoc }) => {
  const {
    pageOrders,
    currentPageIndex,
    setCurrentPageIndex,
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
      className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'h-full flex-shrink-0' : 'h-[calc(100vh-4rem)]'} bg-surface border-r border-outline-variant/30 flex flex-col z-30 select-none max-w-full`}
      style={{ width: `${leftSidebarWidth}px` }}
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-outline-variant/30 flex items-center justify-between relative flex-shrink-0">
        <div className="flex items-center gap-2 text-on-surface">
          <Layers size={15} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Pages</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
            {pageOrders.length} {pageOrders.length === 1 ? 'Page' : 'Pages'}
          </span>
          {isMobileOpen && (
            <button
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
              aria-label="Close panel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Pages Thumbnails Stack */}
      <div className={`flex-1 overflow-y-auto p-3 flex ${layoutMode === 'horizontal' ? 'flex-row flex-wrap gap-3 content-start' : 'flex-col space-y-3'}`}>
        {pageOrders.map((pageIdx, visualIdx) => {
          const isSelected = currentPageIndex === pageIdx;
          const dims = pageDimensions[pageIdx] || { width: 595, height: 842 };
          const aspectRatio = dims.height / dims.width;
          const thumbnailHeight = 130 * aspectRatio;

          return (
            <div
              key={`${pageIdx}-${visualIdx}`}
              onClick={() => setCurrentPageIndex(pageIdx)}
              className={`group flex flex-col items-center p-2.5 rounded-xl border transition-all duration-150 cursor-pointer relative ${
                isSelected 
                  ? 'bg-primary/5 border-primary shadow-md ring-1 ring-primary/30' 
                  : 'bg-surface-container/60 border-outline-variant/30 hover:border-outline-variant/60 hover:bg-surface-container-high'
              }`}
            >
              {/* Floating Reorder Actions */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                <button
                  onClick={(e) => handleMoveUp(e, visualIdx)}
                  disabled={visualIdx === 0}
                  className="p-1 rounded-md bg-surface/90 border border-outline-variant/30 text-on-surface-variant hover:text-primary disabled:opacity-20 transition shadow-xs"
                  title="Move Page Up"
                >
                  <ArrowUp size={11} />
                </button>
                <button
                  onClick={(e) => handleMoveDown(e, visualIdx)}
                  disabled={visualIdx === pageOrders.length - 1}
                  className="p-1 rounded-md bg-surface/90 border border-outline-variant/30 text-on-surface-variant hover:text-primary disabled:opacity-20 transition shadow-xs"
                  title="Move Page Down"
                >
                  <ArrowDown size={11} />
                </button>
              </div>

              {/* Floating Quick Operations */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                <button
                  onClick={(e) => handleDuplicate(e, pageIdx)}
                  className="p-1 rounded-md bg-surface/90 border border-outline-variant/30 text-on-surface-variant hover:text-primary transition shadow-xs"
                  title="Duplicate Page"
                >
                  <Copy size={11} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, pageIdx)}
                  className="p-1 rounded-md bg-surface/90 border border-outline-variant/30 text-on-surface-variant hover:text-error transition shadow-xs"
                  title="Delete Page"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Thumbnail Container */}
              <div 
                className={`${layoutMode === 'horizontal' ? 'w-24' : 'w-40'} overflow-hidden rounded-lg bg-white border border-outline-variant/40 flex items-center justify-center relative shadow-xs`}
                style={{ height: `${layoutMode === 'horizontal' ? thumbnailHeight * 0.66 : thumbnailHeight}px` }}
              >
                <PageThumbnail pdfDoc={pdfDoc} pageIdx={pageIdx} />
              </div>

              {/* Page Number Label */}
              <span className="text-[11px] font-bold text-on-surface mt-2 flex items-center gap-1">
                <FileText size={12} className="text-on-surface-variant/60" /> Page {visualIdx + 1}
              </span>

              {/* Insert Blank Page Trigger */}
              <button
                onClick={(e) => handleInsertBlank(e, pageIdx)}
                className="w-full mt-2 py-1 flex items-center justify-center gap-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-all"
              >
                <Plus size={11} className="text-primary" />
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
