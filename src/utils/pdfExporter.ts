// Client-side PDF Exporter utilizing pdf-lib
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { EditorElement, PageDimension } from '../store/useEditorStore';

// Convert hex color to PDF rgb object
function hexToRgb(hex?: string) {
  if (!hex) return rgb(0, 0, 0);
  
  // Strip # if present
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  
  return rgb(
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b
  );
}

// Embed helper to handle dataURIs (images / signatures)
async function embedDataUriImage(pdfDoc: PDFDocument, dataUri: string) {
  try {
    // Extract base64 part
    const parts = dataUri.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const base64Data = parts[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    if (contentType === 'image/png') {
      return await pdfDoc.embedPng(binaryData);
    } else if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
      return await pdfDoc.embedJpg(binaryData);
    }
  } catch (err) {
    console.error('Failed to embed image:', err);
  }
  return null;
}

export interface ExportSettings {
  fileName: string;
  optimizeSize: boolean;
}

export async function exportEditedPdf(
  originalPdfBytes: Uint8Array,
  elements: EditorElement[],
  pageOrders: number[],
  pageDimensions: PageDimension[],
  settings: ExportSettings
): Promise<Uint8Array> {
  // 1. Load original document
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const originalPages = pdfDoc.getPages();
  
  // 2. Create the target PDF Document (handles reordering, duplicates, and new pages)
  const targetPdf = await PDFDocument.create();
  
  // Cache embedded fonts
  const fontCache: Record<string, any> = {
    'Helvetica': await targetPdf.embedFont(StandardFonts.Helvetica),
    'Helvetica-Bold': await targetPdf.embedFont(StandardFonts.HelveticaBold),
    'Helvetica-Oblique': await targetPdf.embedFont(StandardFonts.HelveticaOblique),
    'Courier': await targetPdf.embedFont(StandardFonts.Courier),
    'Courier-Bold': await targetPdf.embedFont(StandardFonts.CourierBold),
    'Courier-Oblique': await targetPdf.embedFont(StandardFonts.CourierOblique),
    'Times-Roman': await targetPdf.embedFont(StandardFonts.TimesRoman),
    'Times-Bold': await targetPdf.embedFont(StandardFonts.TimesRomanBold),
    'Times-Italic': await targetPdf.embedFont(StandardFonts.TimesRomanItalic),
  };
  
  // For each page in our visual pageOrders array, compile it
  for (let visualPageIndex = 0; visualPageIndex < pageOrders.length; visualPageIndex++) {
    const originalPageIndex = pageOrders[visualPageIndex];
    let newPage: any;
    let pageWidth = 595;
    let pageHeight = 842;
    
    if (originalPageIndex < originalPages.length) {
      // Copy existing page from the original document
      const [copiedPage] = await targetPdf.copyPages(pdfDoc, [originalPageIndex]);
      newPage = targetPdf.addPage(copiedPage);
      
      const size = newPage.getSize();
      pageWidth = size.width;
      pageHeight = size.height;
    } else {
      // Create a brand new blank page
      const dim = pageDimensions[originalPageIndex] || { width: 595, height: 842 };
      pageWidth = dim.width;
      pageHeight = dim.height;
      newPage = targetPdf.addPage([pageWidth, pageHeight]);
    }
    
    // 3. Find and apply elements belonging to this page
    // An element belongs to page index "originalPageIndex" in visual sequence
    const pageElements = elements.filter(el => el.pageIndex === originalPageIndex);
    
    for (const el of pageElements) {
      // Calculate coordinates in PDF Points space (origin bottom-left)
      const elX = (el.x / 100) * pageWidth;
      const elWidth = (el.width / 100) * pageWidth;
      const elHeight = (el.height / 100) * pageHeight;
      // PDF y coordinate is from bottom, visual y is from top.
      // Visual top y corresponds to (pageHeight - visualY - visualHeight)
      const elY = pageHeight - ((el.y / 100) * pageHeight) - elHeight;
      
      const rotationDegrees = degrees(el.rotation || 0);
      
      // --- SURGICAL MASKING & INJECTION LOGIC FOR ORIGINAL ELEMENTS ---
      if (el.isOriginalPdfElement) {
        if (!el.isModified && !el.isDeleted) {
          // Untouched background elements remain 100% losslessly preserved
          continue;
        }

        // Calculate original spatial bounds in PDF Points space for precise surgical whiteout
        const origX = (el.originalX !== undefined ? el.originalX : el.x) / 100 * pageWidth;
        const origWidth = (el.originalWidth !== undefined ? el.originalWidth : el.width) / 100 * pageWidth;
        const origHeight = (el.originalHeight !== undefined ? el.originalHeight : el.height) / 100 * pageHeight;
        const origY = pageHeight - (((el.originalY !== undefined ? el.originalY : el.y) / 100) * pageHeight) - origHeight;

        // Draw precise whiteout rectangle to cover up the original background text
        newPage.drawRectangle({
          x: origX - 2,
          y: origY - 2,
          width: origWidth + 4,
          height: origHeight + 4,
          color: rgb(1, 1, 1), // solid white mask
          opacity: 1.0,
        });

        if (el.isDeleted) {
          // Deleted elements are whited-out but not redrawn
          continue;
        }
      }
      
      if (el.type === 'text' && el.text) {
        // Font Selection
        let fontKey = 'Helvetica';
        if (el.fontFamily === 'Courier New') fontKey = 'Courier';
        else if (el.fontFamily === 'Times New Roman') fontKey = 'Times-Roman';
        
        if (el.fontWeight === 'bold') {
          fontKey = fontKey === 'Times-Roman' ? 'Times-Bold' : `${fontKey}-Bold`;
        }
        if (el.fontStyle === 'italic') {
          fontKey = fontKey === 'Times-Roman' ? 'Times-Italic' : `${fontKey}-Oblique`;
        }
        
        const selectedFont = fontCache[fontKey] || fontCache['Helvetica'];
        
        // Calculate the first line's baseline precisely from the visual top of the bounding box
        // This prevents multiline displacement and vertical misalignment when text boxes are resized.
        const firstLineY = pageHeight - ((el.y / 100) * pageHeight) - (el.fontSize || 14) * 0.85;
        
        newPage.drawText(el.text, {
          x: elX,
          y: firstLineY, 
          size: el.fontSize || 14,
          font: selectedFont,
          color: hexToRgb(el.color),
          rotate: rotationDegrees,
          opacity: el.opacity,
          maxWidth: elWidth,
          lineHeight: el.lineHeight ? el.lineHeight * (el.fontSize || 14) : (el.fontSize || 14) * 1.2,
        });
      }
      
      else if ((el.type === 'image' || el.type === 'signature') && el.src) {
        const embeddedImage = await embedDataUriImage(targetPdf, el.src);
        if (embeddedImage) {
          newPage.drawImage(embeddedImage, {
            x: elX,
            y: elY,
            width: elWidth,
            height: elHeight,
            rotate: rotationDegrees,
            opacity: el.opacity
          });
        }
      }
      
      else if (el.type === 'shape' && el.shapeType) {
        const borderStrokeColor = el.strokeColor ? hexToRgb(el.strokeColor) : undefined;
        const fillSolidColor = el.fillColor && el.fillColor !== 'transparent' ? hexToRgb(el.fillColor) : undefined;
        
        if (el.shapeType === 'rect') {
          newPage.drawRectangle({
            x: elX,
            y: elY,
            width: elWidth,
            height: elHeight,
            borderColor: borderStrokeColor,
            borderWidth: el.strokeWidth,
            color: fillSolidColor,
            opacity: el.opacity,
            rotate: rotationDegrees
          });
        } else if (el.shapeType === 'circle') {
          const rx = elWidth / 2;
          const ry = elHeight / 2;
          newPage.drawEllipse({
            x: elX + rx,
            y: elY + ry,
            xScale: rx,
            yScale: ry,
            borderColor: borderStrokeColor,
            borderWidth: el.strokeWidth,
            color: fillSolidColor,
            opacity: el.opacity,
            rotate: rotationDegrees
          });
        } else if (el.shapeType === 'line') {
          newPage.drawLine({
            start: { x: elX, y: elY + elHeight },
            end: { x: elX + elWidth, y: elY },
            color: borderStrokeColor || rgb(0, 0, 0),
            thickness: el.strokeWidth || 2,
            opacity: el.opacity
          });
        } else if (el.shapeType === 'arrow') {
          // Draw standard line first
          const startX = elX;
          const startY = elY + elHeight;
          const endX = elX + elWidth;
          const endY = elY;
          
          newPage.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            color: borderStrokeColor || rgb(0, 0, 0),
            thickness: el.strokeWidth || 2,
            opacity: el.opacity
          });
          
          // Draw a small arrow head
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowLength = 10;
          
          const x1 = endX - arrowLength * Math.cos(angle - Math.PI / 6);
          const y1 = endY - arrowLength * Math.sin(angle - Math.PI / 6);
          const x2 = endX - arrowLength * Math.cos(angle + Math.PI / 6);
          const y2 = endY - arrowLength * Math.sin(angle + Math.PI / 6);
          
          newPage.drawLine({
            start: { x: endX, y: endY },
            end: { x: x1, y: y1 },
            color: borderStrokeColor || rgb(0, 0, 0),
            thickness: el.strokeWidth || 2,
            opacity: el.opacity
          });
          
          newPage.drawLine({
            start: { x: endX, y: endY },
            end: { x: x2, y: y2 },
            color: borderStrokeColor || rgb(0, 0, 0),
            thickness: el.strokeWidth || 2,
            opacity: el.opacity
          });
        }
      }
      
      else if (el.type === 'drawing' && el.points && el.points.length > 1) {
        // Draw series of lines mapping freehand strokes
        const drawColor = el.strokeColor ? hexToRgb(el.strokeColor) : rgb(0, 0, 0);
        const thickness = el.strokeWidth || 2;
        
        for (let i = 0; i < el.points.length - 1; i++) {
          const pt1 = el.points[i];
          const pt2 = el.points[i + 1];
          
          // Points are visual percent coordinates. Convert to page points.
          const x1 = (pt1.x / 100) * pageWidth;
          const y1 = pageHeight - ((pt1.y / 100) * pageHeight);
          const x2 = (pt2.x / 100) * pageWidth;
          const y2 = pageHeight - ((pt2.y / 100) * pageHeight);
          
          newPage.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            color: drawColor,
            thickness: thickness,
            opacity: el.opacity
          });
        }
      }
      
      else if (el.type === 'annotation' && el.text) {
        // Draw sticky notes as a soft yellow overlay block with comment icon, or standard highlights
        // Standard Highlight annotation
        if (el.shapeType === 'rect') {
          newPage.drawRectangle({
            x: elX,
            y: elY,
            width: elWidth,
            height: elHeight,
            color: el.fillColor ? hexToRgb(el.fillColor) : rgb(1, 0.9, 0), // translucent yellow
            opacity: el.opacity || 0.4,
          });
        }
      }
    }
  }
  
  // 4. Save and return PDF bytes
  return await targetPdf.save({ useObjectStreams: !settings.optimizeSize });
}
export default exportEditedPdf;
