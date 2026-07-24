// Client-side PDF Parser utilizing pdfjs-dist
import { EditorElement, PageDimension } from '../store/useEditorStore';

let pdfjsLib: any = null;

// Dynamically load PDF.js client-side
export async function getPdfjsLib() {
  if (pdfjsLib) return pdfjsLib;
  
  if (typeof window !== 'undefined') {
    const pdfjs = await import('pdfjs-dist');
    // Set up the worker URL locally
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLib = pdfjs;
    return pdfjs;
  }
  return null;
}

export interface ParsedPdf {
  pageDimensions: PageDimension[];
  elements: EditorElement[];
  totalPages: number;
}

export async function parsePdfLayout(pdfBytesOrDoc: Uint8Array | any): Promise<ParsedPdf> {
  const pdfjs = await getPdfjsLib();
  if (!pdfjs) throw new Error('PDF.js could not be initialized client-side.');
  
  let pdfDoc: any;
  if (pdfBytesOrDoc && typeof pdfBytesOrDoc.numPages === 'number') {
    pdfDoc = pdfBytesOrDoc;
  } else {
    // Clone bytes buffer securely to prevent detached state in worker
    const bytes = pdfBytesOrDoc instanceof Uint8Array ? pdfBytesOrDoc : new Uint8Array(pdfBytesOrDoc);
    const clone = new Uint8Array(bytes.length);
    clone.set(bytes);
    const loadingTask = pdfjs.getDocument({ data: clone });
    pdfDoc = await loadingTask.promise;
  }
  const totalPages = pdfDoc.numPages;
  
  const pageDimensions: PageDimension[] = [];
  const elements: EditorElement[] = [];
  
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1.0 });
    
    const width = viewport.width;
    const height = viewport.height;
    pageDimensions.push({ width, height });
    
    // Extract text layout
    const textContent = await page.getTextContent();
    
    textContent.items.forEach((item: any) => {
      // item has str, transform, width, height, fontName
      if (!item.str || item.str.trim() === '') return;
      
      // Transform matrix coordinates [scaleX, skewY, skewX, scaleY, translateX, translateY]
      // In PDF coordinates, origin is bottom-left.
      // pdfjs-dist viewport converts coordinates to top-left for us.
      const tx = item.transform[4];
      const ty = item.transform[5];
      
      // Convert to page relative coordinates in viewport space
      const [x, y] = viewport.convertToViewportPoint(tx, ty);
      
      // Bounding box dimensions
      const itemHeight = Math.abs(item.transform[3] || 12);
      // Average width estimation if item.width is not set
      const itemWidth = item.width || (item.str.length * itemHeight * 0.6);
      
      // Create text element for overlay visual editing
      const elementId = `orig-${pageIndex}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Check for RTL text or specific languages
      const isRtl = /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(item.str);
      
      elements.push({
        id: elementId,
        pageIndex,
        type: 'text',
        // Convert to percentage coordinates for fluid scaling
        x: (x / width) * 100,
        y: ((y - itemHeight) / height) * 100, // adjust y slightly to top-left alignment
        width: (itemWidth / width) * 100,
        height: (itemHeight / height) * 100,
        rotation: 0,
        opacity: 1.0,
        text: item.str,
        fontSize: itemHeight,
        fontFamily: translateFontFamily(item.fontName),
        fontWeight: item.fontName?.toLowerCase().includes('bold') ? 'bold' : 'normal',
        fontStyle: item.fontName?.toLowerCase().includes('italic') ? 'italic' : 'normal',
        color: '#000000', // default black, pdfjs-dist doesn't extract color easily in getTextContent, we'll let user change it
        align: isRtl ? 'right' : 'left',
        isOriginalPdfElement: true,
        isModified: false,
        isDeleted: false,
        originalText: item.str,
        originalX: (x / width) * 100,
        originalY: ((y - itemHeight) / height) * 100,
        originalWidth: (itemWidth / width) * 100,
        originalHeight: (itemHeight / height) * 100
      });
    });

    // Extract native PDF images from operator list
    try {
      const operatorList = await page.getOperatorList();
      const fnArray = operatorList.fnArray;
      const argsArray = operatorList.argsArray;
      
      let currentCtm = [1, 0, 0, 1, 0, 0];
      const ctmStack: number[][] = [];

      for (let i = 0; i < fnArray.length; i++) {
        const fn = fnArray[i];
        const args = argsArray[i];

        if (pdfjs.OPS && fn === pdfjs.OPS.save) {
          ctmStack.push([...currentCtm]);
        } else if (pdfjs.OPS && fn === pdfjs.OPS.restore) {
          if (ctmStack.length > 0) {
            currentCtm = ctmStack.pop()!;
          }
        } else if (pdfjs.OPS && fn === pdfjs.OPS.transform) {
          const [a1, b1, c1, d1, e1, f1] = currentCtm;
          const [a2, b2, c2, d2, e2, f2] = args;
          currentCtm = [
            a1 * a2 + c1 * b2,
            b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2,
            b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1,
            b1 * e2 + d1 * f2 + f1
          ];
        } else if (pdfjs.OPS && (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject)) {
          const imgName = args[0];
          const [a, b, c, d, tx, ty] = currentCtm;

          const pdfW = Math.hypot(a, b);
          const pdfH = Math.hypot(c, d);
          const rotationRad = Math.atan2(b, a);
          const rotationDeg = Math.round((rotationRad * 180) / Math.PI);

          const [vx1, vy1] = viewport.convertToViewportPoint(tx, ty);
          const [vx2, vy2] = viewport.convertToViewportPoint(tx + a, ty + b);
          const [vx3, vy3] = viewport.convertToViewportPoint(tx + c, ty + d);

          const minX = Math.min(vx1, vx2, vx3);
          const minY = Math.min(vy1, vy2, vy3);
          const maxX = Math.max(vx1, vx2, vx3);
          const maxY = Math.max(vy1, vy2, vy3);

          const vWidth = Math.max(maxX - minX, Math.abs(pdfW));
          const vHeight = Math.max(maxY - minY, Math.abs(pdfH));

          const posX = (minX / width) * 100;
          const posY = (minY / height) * 100;
          const posW = (vWidth / width) * 100;
          const posH = (vHeight / height) * 100;

          const aspectRatio = vWidth / (vHeight || 1);
          const isCircle = Math.abs(aspectRatio - 1.0) < 0.08;

          let imgDataUrl: string | undefined;
          try {
            if (page.objs && typeof page.objs.has === 'function' && page.objs.has(imgName)) {
              const imgObj = page.objs.get(imgName);
              if (imgObj && imgObj.data) {
                const canvas = document.createElement('canvas');
                canvas.width = imgObj.width || 100;
                canvas.height = imgObj.height || 100;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  const imgData = ctx.createImageData(canvas.width, canvas.height);
                  imgData.data.set(imgObj.data);
                  ctx.putImageData(imgData, 0, 0);
                  imgDataUrl = canvas.toDataURL('image/png');
                }
              }
            }
          } catch (e) {
            // Silently ignore obj retrieval errors
          }

          const elementId = `orig-img-${pageIndex}-${Math.random().toString(36).substr(2, 9)}`;

          elements.push({
            id: elementId,
            pageIndex,
            type: 'image',
            x: Math.max(0, Math.min(100, posX)),
            y: Math.max(0, Math.min(100, posY)),
            width: Math.max(1, Math.min(100, posW)),
            height: Math.max(1, Math.min(100, posH)),
            rotation: rotationDeg,
            opacity: 1.0,
            src: imgDataUrl || '',
            objectFit: 'cover',
            clipShape: isCircle ? 'circle' : 'none',
            isOriginalPdfElement: true,
            isModified: false,
            isDeleted: false,
            originalX: posX,
            originalY: posY,
            originalWidth: posW,
            originalHeight: posH
          });
        }
      }
    } catch (err) {
      console.warn('[PDF_PARSER] Image operator extraction notice:', err);
    }
  }
  
  return {
    pageDimensions,
    elements,
    totalPages
  };
}

// Convert native PDF font names to standard visual font equivalents
function translateFontFamily(fontName?: string): string {
  if (!fontName) return 'Helvetica';
  
  const name = fontName.toLowerCase();
  if (name.includes('times') || name.includes('roman') || name.includes('serif')) {
    return 'Times New Roman';
  }
  if (name.includes('courier') || name.includes('mono') || name.includes('code')) {
    return 'Courier New';
  }
  if (name.includes('arial') || name.includes('sans')) {
    return 'Arial';
  }
  
  // Extract real font name if it's a subset like AAAAAA+OpenSans
  if (fontName.includes('+')) {
    const realName = fontName.split('+')[1];
    // Add spaces before capital letters for camel case fonts, e.g., "OpenSans" -> "Open Sans"
    const spacedName = realName.replace(/([A-Z])/g, ' $1').trim();
    return spacedName || realName;
  }
  
  return fontName;
}
