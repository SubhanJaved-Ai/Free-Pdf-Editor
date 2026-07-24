import { create } from 'zustand';

export type ElementType = 'text' | 'image' | 'shape' | 'drawing' | 'signature' | 'annotation';

export interface EditorElement {
  id: string;
  pageIndex: number;
  type: ElementType;
  x: number;         // percentage of page width (0 to 100) or PDF points
  y: number;         // percentage of page height (0 to 100) or PDF points
  width: number;     // relative to page
  height: number;    // relative to page
  rotation: number;  // degrees (0 to 360)
  opacity: number;   // 0 to 1
  
  // Text specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold';
  textDecoration?: 'none' | 'underline';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  
  // Shape/Drawing specific properties
  shapeType?: 'rect' | 'rounded-rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'octagon' | 'star' | 'heart' | 'cloud' | 'line' | 'arrow' | 'double-arrow' | 'callout' | 'speech-bubble' | 'highlight-box' | 'underline-marker' | 'stamp';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  points?: { x: number; y: number }[]; // For drawings
  borderDash?: number[]; // Dashed border pattern e.g. [5,5]
  shadow?: { x: number; y: number; blur: number; color: string };
  cornerRadius?: number; // For rounded rectangles
  
  // Image/Signature specific properties
  src?: string; // base64 or URL
  
  // Image adjustment properties
  brightness?: number;    // 0-200, default 100
  contrast?: number;      // 0-200, default 100
  saturation?: number;    // 0-200, default 100
  imgBlur?: number;       // 0-20, default 0
  imgGrayscale?: number;  // 0-100, default 0
  exposure?: number;      // 0-200, default 100
  warmth?: number;        // 0-200, default 100 (sepia-based)
  flipH?: boolean;
  flipV?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  clipShape?: 'none' | 'circle' | 'rounded' | 'ellipse' | 'polygon';
  clipPath?: string;
  
  // Visual Overlay Architecture Properties
  isOriginalPdfElement?: boolean; // native PDF extracted text or OCR text
  isModified?: boolean;           // true if edited or dragged/resized
  isDeleted?: boolean;            // true if deleted (kept in state for export masking)
  
  // Original spatial cache to perform surgical whiteouts
  originalText?: string;
  originalX?: number;
  originalY?: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface PageDimension {
  width: number;
  height: number;
}

interface EditorState {
  // Document State
  pdfUrl: string | null;
  pdfBytes: Uint8Array | null;
  fileName: string | null;
  totalPages: number;
  pageDimensions: PageDimension[];
  currentPageIndex: number;
  pageOrders: number[]; // e.g. [0, 1, 2] -> can be reordered
  
  // Layout & UI State
  layoutMode: 'vertical' | 'horizontal';
  zoomPanelPos: { x: number; y: number } | null;
  zoomPanelLocked: boolean;
  zoomPanelSize: 'sm' | 'md' | 'lg';
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  bottomDockHeight: number;
  mobileSidebarOpen: 'left' | 'right' | null;

  // Canvas State
  activeTool: 'select' | 'pan' | 'text' | 'image' | 'signature' | 'shape' | 'draw' | 'erase' | 'annotation';
  zoom: number; // 0.1 to 4.0
  panOffset: { x: number; y: number };
  selectedElementIds: string[];
  hoveredElementId: string | null;
  activeElementId: string | null; // Textbox editing mode
  
  // Elements
  elements: EditorElement[];
  
  // Styling Defaults
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  shapeType: EditorElement['shapeType'];
  
  // Drawing tool properties
  drawingStyle: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'brush' | 'calligraphy' | 'fineliner';
  drawingOpacity: number;
  drawingSmoothing: number;
  eraserSize: number;
  
  // Reusable Signatures
  signatures: string[];
  
  // OCR State
  isOcrRunning: boolean;
  ocrProgress: number;
  ocrTargetPageIndex: number | null;
  
  // Undo/Redo Stack
  past: EditorElement[][];
  future: EditorElement[][];
  
  // Document level operations
  setPdf: (url: string | null, bytes: Uint8Array | null, name: string | null, dimensions: PageDimension[]) => void;
  setCurrentPageIndex: (index: number) => void;
  setPageOrders: (orders: number[]) => void;
  duplicatePageInState: (pageIndex: number) => void;
  deletePageInState: (pageIndex: number) => void;
  insertBlankPageInState: (afterPageIndex: number, width?: number, height?: number) => void;
  
