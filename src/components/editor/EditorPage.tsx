'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useEditorStore, EditorElement } from '../../store/useEditorStore';
import { FloatingToolbar } from './FloatingToolbar';
import { FloatingFormatToolbar } from './FloatingFormatToolbar';
import { renderShapeSvgContent } from '../../utils/shapeDefinitions';
import { loadWebFontIfNeeded, getFontFallbackStack } from '../../utils/fontLoader';
import { extractColorsForElements } from '../../utils/colorExtractor';

interface EditorPageProps {
  pageIndex: number;
  pdfDoc: any; // PDF.js doc instance
}

export const EditorPage: React.FC<EditorPageProps> = React.memo(({ pageIndex, pdfDoc }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);
  // Snapshot of element properties captured the instant we enter edit mode.
  // Used by Escape to fully cancel edits and restore the original appearance.
  const preEditSnapshotRef = useRef<Partial<EditorElement> | null>(null);
  // Tracks which element the contentEditable is currently initialized for,
  // so we only set innerHTML once per activation (not on every re-render).
  const editingInitializedForRef = useRef<string | null>(null);
  // Set to true when Escape is pressed so onBlur skips saving the DOM text.
  const escapeWasPressedRef = useRef<boolean>(false);
  
  const {
    elements,
    activeTool,
    zoom,
    selectedElementIds,
    setSelectedElementIds,
    updateElement,
    addElement,
    deleteElement,
    restoreElement,
    textColor,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    textDecoration,
    strokeColor,
    fillColor,
    strokeWidth,
    activeElementId,
    setActiveElementId,
    drawingOpacity,
    drawingStyle
  } = useEditorStore();

  // Context menu state for right-click restore
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);

  const [pageWidth, setPageWidth] = useState(595);
  const [pageHeight, setPageHeight] = useState(842);
  const [isRendered, setIsRendered] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any>({});

  // ID of the text element currently being hovered — drives cursor-text affordance + dashed outline
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Pixel rect of the active (editing) text element, used to position FloatingFormatToolbar
  const [activeElRect, setActiveElRect] = useState<{ top: number; left: number; width: number } | null>(null);


  
  // Pen Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const currentDrawingPointsRef = useRef<{ x: number; y: number }[]>([]);
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  
  // Eraser Brush State
  const [isErasing, setIsErasing] = useState(false);
  const lastErasePos = useRef<{ x: number; y: number } | null>(null);
  
  // Element Drag & Resize State
  const [dragState, setDragState] = useState<{
    elementId: string;
    action: 'drag' | 'resize' | 'rotate';
    handle?: string; // 'tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
    startElW: number;
    startElH: number;
    startRot: number;
  } | null>(null);

  // Snapping Guides state
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number } | null>(null);
  
  // To completely bypass mobile Safari transform scaling canvas bugs,
  // we render the PDF to a hidden canvas and display it as an img tag
  const [pdfImageSrc, setPdfImageSrc] = useState<string | null>(null);
  const [pdfImageLoaded, setPdfImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Drag Performance Refs
  const dragRafRef = useRef<number | null>(null);
  const pendingDragUpdateRef = useRef<Partial<EditorElement> | null>(null);

  // Filter elements for this page — memoized to avoid filtering on every render
  const pageElements = useMemo(() => elements.filter(el => el.pageIndex === pageIndex && !el.isDeleted), [elements, pageIndex]);
  const deletedOriginals = useMemo(() => elements.filter(el => el.pageIndex === pageIndex && el.isDeleted && el.isOriginalPdfElement), [elements, pageIndex]);
  const selectedElement = useMemo(() => pageElements.find(el => selectedElementIds.includes(el.id)), [pageElements, selectedElementIds]);

  // Setup window event listeners for dragging, resizing, and rotation to prevent stickiness and freeze
  useEffect(() => {
    if (!dragState || !containerRef.current) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;
      
      if (dragState.action === 'drag') {
        let newX = dragState.startElX + deltaX;
        let newY = dragState.startElY + deltaY;
        
        // Smart element-to-element snapping (Figma-grade)
        const snapThreshold = 1.5; // percent spacing tolerance
        let snappedX = newX;
        let snappedY = newY;
        let snapXLine: number | undefined;
        let snapYLine: number | undefined;
        
        // Filter other page elements that are not deleted
        const otherElements = pageElements.filter(el => el.id !== dragState.elementId);
        
        const currentW = dragState.startElW;
        const currentH = dragState.startElH;
        
        // 1. Snapping X
        let bestDiffX = snapThreshold;
        
        // Margins snap (5%, 50%, 95%)
        if (Math.abs(newX - 5) < bestDiffX) {
          snappedX = 5;
          bestDiffX = Math.abs(newX - 5);
          snapXLine = 5;
        }
        if (Math.abs((newX + currentW / 2) - 50) < bestDiffX) {
          snappedX = 50 - currentW / 2;
          bestDiffX = Math.abs((newX + currentW / 2) - 50);
          snapXLine = 50;
        }
        if (Math.abs((newX + currentW) - 95) < bestDiffX) {
          snappedX = 95 - currentW;
          bestDiffX = Math.abs((newX + currentW) - 95);
          snapXLine = 95;
        }
        
        // Element-to-element snaps
        for (const other of otherElements) {
          const otherL = other.x;
          const otherC = other.x + other.width / 2;
          const otherR = other.x + other.width;
          
          // Dragged Left snaps to other
          if (Math.abs(newX - otherL) < bestDiffX) { snappedX = otherL; bestDiffX = Math.abs(newX - otherL); snapXLine = otherL; }
          if (Math.abs(newX - otherC) < bestDiffX) { snappedX = otherC; bestDiffX = Math.abs(newX - otherC); snapXLine = otherC; }
          if (Math.abs(newX - otherR) < bestDiffX) { snappedX = otherR; bestDiffX = Math.abs(newX - otherR); snapXLine = otherR; }
          
          // Dragged Center snaps to other
          if (Math.abs((newX + currentW / 2) - otherL) < bestDiffX) { snappedX = otherL - currentW / 2; bestDiffX = Math.abs((newX + currentW / 2) - otherL); snapXLine = otherL; }
          if (Math.abs((newX + currentW / 2) - otherC) < bestDiffX) { snappedX = otherC - currentW / 2; bestDiffX = Math.abs((newX + currentW / 2) - otherC); snapXLine = otherC; }
          if (Math.abs((newX + currentW / 2) - otherR) < bestDiffX) { snappedX = otherR - currentW / 2; bestDiffX = Math.abs((newX + currentW / 2) - otherR); snapXLine = otherR; }
          
          // Dragged Right snaps to other
          if (Math.abs((newX + currentW) - otherL) < bestDiffX) { snappedX = otherL - currentW; bestDiffX = Math.abs((newX + currentW) - otherL); snapXLine = otherL; }
          if (Math.abs((newX + currentW) - otherC) < bestDiffX) { snappedX = otherC - currentW; bestDiffX = Math.abs((newX + currentW) - otherC); snapXLine = otherC; }
          if (Math.abs((newX + currentW) - otherR) < bestDiffX) { snappedX = otherR - currentW; bestDiffX = Math.abs((newX + currentW) - otherR); snapXLine = otherR; }
        }
        
        // 2. Snapping Y
        let bestDiffY = snapThreshold;
        
        // Margins snap (5%, 50%, 95%)
        if (Math.abs(newY - 5) < bestDiffY) {
          snappedY = 5;
          bestDiffY = Math.abs(newY - 5);
          snapYLine = 5;
        }
        if (Math.abs((newY + currentH / 2) - 50) < bestDiffY) {
          snappedY = 50 - currentH / 2;
          bestDiffY = Math.abs((newY + currentH / 2) - 50);
          snapYLine = 50;
        }
        if (Math.abs((newY + currentH) - 95) < bestDiffY) {
          snappedY = 95 - currentH;
          bestDiffY = Math.abs((newY + currentH) - 95);
          snapYLine = 95;
        }
        
        // Element-to-element snaps
        for (const other of otherElements) {
          const otherT = other.y;
          const otherC = other.y + other.height / 2;
          const otherB = other.y + other.height;
          
          // Dragged Top snaps to other
          if (Math.abs(newY - otherT) < bestDiffY) { snappedY = otherT; bestDiffY = Math.abs(newY - otherT); snapYLine = otherT; }
          if (Math.abs(newY - otherC) < bestDiffY) { snappedY = otherC; bestDiffY = Math.abs(newY - otherC); snapYLine = otherC; }
          if (Math.abs(newY - otherB) < bestDiffY) { snappedY = otherB; bestDiffY = Math.abs(newY - otherB); snapYLine = otherB; }
          
          // Dragged Center snaps to other
          if (Math.abs((newY + currentH / 2) - otherT) < bestDiffY) { snappedY = otherT - currentH / 2; bestDiffY = Math.abs((newY + currentH / 2) - otherT); snapYLine = otherT; }
          if (Math.abs((newY + currentH / 2) - otherC) < bestDiffY) { snappedY = otherC - currentH / 2; bestDiffY = Math.abs((newY + currentH / 2) - otherC); snapYLine = otherC; }
          if (Math.abs((newY + currentH / 2) - otherB) < bestDiffY) { snappedY = otherB - currentH / 2; bestDiffY = Math.abs((newY + currentH / 2) - otherB); snapYLine = otherB; }
          
          // Dragged Bottom snaps to other
          if (Math.abs((newY + currentH) - otherT) < bestDiffY) { snappedY = otherT - currentH; bestDiffY = Math.abs((newY + currentH) - otherT); snapYLine = otherT; }
          if (Math.abs((newY + currentH) - otherC) < bestDiffY) { snappedY = otherC - currentH; bestDiffY = Math.abs((newY + currentH) - otherC); snapYLine = otherC; }
          if (Math.abs((newY + currentH) - otherB) < bestDiffY) { snappedY = otherB - currentH; bestDiffY = Math.abs((newY + currentH) - otherB); snapYLine = otherB; }
        }
        
        // Draw snapping visual overlays
        if (snapXLine || snapYLine) {
          setSnapLines({ x: snapXLine, y: snapYLine });
        } else {
          setSnapLines(null);
        }
        
        pendingDragUpdateRef.current = {
          x: Math.min(Math.max(snappedX, 0), 100 - currentW),
          y: Math.min(Math.max(snappedY, 0), 100 - currentH)
        };
      } 
      
      else if (dragState.action === 'resize') {
        const handle = dragState.handle;
        let newW = dragState.startElW;
        let newH = dragState.startElH;
        let newX = dragState.startElX;
        let newY = dragState.startElY;
        
        if (handle?.includes('r')) {
          newW = Math.min(Math.max(dragState.startElW + deltaX, 2), 100 - dragState.startElX);
        }
        if (handle?.includes('b')) {
          newH = Math.min(Math.max(dragState.startElH + deltaY, 2), 100 - dragState.startElY);
        }
        if (handle?.includes('l')) {
          const possibleX = dragState.startElX + deltaX;
          const clampedX = Math.max(possibleX, 0);
          const computedW = (dragState.startElX + dragState.startElW) - clampedX;
          if (computedW > 2) {
            newW = computedW;
            newX = clampedX;
          } else {
            newW = 2;
            newX = (dragState.startElX + dragState.startElW) - 2;
          }
        }
        if (handle?.includes('t')) {
          const possibleY = dragState.startElY + deltaY;
          const clampedY = Math.max(possibleY, 0);
          const computedH = (dragState.startElY + dragState.startElH) - clampedY;
          if (computedH > 2) {
            newH = computedH;
            newY = clampedY;
          } else {
            newH = 2;
            newY = (dragState.startElY + dragState.startElH) - 2;
          }
        }
        
        pendingDragUpdateRef.current = {
          x: newX,
          y: newY,
          width: newW,
          height: newH
        };
      } 
      
      else if (dragState.action === 'rotate') {
        const elCenterX = rect.left + ((dragState.startElX + dragState.startElW / 2) / 100) * rect.width;
        const elCenterY = rect.top + ((dragState.startElY + dragState.startElH / 2) / 100) * rect.height;
        
        const angleRad = Math.atan2(e.clientX - elCenterX, elCenterY - e.clientY);
        let degreesVal = Math.round(angleRad * (180 / Math.PI));
        if (degreesVal < 0) degreesVal += 360;
        
        // Snaps at 45 degree steps
        if (Math.abs(degreesVal % 45) < 4) {
          degreesVal = Math.round(degreesVal / 45) * 45;
        }
        
        pendingDragUpdateRef.current = {
          rotation: degreesVal % 360
        };
      }

      // Apply direct DOM mutation via requestAnimationFrame
      if (pendingDragUpdateRef.current) {
        if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = requestAnimationFrame(() => {
          const domEl = document.getElementById(`el-${dragState.elementId}`);
          if (domEl && pendingDragUpdateRef.current) {
            const updates = pendingDragUpdateRef.current;
            if (updates.x !== undefined) domEl.style.left = `${updates.x}%`;
            if (updates.y !== undefined) domEl.style.top = `${updates.y}%`;
            if (updates.width !== undefined) domEl.style.width = `${updates.width}%`;
            if (updates.height !== undefined) domEl.style.height = `${updates.height}%`;
            
            // For rotation, we need to preserve existing rotation if not explicitly updating it,
            // but the elementStyle maps rotation directly. For simplicity, we just apply the updated rotation 
            // if present, otherwise we assume it hasn't changed.
            if (updates.rotation !== undefined) {
              domEl.style.transform = `rotate(${updates.rotation}deg)`;
            }
          }
        });
      }
    };

    const handleWindowMouseUp = () => {
      if (dragState && pendingDragUpdateRef.current) {
        updateElement(dragState.elementId, pendingDragUpdateRef.current);
      }
      setDragState(null);
      setSnapLines(null);
      pendingDragUpdateRef.current = null;
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);

      // Record history on drag end
      const { elements: els } = useEditorStore.getState();
      useEditorStore.setState((state) => ({
        past: [...state.past, els],
        future: []
      }));
    };

    window.addEventListener('pointermove', handleWindowMouseMove);
    window.addEventListener('pointerup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowMouseMove);
      window.removeEventListener('pointerup', handleWindowMouseUp);
    };
  }, [dragState, pageElements, updateElement]);

  // Render PDF page to an image to bypass mobile canvas compositing bugs
  // On mobile Safari/Chrome, a raw <canvas> inside a CSS transform:scale() container
  // frequently defers its initial paint, causing a blank white page until a touch-triggered
  // reflow. By converting the render to a data URL and using an <img> tag, we bypass
  // this compositing issue entirely.
  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;
    let blobUrl: string | null = null;

    async function renderPage() {
      if (!pdfDoc) return;
      
      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        if (isCancelled) return;
        
        const isMobile = window.innerWidth <= 768;
        const renderScale = isMobile ? 1.5 : 2.0;
        const viewport = page.getViewport({ scale: renderScale });
        
        // Create an offscreen canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;
        
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        
        renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });
        await renderTask.promise;
        
        if (isCancelled) return;

        // STEP 0.5: Sample text and background colors directly from the rendered PDF canvas
        try {
          const originalTextElements = useEditorStore.getState().elements.filter(
            el => el.pageIndex === pageIndex && el.type === 'text' && el.isOriginalPdfElement && !el.isModified
          );
          if (originalTextElements.length > 0) {
            const colorMap = extractColorsForElements(context, originalTextElements, canvas.width, canvas.height);
            for (const [elId, colorInfo] of colorMap.entries()) {
              if (colorInfo.textColor) {
                useEditorStore.getState().updateElement(elId, {
                  color: colorInfo.textColor,
                  originalColor: colorInfo.textColor,
                  backgroundColor: colorInfo.backgroundColor,
                  isModified: false,
                });
              }
            }
          }
        } catch (colorExtractErr) {
          console.warn('[COLOR_EXTRACT] Failed to sample canvas text colors:', colorExtractErr);
        }
        
        // STEP 1: Get page dimensions FIRST (before any image work)
        const baseViewport = page.getViewport({ scale: 1.0 });
        
        // STEP 2: Set zoom BEFORE the image is displayed.
        // CRITICAL: On mobile, the zoom change (1.0 → 0.40) changes the CSS
        // transform: scale() on the image container. If the image is already
        // in the DOM when this happens, mobile compositors invalidate and
        // blank the compositing layer. Setting zoom first ensures the
        // container is already at the final scale when the image arrives.
        if (isMobile && baseViewport.width > 0) {
          if (useEditorStore.getState().zoom === 1.0) {
            useEditorStore.getState().setZoom(0.40);
          }
        }
        
        // STEP 3: Set page dimensions (also before image)
        setPageWidth(baseViewport.width);
        setPageHeight(baseViewport.height);
        
        if (isCancelled) return;
        
        // STEP 4: Wait for React to re-render with the new zoom/dimensions
        // so the container is at its final CSS transform scale BEFORE we add the image
        await new Promise<void>(resolve => requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        }));
        
        if (isCancelled) return;
        
        // STEP 5: Convert canvas to image using Blob URL (much more reliable
        // on mobile than data URLs — avoids base64 encoding overhead and
        // uses the browser's native image decoder pipeline)
        let imageUrl: string;
        
        if (isMobile && canvas.toBlob) {
          // Use Blob URL on mobile — most reliable approach
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.92);
          });
          
          if (!blob || isCancelled) return;
          blobUrl = URL.createObjectURL(blob);
          imageUrl = blobUrl;
        } else {
          // Desktop: data URL is fine
          imageUrl = canvas.toDataURL('image/png');
        }
        
        // STEP 6: Pre-decode the image so it's ready to paint instantly
        try {
          const preloadImg = new Image();
          preloadImg.src = imageUrl;
          if (preloadImg.decode) {
            await preloadImg.decode();
          }
        } catch (_) {
          // decode() can fail on older browsers — fall through
        }
        
        if (isCancelled) return;
        
        // STEP 7: NOW set the image src — the container is already at final
        // dimensions and zoom, so no compositing layer invalidation occurs
        setPdfImageSrc(imageUrl);
        setIsRendered(true);
        
        // Free the offscreen canvas memory
        canvas.width = 0;
        canvas.height = 0;
        
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      }
    }
    
    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try { renderTask.cancel(); } catch (_) {}
      }
      // Revoke blob URL to free memory
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfDoc, pageIndex]);

  // Click on page background handler
  const handlePageClick = (e: React.MouseEvent) => {
    // Dismiss context menu on any click
    if (contextMenu) setContextMenu(null);
    
    if (activeTool === 'select' || activeTool === 'pan') {
      setSelectedElementIds([]);
      setActiveElementId(null);
      return;
    }
    
    if (!containerRef.current) return;
    
    // Coordinates relative to page container
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Element creation based on active toolbar choice
    if (activeTool === 'text') {
      const newId = addElement({
        pageIndex,
        type: 'text',
        x: clickX,
        y: clickY,
        width: 30, // initial estimated width percentage
        height: 6,  // initial estimated height percentage
        rotation: 0,
        opacity: 1.0,
        text: 'Type something...',
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        color: textColor,
        align: 'left'
      });
      setActiveElementId(newId);
      setSelectedElementIds([newId]);
      useEditorStore.setState({ activeTool: 'select' }); // Auto switch back
    } 
    else if (activeTool === 'shape') {
      const { shapeType } = useEditorStore.getState();
      addElement({
        pageIndex,
        type: 'shape',
        shapeType,
        x: clickX - 5,
        y: clickY - 5,
        width: 10,
        height: 10,
        rotation: 0,
        opacity: 1.0,
        strokeColor,
        fillColor,
        strokeWidth
      });
      useEditorStore.setState({ activeTool: 'select' });
    }
    
    else if (activeTool === 'signature') {
      // Open signature dialog by letting parent handle it, or we can drop signature if one exists
      const { signatures } = useEditorStore.getState();
      if (signatures.length > 0) {
        // Stamp last signature
        addElement({
          pageIndex,
          type: 'signature',
          src: signatures[signatures.length - 1],
          x: clickX - 10,
          y: clickY - 5,
          width: 20,
          height: 10,
          rotation: 0,
          opacity: 1.0
        });
        useEditorStore.setState({ activeTool: 'select' });
      } else {
        // Trigger visual alert
        alert("Please create or load a signature first in the Top Toolbar's signature options.");
      }
    }
    
    else if (activeTool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const newId = addElement({
              pageIndex,
              type: 'image',
              src: dataUrl,
              x: clickX - 10,
              y: clickY - 7.5,
              width: 20,
              height: 15,
              rotation: 0,
              opacity: 1.0
            });
            setSelectedElementIds([newId]);
            setActiveElementId(null);
            useEditorStore.setState({ activeTool: 'select' });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
    
    else if (activeTool === 'erase') {
      const { eraserSize } = useEditorStore.getState();
      // Convert eraser size (px) to percentage of page dimensions
      const erasePctW = (eraserSize / pageWidth) * 100;
      const erasePctH = (eraserSize / pageHeight) * 100;
      
      // Placing a solid white-out rectangle to erase background PDF content
      const newId = addElement({
        pageIndex,
        type: 'shape',
        shapeType: 'rect',
        x: clickX - erasePctW / 2,
        y: clickY - erasePctH / 2,
        width: erasePctW,
        height: erasePctH,
        rotation: 0,
        opacity: 1.0,
        strokeColor: 'transparent',
        fillColor: '#ffffff', // solid whiteout block
        strokeWidth: 0
      });
      setSelectedElementIds([newId]);
      setActiveElementId(null);
      // Stay in erase mode for continuous erasing
    }
  };

  // Pen tool freehand drawing handlers + Eraser brush drag
  const handlePagePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    if (activeTool !== 'draw' && activeTool !== 'erase') return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const ptX = ((e.clientX - rect.left) / rect.width) * 100;
    const ptY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDrawing(true);
    const newPoints = [{ x: ptX, y: ptY }];
    currentDrawingPointsRef.current = newPoints;
    
    let drawWidth = strokeWidth;
    let drawOpacity = drawingOpacity;
    let drawColor = strokeColor;
    
    if (activeTool === 'erase') {
      const { eraserSize } = useEditorStore.getState();
      drawWidth = eraserSize;
      drawOpacity = 1.0;
      drawColor = '#ffffff'; // white-out brush
    } else {
      if (drawingStyle === 'highlighter') {
        drawWidth = Math.max(strokeWidth, 12);
        drawOpacity = Math.min(drawingOpacity, 0.35);
      } else if (drawingStyle === 'fineliner') {
        drawWidth = Math.min(strokeWidth, 1.5);
      } else if (drawingStyle === 'marker') {
        drawWidth = Math.max(strokeWidth, 4);
        drawOpacity = Math.min(drawingOpacity, 0.7);
      } else if (drawingStyle === 'pencil') {
        drawWidth = Math.min(strokeWidth, 2);
        drawOpacity = Math.min(drawingOpacity, 0.6);
      } else if (drawingStyle === 'calligraphy') {
        drawWidth = Math.max(strokeWidth, 8);
      } else if (drawingStyle === 'brush') {
        drawWidth = Math.max(strokeWidth, 10);
      }
    }
    
    const newId = addElement({
      pageIndex,
      type: 'drawing',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: drawOpacity,
      strokeColor: drawColor,
      strokeWidth: drawWidth,
      points: newPoints
    }, false); // Pass false to prevent auto-selecting the drawing, fixing the continuous draw bug!
    setCurrentDrawingId(newId);
  };

  const handlePagePointerMove = (e: React.PointerEvent) => {

    
    if (isDrawing && currentDrawingId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const ptX = ((e.clientX - rect.left) / rect.width) * 100;
      const ptY = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Use ref-based points to avoid state-driven rerenders on every pointermove
      currentDrawingPointsRef.current = [...currentDrawingPointsRef.current, { x: ptX, y: ptY }];
      
      updateElement(currentDrawingId, {
        points: currentDrawingPointsRef.current
      });
    }
  };

  const handlePagePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentDrawingId(null);
      // Record history but DO NOT switch tool — keep drawing mode active for continuous drawing
      const { elements: els } = useEditorStore.getState();
      useEditorStore.setState({ past: [...useEditorStore.getState().past, els], future: [] });
    }
  };

  // Element interaction selectors
  const handleElementPointerDown = (e: React.PointerEvent, elId: string, action: 'drag' | 'resize' | 'rotate', handle?: string) => {
    if (activeTool === 'erase' || activeTool === 'draw' || activeTool === 'pan') {
      // Let it bubble to page for panning/drawing/erasing over elements
      return;
    }
    e.stopPropagation();
    
    const el = pageElements.find(item => item.id === elId);
    if (!el) return;

    if (activeTool !== 'select' && !(activeTool === 'text' && el.type === 'text')) return;

    // Custom robust double click detection (independent of React re-renders)
    const now = e.timeStamp;
    const isDoubleClick = lastClickRef.current && 
                          lastClickRef.current.id === elId && 
                          (now - lastClickRef.current.time) < 500;
    
    lastClickRef.current = { id: elId, time: now };

    // ── Single-click text editing (Adobe Acrobat model) ────────────────────
    // In select mode: single click on any text element → immediately enter edit mode.
    // No double-click required, no tool switching needed.
    if (el.type === 'text' && (activeTool === 'select' || activeTool === 'text')) {
      setActiveElementId(elId);
      setSelectedElementIds([elId]);
      setDragState(null);

      // Measure the element's pixel rect so FloatingFormatToolbar can position itself
      const elNode = document.getElementById(`el-${elId}`);
      if (elNode && containerRef.current) {
        const elDomRect = elNode.getBoundingClientRect();
        const containerDomRect = containerRef.current.getBoundingClientRect();
        setActiveElRect({
          top: elDomRect.top - containerDomRect.top,
          left: elDomRect.left - containerDomRect.left,
          width: elDomRect.width,
        });
      }
      return;
    }

    if (isDoubleClick && el.type === 'text') {
      setActiveElementId(elId);
      setDragState(null);
      return;
    }
    
    
    setSelectedElementIds([elId]);
    if (action !== 'drag') {
      setActiveElementId(null); // Deselect typing if resizing or rotating
    }
    
    setDragState({
      elementId: elId,
      action,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startElX: el.x,
      startElY: el.y,
      startElW: el.width,
      startElH: el.height,
      startRot: el.rotation || 0
    });
  };

  return (
    <div 
      id={`page-container-${pageIndex}`}
      className="relative flex justify-center py-6"
    >
      <div 
        style={{ width: `${pageWidth * zoom}px`, height: `${pageHeight * zoom}px` }} 
        className="relative mx-auto"
      >
        <div 
          className={`absolute top-0 left-0 shadow-2xl bg-white border border-black/10 overflow-visible ${
            (activeTool === 'draw' || activeTool === 'erase') ? 'touch-none' : ''
          }`}
          style={{ 
            width: `${pageWidth}px`, 
            height: `${pageHeight}px`, 
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            willChange: 'transform',
            WebkitBackfaceVisibility: 'hidden' as any,
          }}
        >
        {/* PDF Image Layer — rendered from offscreen canvas to bypass mobile compositing bugs */}
        {pdfImageSrc && (
          <img 
            ref={imgRef}
            src={pdfImageSrc} 
            alt="PDF page" 
            className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none" 
            style={{ 
              objectFit: 'fill',
              // Force GPU compositing on mobile to prevent deferred paint
              willChange: 'transform',
              WebkitBackfaceVisibility: 'hidden' as any,
            }}
            draggable={false}
            onLoad={() => {
              setPdfImageLoaded(true);
              // CRITICAL: Force mobile browser to repaint the compositing layer
              // Mobile Safari/Chrome defer painting of images inside CSS transform containers
              // This requestAnimationFrame + forced reflow pattern ensures the content
              // is actually composited and visible immediately, not deferred until a touch event
              requestAnimationFrame(() => {
                if (imgRef.current) {
                  // Force a layout reflow by reading a layout property
                  void imgRef.current.offsetHeight;
                  // Then force the parent to also reflow
                  const parent = imgRef.current.parentElement;
                  if (parent) {
                    void parent.offsetHeight;
                  }
                }
                // Double-RAF to catch the next frame after compositor processes the reflow
                requestAnimationFrame(() => {
                  if (imgRef.current) {
                    // Toggle a trivial CSS property to force the compositor to repaint
                    imgRef.current.style.transform = 'translateZ(0)';
                  }
                });
              });
            }}
          />
        )}
        
        {/* Snappy alignment visual grids */}
        {snapLines?.x && (
          <div className="alignment-guide-y" style={{ left: `${snapLines.x}%` }} />
        )}
        {snapLines?.y && (
          <div className="alignment-guide-x" style={{ top: `${snapLines.y}%` }} />
        )}

        {/* Dynamic visual overlay edit workspace */}
        <div
          ref={containerRef}
          onClick={handlePageClick}
          onPointerDown={handlePagePointerDown}
          onPointerMove={handlePagePointerMove}
          onPointerUp={handlePagePointerUp}
          className={`absolute inset-0 z-10 pointer-events-auto ${
            activeTool === 'select' ? 'cursor-default' : activeTool === 'draw' ? 'cursor-crosshair' : activeTool === 'erase' ? 'cursor-cell' : activeTool === 'pan' ? 'cursor-grab' : 'cursor-cell'
          }`}
        >
          {pageElements.map((el) => {
            const isSelected = selectedElementIds.includes(el.id);
            const isEditing = activeElementId === el.id;
            
            // Absolute positioning percentages styles
            const elementStyle: React.CSSProperties = {
              position: 'absolute',
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              transform: `rotate(${el.rotation || 0}deg)`,
              opacity: el.opacity,
              zIndex: isSelected ? 20 : 10,
              userSelect: isEditing ? 'text' : 'none',
              pointerEvents: (el.type === 'drawing' && !isSelected) ? 'none' : 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.01)', // Crucial: Ensures empty transparent text boxes still catch mouse events
            };

            return (
              <div
                id={`el-${el.id}`}
                key={el.id}
                style={elementStyle}
                onPointerDown={(e) => handleElementPointerDown(e, el.id, 'drag')}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e: React.MouseEvent) => {
                  if (el.type === 'text') setHoveredTextId(el.id);
                  if (activeTool === 'erase' && e.buttons === 1) {
                    deleteElement(el.id);
                  }
                }}
                onMouseLeave={() => {
                  if (el.type === 'text') setHoveredTextId(prev => prev === el.id ? null : prev);
                }}
                onContextMenu={(e) => {
                  if (el.isOriginalPdfElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if ((activeTool === 'select' || activeTool === 'text') && el.type === 'text') {
                    setActiveElementId(el.id);
                  }
                }}
                className={`absolute group pointer-events-auto ${
                  isSelected && (activeTool === 'select' || activeTool === 'text' || activeTool === 'image')
                    ? 'ring-1 ring-primary cursor-move z-20' 
                    : (el.type === 'text' && (activeTool === 'select' || activeTool === 'text'))
                    ? (hoveredTextId === el.id && !isEditing
                        ? 'ring-1 ring-blue-400/60 ring-dashed cursor-text z-10'
                        : 'hover:ring-1 hover:ring-blue-400/40 hover:ring-dashed cursor-text z-10')
                    : (activeTool === 'select' || activeTool === 'text' || activeTool === 'image')
                    ? 'hover:ring-1 hover:ring-primary/40 hover:bg-primary/[0.03] cursor-pointer z-10'
                    : ''
                } ${
                  activeTool === 'erase' ? 'hover:bg-error/30 hover:ring-4 hover:ring-error hover:z-50 cursor-crosshair' : ''
                }`}
              >
                {/* 1. TEXT ELEMENT LAYERS */}
                {el.type === 'text' && (
                  <div className="w-full h-full select-text overflow-visible pointer-events-auto relative">

                    {/* White mask — covers original PDF-rendered text when editing or after modification.
                        We only show it when the element has been genuinely modified (tolerance-checked
                        in the store), never as a false positive from floating-point rounding. */}
                    {el.isOriginalPdfElement && (isEditing || el.isModified) && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          top: '-1px',
                          left: '-2px',
                          right: '-2px',
                          bottom: '-1px',
                          backgroundColor: el.backgroundColor || '#ffffff',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* ── CANVA-GRADE contentEditable ──────────────────────────────────────
                     *
                     * Key design decisions:
                     *
                     * 1. NO key={isEditing ? 'edit' : 'view'} — we never unmount/remount this
                     *    node. React would lose DOM ownership and corrupt mid-edit content.
                     *
                     * 2. contentEditable is toggled via attribute, not by remounting.
                     *
                     * 3. The ref callback sets innerHTML ONCE when entering edit mode
                     *    (guarded by editingInitializedForRef). Subsequent re-renders
                     *    while editing do NOT touch the inner DOM — React sees
                     *    suppressContentEditableWarning and skips reconciliation.
                     *
                     * 4. In VIEW mode: color is transparent so the PDF image shows through.
                     *    The text IS there in the DOM (for accessibility / copy-paste) but
                     *    invisible because the PDF already renders it.
                     *
                     * 5. On Escape: we restore the full pre-edit snapshot (text + styles)
                     *    captured at the moment the element was activated.
                     * ─────────────────────────────────────────────────────────────────── */}
                    <div
                      id={`text-edit-${el.id}`}
                      ref={(node) => {
                        if (!node) return;

                        if (isEditing) {
                          // Only initialize content once per activation to avoid
                          // clobbering the user's mid-edit text on React re-renders.
                          if (editingInitializedForRef.current !== el.id) {
                            editingInitializedForRef.current = el.id;

                            // Capture a full snapshot before the user changes anything —
                            // Escape will restore this exactly.
                            preEditSnapshotRef.current = {
                              text:           el.text,
                              color:          el.color,
                              fontFamily:     el.fontFamily,
                              fontSize:       el.fontSize,
                              fontWeight:     el.fontWeight,
                              fontStyle:      el.fontStyle,
                              textDecoration: el.textDecoration,
                              align:          el.align,
                              isModified:     el.isModified,
                            };

                            // Set text content via DOM (not React JSX) so React never
                            // overwrites it during the editing session.
                            // We use innerText rather than innerHTML to avoid XSS and
                            // to preserve newlines correctly.
                            node.innerText = el.text || '';

                            // Focus and place cursor at a natural position.
                            node.focus();
                            // Try to place the caret where the user actually clicked.
                            // caretRangeFromPoint (Chrome/Safari) gives click-accurate position.
                            // If not available, fall back to end-of-content.
                            try {
                              const sel = window.getSelection();
                              if (sel) sel.removeAllRanges();
                              const range = document.createRange();
                              range.selectNodeContents(node);
                              range.collapse(false); // collapse to end as safe default
                              if (sel) sel.addRange(range);
                            } catch (_) { /* ignore */ }
                          }
                        } else {
                          // Leaving edit mode — reset the initialization guard so the
                          // next activation sets content freshly.
                          if (editingInitializedForRef.current === el.id) {
                            editingInitializedForRef.current = null;
                          }
                        }
                      }}
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      dir="auto"
                      onBlur={(e) => {
                        // If Escape was pressed, we already restored the snapshot — don't overwrite.
                        if (escapeWasPressedRef.current) {
                          escapeWasPressedRef.current = false;
                          preEditSnapshotRef.current = null;
                          editingInitializedForRef.current = null;
                          setActiveElementId(null);
                          setActiveElRect(null);
                          return;
                        }
                        // Read the final text from the DOM (not from state, which may be stale)
                        let newText = e.currentTarget.innerText || '';
                        if (newText.trim() === '') newText = '\u00A0'; // keep selectable
                        // Save only the text — NEVER apply global style defaults.
                        // The element keeps its original font/color unless the user explicitly
                        // changed them via the FloatingFormatToolbar.
                        updateElement(el.id, { text: newText });
                        preEditSnapshotRef.current = null;
                        editingInitializedForRef.current = null;
                        setActiveElementId(null);
                        setActiveElRect(null);
                      }}
                      onKeyDown={(e) => {
                        // Always stop propagation to prevent global shortcuts from firing
                        e.stopPropagation();

                        if (e.key === 'Escape') {
                          e.preventDefault();
                          // Save the snapshot reference before we clear it, then restore.
                          const snap = preEditSnapshotRef.current;
                          escapeWasPressedRef.current = true;
                          if (snap) {
                            updateElement(el.id, snap as Partial<EditorElement>);
                            // Also restore DOM text so browser doesn't flash wrong content
                            e.currentTarget.innerText = (snap.text as string) || '';
                          }
                          e.currentTarget.blur();
                        }

                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      onPaste={(e) => {
                        // Strip all HTML/rich-text, accept plain text only
                        e.preventDefault();
                        const text = e.clipboardData.getData('text/plain');
                        const sel = window.getSelection();
                        if (!sel || !sel.rangeCount) return;
                        sel.deleteFromDocument();
                        sel.getRangeAt(0).insertNode(document.createTextNode(text));
                        sel.collapseToEnd();
                      }}
                      className="w-full h-full select-text outline-none border-none m-0 p-0 whitespace-pre-wrap break-words min-h-[1em]"
                      style={{
                        // ── Typography: always read from the ELEMENT, never from global store defaults.
                        // This is what makes editing feel like the original text — the styles are
                        // locked to what the PDF contained (or what the user explicitly changed).
                        fontSize:       `${el.fontSize || 14}px`,
                        fontFamily:     (() => {
                          const fam = el.fontFamily || 'Helvetica';
                          loadWebFontIfNeeded(fam);
                          return getFontFallbackStack(fam);
                        })(),
                        fontWeight:     el.fontWeight  || 'normal',
                        fontStyle:      el.fontStyle   || 'normal',
                        textDecoration: el.textDecoration || 'none',
                        textAlign:      el.align as any || 'left',
                        lineHeight:     el.lineHeight  || 1.15,
                        letterSpacing:  el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                        direction:      /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(el.text || '') ? 'rtl' : 'ltr',

                        // ── Color:
                        //   • VIEW mode  → transparent: the PDF image already renders the text.
                        //   • EDIT mode  → el.color: the real extracted color from the PDF.
                        //   • Modified   → el.color: user has intentionally overridden the PDF.
                        //   • New element → el.color: set by addElement from the current stroke.
                        color: (isEditing || el.isModified || !el.isOriginalPdfElement)
                          ? (el.color || '#000000')
                          : 'transparent',

                        backgroundColor: 'transparent',
                        cursor:          isEditing ? 'text' : 'inherit',
                        userSelect:      isEditing ? 'text' : 'none',
                        position:        'relative',
                        zIndex:          2,
                        // Prevent browser spell-check underlining from interfering with visual fidelity
                        WebkitTextSizeAdjust: '100%',
                      }}
                    />
                  </div>
                )}

                {/* 2. IMAGE & SIGNATURE LAYERS */}
                {(el.type === 'image' || el.type === 'signature') && el.src && (() => {
                  const brightness = el.brightness ?? 100;
                  const contrast = el.contrast ?? 100;
                  const saturation = el.saturation ?? 100;
                  const blur = el.imgBlur ?? 0;
                  const grayscale = el.imgGrayscale ?? 0;
                  const exposure = el.exposure ?? 100;
                  const warmth = el.warmth ?? 100;
                  const flipH = el.flipH ?? false;
                  const flipV = el.flipV ?? false;
                  const objectFit = el.objectFit || (el.type === 'image' ? 'cover' : 'contain');
                  
                  const filterParts: string[] = [];
                  if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`);
                  if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`);
                  if (saturation !== 100) filterParts.push(`saturate(${saturation}%)`);
                  if (blur > 0) filterParts.push(`blur(${blur}px)`);
                  if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`);
                  if (exposure !== 100) filterParts.push(`brightness(${exposure / 100})`);
                  if (warmth !== 100) filterParts.push(`sepia(${Math.abs(warmth - 100) / 2}%)`);
                  
                  const transforms: string[] = [];
                  if (flipH) transforms.push('scaleX(-1)');
                  if (flipV) transforms.push('scaleY(-1)');

                  const isCircle = el.clipShape === 'circle';
                  const isRounded = el.clipShape === 'rounded' || (el.cornerRadius && el.cornerRadius > 0);
                  const borderRadius = isCircle ? '50%' : isRounded ? `${el.cornerRadius || 8}px` : undefined;
                  const clipPath = el.clipPath ? el.clipPath : (isCircle ? 'circle(50% at 50% 50%)' : undefined);
                  
                  return (
                    <div 
                      className="w-full h-full overflow-hidden"
                      style={{
                        borderRadius,
                        clipPath,
                      }}
                    >
                      <img
                        src={el.src}
                        alt="Layer Asset"
                        className="w-full h-full pointer-events-none select-none"
                        style={{
                          objectFit: objectFit as any,
                          objectPosition: 'center',
                          filter: filterParts.length > 0 ? filterParts.join(' ') : undefined,
                          transform: transforms.length > 0 ? transforms.join(' ') : undefined,
                        }}
                      />
                    </div>
                  );
                })()}

                {/* 3. SHAPES — dynamic SVG rendering */}
                {el.type === 'shape' && el.shapeType && (
                  <svg
                    className="w-full h-full overflow-visible pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    dangerouslySetInnerHTML={{
                      __html: renderShapeSvgContent(
                        el.shapeType,
                        el.fillColor || 'transparent',
                        el.strokeColor || '#3b82f6',
                        el.strokeWidth ? el.strokeWidth * 2 : 4,
                        el.borderDash
                      )
                    }}
                  />
                )}

                {/* 4. FREEHAND VECTOR DRAWINGS */}
                {el.type === 'drawing' && el.points && el.points.length > 0 && (
                  <svg 
                    className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    style={{ left: 0, top: 0 }}
                  >
                    <path
                      d={el.points.reduce((acc, pt, i) => {
                        // pt coordinates are in visual page percentages. Convert to pixels.
                        const px = (pt.x / 100) * pageWidth;
                        const py = (pt.y / 100) * pageHeight;
                        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                      }, '')}
                      fill="none"
                      stroke={el.strokeColor || '#3b82f6'}
                      strokeWidth={el.strokeWidth || 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {/* 5. FIGMA STYLE ELEMENT MANIPULATORS (RESIZE / ROTATE) */}
                {isSelected && activeTool === 'select' && !isEditing && (
                  <>
                    {/* Corners Resize Handles */}
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'tl')}
                      className="absolute -top-1.5 -left-1.5 resize-handle cursor-nwse-resize pointer-events-auto" 
                    />
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'tr')}
                      className="absolute -top-1.5 -right-1.5 resize-handle cursor-nesw-resize pointer-events-auto" 
                    />
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'bl')}
                      className="absolute -bottom-1.5 -left-1.5 resize-handle cursor-nesw-resize pointer-events-auto" 
                    />
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'br')}
                      className="absolute -bottom-1.5 -right-1.5 resize-handle cursor-nwse-resize pointer-events-auto" 
                    />
                    
                    {/* Sides Resize Handles */}
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 't')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 resize-handle cursor-ns-resize pointer-events-auto" 
                    />
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'b')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 resize-handle cursor-ns-resize pointer-events-auto" 
                    />
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'l')}
                      className="absolute top-1/2 -translate-y-1/2 -left-1.5 resize-handle cursor-ew-resize pointer-events-auto" 
                    />
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize', 'r')}
                      className="absolute top-1/2 -translate-y-1/2 -right-1.5 resize-handle cursor-ew-resize pointer-events-auto" 
                    />
                    
                    {/* Rotation Lollipop Handle */}
                    <div 
                      onPointerDown={(e) => handleElementPointerDown(e, el.id, 'rotate')}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-veltis-violet border border-white rounded-full cursor-alias flex items-center justify-center pointer-events-auto"
                      title="Drag to Rotate"
                    >
                      <div className="w-[1px] h-3 bg-veltis-violet absolute top-3" />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Ghost Anchors for deleted original PDF elements */}
          {deletedOriginals.map((el) => (
            <div
              key={`ghost-${el.id}`}
              style={{
                position: 'absolute',
                left: `${el.originalX ?? el.x}%`,
                top: `${el.originalY ?? el.y}%`,
                width: `${el.originalWidth ?? el.width}%`,
                height: `${el.originalHeight ?? el.height}%`,
                zIndex: 5,
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              className="border border-dashed border-primary/40 bg-primary/[0.04] hover:bg-primary/10 hover:border-primary/60 transition-colors rounded-sm group"
              onClick={(e) => {
                e.stopPropagation();
                restoreElement(el.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
              }}
              title="Click to restore original text"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-bold text-primary bg-white/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">Click to Restore</span>
              </div>
            </div>
          ))}

          {/* Right-click Context Menu */}
          {contextMenu && (
            <div
              className="fixed z-[200] bg-white rounded-lg shadow-2xl border border-outline-variant/50 py-1 min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-100"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                onClick={() => {
                  restoreElement(contextMenu.elementId);
                  setContextMenu(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore Original Text
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                onClick={() => {
                  const el = elements.find(e => e.id === contextMenu.elementId);
                  if (el) {
                    setSelectedElementIds([el.id]);
                    setActiveElementId(el.id);
                  }
                  setContextMenu(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                Edit This Element
              </button>
              <div className="h-px bg-outline-variant/30 mx-2 my-1" />
              <button
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                onClick={() => {
                  deleteElement(contextMenu.elementId);
                  setContextMenu(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Delete Element
              </button>
            </div>
          )}

          {/* Contextual Floating Format Toolbar — anchored above the active text element */}
          {activeElementId && (() => {
            const activeEl = pageElements.find(el => el.id === activeElementId);
            if (!activeEl || activeEl.type !== 'text') return null;

            // Compute pixel position relative to the overlay container
            const containerEl = containerRef.current;
            let rect = activeElRect;
            if (!rect && containerEl) {
              const elNode = document.getElementById(`el-${activeElementId}`);
              if (elNode) {
                const domRect = elNode.getBoundingClientRect();
                const cRect = containerEl.getBoundingClientRect();
                rect = {
                  top: domRect.top - cRect.top,
                  left: domRect.left - cRect.left,
                  width: domRect.width,
                };
              }
            }

            if (!rect) return null;

            return (
              <FloatingFormatToolbar
                activeElement={activeEl}
                elementRect={rect}
                onClose={() => setActiveElementId(null)}
              />
            );
          })()}

          {/* Classic element selection floating action bar (non-text elements) */}
          {selectedElement && activeTool === 'select' && !activeElementId && (
            <FloatingToolbar 
              selectedElement={selectedElement} 
            />
          )}
        </div>
      </div>
    </div>
    </div>
  );
});
EditorPage.displayName = 'EditorPage';
export default EditorPage;
