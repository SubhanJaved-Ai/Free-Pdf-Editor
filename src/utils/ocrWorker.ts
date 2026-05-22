// Client-side scanned page OCR using Tesseract.js
import { createWorker } from 'tesseract.js';
import { EditorElement } from '../store/useEditorStore';

export interface OcrResult {
  text: string;
  elements: EditorElement[];
}

export async function runOcrOnPage(
  imageSource: string | HTMLCanvasElement,
  pageIndex: number,
  pageWidth: number,
  pageHeight: number,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  // Initialize worker
  const worker = await createWorker('eng', 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing' && onProgress) {
        onProgress(m.progress);
      }
    }
  });

  try {
    // Perform recognition
    const { data }: any = await worker.recognize(imageSource);
    const elements: EditorElement[] = [];

    if (!data || !data.lines || !Array.isArray(data.lines)) {
      return {
        text: data?.text || '',
        elements: []
      };
    }

    // Map recognized words/lines to editable text elements
    // We map at the 'line' level to make text boxes naturally sized and editable rather than single words
    data.lines.forEach((line: any, index: number) => {
      if (!line.text || line.text.trim() === '') return;

      const bbox = line.bbox; // { x0, y0, x1, y1 }
      if (!bbox) return;

      const x = bbox.x0;
      const y = bbox.y0;
      const w = bbox.x1 - bbox.x0;
      const h = bbox.y1 - bbox.y0;

      // Convert coordinates from image pixels to visual percentage coordinates
      // Assuming the image fits the full width/height of the canvas matching page dimensions
      const elX = (x / pageWidth) * 100;
      const elY = (y / pageHeight) * 100;
      const elW = (w / pageWidth) * 100;
      const elH = (h / pageHeight) * 100;

      elements.push({
        id: `ocr-${pageIndex}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        pageIndex,
        type: 'text',
        x: elX,
        y: elY,
        width: elW,
        height: elH,
        rotation: 0,
        opacity: 1.0,
        text: line.text.replace(/\n/g, ' ').trim(),
        fontSize: Math.max(h * 0.8, 10), // Font size estimate from height of bounding box
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        align: 'left',
        isOriginalPdfElement: true, // Treat OCR lines as originals so we cover up behind them
        isModified: false,
        isDeleted: false,
        originalText: line.text.replace(/\n/g, ' ').trim(),
        originalX: elX,
        originalY: elY,
        originalWidth: elW,
        originalHeight: elH
      });
    });

    return {
      text: data.text,
      elements
    };
  } finally {
    // Clean up worker
    await worker.terminate();
  }
}
export default runOcrOnPage;