  // Layout operations
  setLayoutMode: (mode: 'vertical' | 'horizontal') => void;
  setZoomPanelPos: (pos: { x: number; y: number } | null) => void;
  setZoomPanelLocked: (locked: boolean) => void;
  setZoomPanelSize: (size: 'sm' | 'md' | 'lg') => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setBottomDockHeight: (height: number) => void;
  setMobileSidebarOpen: (side: 'left' | 'right' | null) => void;

  // Tool & Canvas operations
  setActiveTool: (tool: 'select' | 'pan' | 'text' | 'image' | 'signature' | 'shape' | 'draw' | 'erase' | 'annotation') => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setHoveredElementId: (id: string | null) => void;
  setActiveElementId: (id: string | null) => void;
  
  // Element operations
  addElement: (element: Omit<EditorElement, 'id'>, selectOnAdd?: boolean) => string;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  smartReplaceImage: (id: string, newSrc: string) => void;
  deleteElement: (id: string) => void;
  restoreElement: (id: string) => void;
  
  // Defaults operations
  setTextColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: 'normal' | 'bold') => void;
  setFontStyle: (style: 'normal' | 'italic') => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setShapeType: (shape: NonNullable<EditorElement['shapeType']>) => void;
  setDrawingStyle: (style: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'brush' | 'calligraphy' | 'fineliner') => void;
  setDrawingOpacity: (opacity: number) => void;
  setDrawingSmoothing: (smoothing: number) => void;
  setEraserSize: (size: number) => void;
  
  // Signatures
  addSignature: (signatureData: string) => void;
  
  // OCR operations
  setOcrState: (running: boolean, progress: number, targetPage?: number | null) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  resetHistory: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial Document State
  pdfUrl: null,
  pdfBytes: null,
  fileName: null,
  totalPages: 0,
  pageDimensions: [],
  currentPageIndex: 0,
  pageOrders: [],
  
  // Initial Layout & UI State
  layoutMode: 'vertical',
  zoomPanelPos: null,
  zoomPanelLocked: true,
  zoomPanelSize: 'md',
  leftSidebarWidth: 256,
  rightSidebarWidth: 256,
  bottomDockHeight: 288,
  mobileSidebarOpen: null,

  // Initial Canvas State
  activeTool: 'select',
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  selectedElementIds: [],
  hoveredElementId: null,
  activeElementId: null,
  
  // Initial Elements
  elements: [],
  
  // Styling Defaults
  textColor: '#09090b', // obsidian primary or zinc-900
  fontFamily: 'Helvetica',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  strokeColor: '#3b82f6', // blue-500
  fillColor: 'transparent',
  strokeWidth: 2,
  shapeType: 'rect',
  drawingStyle: 'pen',
  drawingOpacity: 1.0,
  drawingSmoothing: 3,
  eraserSize: 15,
  
  // Reusable Signatures
  signatures: [],
  
  // OCR State
  isOcrRunning: false,
  ocrProgress: 0,
  ocrTargetPageIndex: null,
  
  // History Stacks
  past: [],
  future: [],
  
  // Document Operations
  setPdf: (url, bytes, name, dimensions) => set({
    pdfUrl: url,
    pdfBytes: bytes ? bytes.slice(0) : null, // Clone bytes buffer securely to prevent detached state
    fileName: name,
    totalPages: dimensions.length,
    pageDimensions: dimensions,
    currentPageIndex: 0,
    pageOrders: Array.from({ length: dimensions.length }, (_, i) => i),
    elements: [],
    past: [],
    future: [],
    selectedElementIds: [],
    activeElementId: null
  }),
  
  // Layout Updaters
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setZoomPanelPos: (pos) => set({ zoomPanelPos: pos }),
  setZoomPanelLocked: (locked) => set({ zoomPanelLocked: locked }),
  setZoomPanelSize: (size) => set({ zoomPanelSize: size }),
  setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
  setBottomDockHeight: (height) => set({ bottomDockHeight: height }),
  setMobileSidebarOpen: (side) => set({ mobileSidebarOpen: side }),
  
  setCurrentPageIndex: (index) => set({ currentPageIndex: index }),
  
  setPageOrders: (orders) => {
    // Record history
    const currentElements = get().elements;
    set((state) => ({
      pageOrders: orders,
      past: [...state.past, currentElements],
      future: []
    }));
  },
  
  duplicatePageInState: (pageIndex) => {
    set((state) => {
      const newOrders = [...state.pageOrders];
      const visualIndex = newOrders.indexOf(pageIndex);
      if (visualIndex === -1) return {};
      
      const newPageIndex = state.pageDimensions.length; // Next virtual page index
      const sourceDimensions = state.pageDimensions[pageIndex];
      const newDimensions = [...state.pageDimensions, { ...sourceDimensions }];
      
      // Duplicate elements on this page
      const pageElements = state.elements.filter(el => el.pageIndex === pageIndex);
      const duplicatedElements = pageElements.map(el => ({
        ...el,
        id: Math.random().toString(36).substr(2, 9),
        pageIndex: newPageIndex
      }));
      
      // Insert right after the source page visually
      newOrders.splice(visualIndex + 1, 0, newPageIndex);
      
      return {
        pageDimensions: newDimensions,
        totalPages: newDimensions.length,
        pageOrders: newOrders,
        elements: [...state.elements, ...duplicatedElements],
        past: [...state.past, state.elements],
        future: []
      };
    });
  },
  
  deletePageInState: (pageIndex) => {
    set((state) => {
      const newOrders = state.pageOrders.filter(idx => idx !== pageIndex);
      // Remove elements belonging to that page
      const newElements = state.elements.filter(el => el.pageIndex !== pageIndex);
      
      let nextPageIndex = state.currentPageIndex;
      const visualIndex = state.pageOrders.indexOf(pageIndex);
      if (state.currentPageIndex === pageIndex) {
        if (newOrders.length === 0) {
          nextPageIndex = 0;
        } else {
          // select next page visually or previous if it was the last page
          const nextVisualIndex = Math.min(visualIndex, newOrders.length - 1);
          nextPageIndex = newOrders[nextVisualIndex];
        }
      }
      
      return {
        pageOrders: newOrders,
        elements: newElements,
        currentPageIndex: nextPageIndex,
        past: [...state.past, state.elements],
        future: []
      };
    });
  },
  
  insertBlankPageInState: (afterPageIndex, width = 595, height = 842) => {
    set((state) => {
      const newPageIndex = state.pageDimensions.length;
      const newDimensions = [...state.pageDimensions, { width, height }];
      const newOrders = [...state.pageOrders];
      
      const visualIndex = newOrders.indexOf(afterPageIndex);
      if (visualIndex === -1) {
        // Append at the end
        newOrders.push(newPageIndex);
      } else {
        newOrders.splice(visualIndex + 1, 0, newPageIndex);
      }
      
      return {
        pageDimensions: newDimensions,
        totalPages: newDimensions.length,
        pageOrders: newOrders,
        past: [...state.past, state.elements],
        future: []
      };
    });
  },
  
  // Tool & Canvas Operations
  setActiveTool: (tool) => set({ activeTool: tool, selectedElementIds: [], activeElementId: null }),
  
  setZoom: (zoom) => set((state) => {
    const nextZoom = typeof zoom === 'function' ? zoom(state.zoom) : zoom;
    return { zoom: Math.min(Math.max(nextZoom, 0.1), 4.0) };
  }),
  
  setPanOffset: (offset) => set((state) => ({
    panOffset: typeof offset === 'function' ? offset(state.panOffset) : offset
  })),
  
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  setHoveredElementId: (id) => set({ hoveredElementId: id }),
  setActiveElementId: (id) => set({ activeElementId: id }),
  
  // Element Operations
  addElement: (element, selectOnAdd = true) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newElement: EditorElement = {
      ...element,
      id
    };
    
    set((state) => {
      const nextElements = [...state.elements, newElement];
      return {
        elements: nextElements,
        selectedElementIds: selectOnAdd ? [id] : [],
        past: [...state.past, state.elements],
        future: []
      };
    });
    
    return id;
  },
  
  updateElement: (id, updates) => {
    set((state) => {
      const nextElements = state.elements.map((el) => {
        if (el.id === id) {
          let isModified = el.isModified;
          if (el.isOriginalPdfElement) {
            const finalEl = { ...el, ...updates };
            const textChanged = finalEl.text !== el.originalText;
            const srcChanged = finalEl.src !== el.src;
            const xChanged = finalEl.x !== el.originalX;
            const yChanged = finalEl.y !== el.originalY;
            const wChanged = finalEl.width !== el.originalWidth;
            const hChanged = finalEl.height !== el.originalHeight;
            const rChanged = (finalEl.rotation || 0) !== 0;
            
            isModified = textChanged || srcChanged || xChanged || yChanged || wChanged || hChanged || rChanged;
          }
          return { 
            ...el, 
            ...updates,
            isModified
          };
        }
        return el;
      });
      
      return {
        elements: nextElements
      };
    });
  },

  smartReplaceImage: (id, newSrc) => {
    set((state) => {
      const currentElements = state.elements;
      const target = currentElements.find(el => el.id === id);
      if (!target) return {};

      const updatedElements = currentElements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            src: newSrc,
            // Automatically inherit original image container properties:
            // position (x, y), width, height, rotation, opacity, clipping, crop, shape/frame
            objectFit: el.objectFit || 'cover',
            isModified: true,
          };
        }
        return el;
      });

      return {
        elements: updatedElements,
        past: [...state.past, currentElements],
        future: []
      };
    });
  },
  
  deleteElement: (id) => {
    set((state) => {
      const elToDelete = state.elements.find(el => el.id === id);
      let nextElements;
      
      if (elToDelete?.isOriginalPdfElement) {
        // Untouched original text layers are NOT deleted from state; they are flagged as deleted
        // so that pdf-lib export layer knows to cover them up with a whiteout mask!
        nextElements = state.elements.map((el) => {
          if (el.id === id) {
            return { ...el, isDeleted: true };
          }
          return el;
        });
      } else {
        // Newly added elements are removed completely
        nextElements = state.elements.filter((el) => el.id !== id);
      }
      
      return {
        elements: nextElements,
        selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id),
        activeElementId: state.activeElementId === id ? null : state.activeElementId,
        past: [...state.past, state.elements],
        future: []
      };
    });
  },
  
  restoreElement: (id) => {
    set((state) => {
      const el = state.elements.find(e => e.id === id);
      if (!el || !el.isOriginalPdfElement) return {};
      
      const nextElements = state.elements.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            text: e.originalText || e.text,
            x: e.originalX ?? e.x,
            y: e.originalY ?? e.y,
            width: e.originalWidth ?? e.width,
            height: e.originalHeight ?? e.height,
            rotation: 0,
            isModified: false,
            isDeleted: false,
          };
        }
        return e;
      });
      
      return {
        elements: nextElements,
        selectedElementIds: [id],
        past: [...state.past, state.elements],
        future: [],
      };
    });
  },
  
  // Default Settings Operations
  setTextColor: (color) => set({ textColor: color }),
  setFontFamily: (font) => set({ fontFamily: font }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontWeight: (weight) => set({ fontWeight: weight }),
  setFontStyle: (style) => set({ fontStyle: style }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setShapeType: (shape) => set({ shapeType: shape }),
  setDrawingStyle: (style) => set({ drawingStyle: style }),
  setDrawingOpacity: (opacity) => set({ drawingOpacity: opacity }),
  setDrawingSmoothing: (smoothing) => set({ drawingSmoothing: smoothing }),
  setEraserSize: (size) => set({ eraserSize: size }),
  
  // Signatures
  addSignature: (sig) => set((state) => {
    if (state.signatures.includes(sig)) return {};
    return { signatures: [...state.signatures, sig] };
  }),
  
  // OCR operations
  setOcrState: (running, progress, targetPage = null) => set({
    isOcrRunning: running,
    ocrProgress: progress,
    ocrTargetPageIndex: targetPage
  }),
  
  // Undo/Redo Engine
  undo: () => {
    const { past, elements, future } = get();
    if (past.length === 0) return;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    set({
      elements: previous,
      past: newPast,
      future: [elements, ...future],
      selectedElementIds: [] // clear selection to avoid orphaned handles
    });
  },
  
  redo: () => {
    const { past, elements, future } = get();
    if (future.length === 0) return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    set({
      elements: next,
      past: [...past, elements],
      future: newFuture,
      selectedElementIds: []
    });
  },
  
  resetHistory: () => set({ past: [], future: [] })
}));
