// Client-side PDF Exporter utilizing pdf-lib
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { EditorElement, PageDimension } from '../store/useEditorStore';
import { renderShapeSvgContent } from './shapeDefinitions';

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
  
  console.log("==========================================");
  console.log("[DEBUG: EXPORT START]");
  console.log("Total Elements:", elements.length);
  console.log("ALL ELEMENTS:", JSON.parse(JSON.stringify(elements)));
  console.log("SHAPE ELEMENTS ONLY:", JSON.parse(JSON.stringify(elements.filter(e => String(e.type).includes('shape')))));
  console.log("==========================================");
  
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
    console.log(`[EXPORT DEBUG] Page ${visualPageIndex} has ${pageElements.length} elements.`);
    
    // HARD TEST: Draw a huge red rectangle on every page
    console.log("[DEBUG] Drawing HARD TEST red rectangle on page:", visualPageIndex);
    try {
      newPage.drawRectangle({
        x: 10, y: 10, width: 200, height: 200, color: rgb(1, 0, 0), opacity: 1.0
      });
      console.log("[DEBUG] Hard test rectangle drawn successfully");
    } catch (e) {
      console.error("[DEBUG ERROR] Hard test rectangle failed:", e);
    }
    
    for (const el of pageElements) {
      console.log(`[EXPORT DEBUG] Processing element: id=${el.id}, type=${el.type}, shapeType=${el.shapeType}`);
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
        console.log(`[DEBUG] Found shape: id=${el.id}, shapeType=${el.shapeType}`);
        
        // Parse basic colors
        const parseColor = (colStr?: string) => {
          if (!colStr || colStr === 'none' || colStr === 'transparent') return undefined;
          if (colStr.startsWith('rgba')) {
            const parts = colStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (parts) return hexToRgb(`#${parseInt(parts[1]).toString(16).padStart(2,'0')}${parseInt(parts[2]).toString(16).padStart(2,'0')}${parseInt(parts[3]).toString(16).padStart(2,'0')}`);
          }
          return hexToRgb(colStr);
        };
        
        // FORCE STYLE TEST AS REQUESTED BY USER
        console.log("[DEBUG] Forcing shape styles (RED FILL, BLACK STROKE, OPACITY 1)");
        const drawFill = rgb(1, 0, 0); // Force Red
        const drawStroke = rgb(0, 0, 0); // Force Black
        const drawFillOpacity = 1.0;
        const drawStrokeOpacity = 1.0;
        const sW = el.strokeWidth || 2;
        
        if (el.shapeType === 'circle' || el.shapeType === 'ellipse') {
          console.log("[DEBUG] Drawing shape using drawEllipse");
          // pdf-lib's drawEllipse correctly rotates around the center of the bounding box
          newPage.drawEllipse({
            x: elX + elWidth/2,
            y: elY + elHeight/2,
            xScale: elWidth/2,
            yScale: elHeight/2,
            color: drawFill,
            borderColor: drawStroke,
            borderWidth: sW,
            opacity: drawFillOpacity,
            borderOpacity: drawStrokeOpacity,
            rotate: degrees(-(el.rotation || 0))
          });
        } else {
          console.log("[DEBUG] Drawing shape using drawSvgPath (parsed SVG)");
          // For all other shapes (rectangles, polygons, stars, flowcharts), we parse the SVG path.
          // This guarantees perfect center-anchored WYSIWYG rotations and proportions.
          const svgContent = renderShapeSvgContent(el.shapeType, el.fillColor || '', el.strokeColor || '', sW, el.borderDash);
          
          const parseAndTransformSvgPath = (pathStr: string, elX: number, elY: number, elW: number, elH: number, angleDeg: number) => {
            const rad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            const transform = (x: number, y: number) => {
              const sx = (x / 100) * elW;
              const sy = (y / 100) * elH;
              const cxLocal = elW / 2;
              const cyLocal = elH / 2;
              const rx = (sx - cxLocal) * cos - (sy - cyLocal) * sin + cxLocal;
              const ry = (sx - cxLocal) * sin + (sy - cyLocal) * cos + cyLocal;
              return { x: elX + rx, y: (elY + elH) - ry };
            };

            const regex = /([MLCQHVZmlcqhvz])([^A-Za-z]*)/g;
            let match;
            let newPath = '';
            let currX = 0;
            let currY = 0;
            
            while ((match = regex.exec(pathStr)) !== null) {
              const cmd = match[1].toUpperCase();
              const argsStr = match[2].trim().replace(/,/g, ' ').replace(/\s+/g, ' ');
              const args = argsStr ? argsStr.split(' ').map(Number) : [];
              
              if (cmd === 'M' || cmd === 'L') {
                const pt = transform(args[0], args[1]);
                newPath += `${cmd} ${pt.x} ${pt.y} `;
                currX = args[0]; currY = args[1];
              } else if (cmd === 'C') {
                const pt1 = transform(args[0], args[1]);
                const pt2 = transform(args[2], args[3]);
                const pt3 = transform(args[4], args[5]);
                newPath += `C ${pt1.x} ${pt1.y} ${pt2.x} ${pt2.y} ${pt3.x} ${pt3.y} `;
                currX = args[4]; currY = args[5];
              } else if (cmd === 'Q') {
                const pt1 = transform(args[0], args[1]);
                const pt2 = transform(args[2], args[3]);
                newPath += `Q ${pt1.x} ${pt1.y} ${pt2.x} ${pt2.y} `;
                currX = args[2]; currY = args[3];
              } else if (cmd === 'H') {
                const pt = transform(args[0], currY);
                newPath += `L ${pt.x} ${pt.y} `;
                currX = args[0];
              } else if (cmd === 'V') {
                const pt = transform(currX, args[0]);
                newPath += `L ${pt.x} ${pt.y} `;
                currY = args[0];
              } else if (cmd === 'Z') {
                newPath += 'Z ';
              }
            }
            return newPath.trim();
          };

          const tagRegex = /<(path|line|polygon|rect)\s+([^>]+)>/g;
          let match;
          while ((match = tagRegex.exec(svgContent)) !== null) {
            const tag = match[1];
            const attrsStr = match[2];
            
            let pathData = '';
            if (tag === 'path') {
              const dMatch = /d="([^"]+)"/.exec(attrsStr);
              if (dMatch) pathData = dMatch[1];
            } else if (tag === 'line') {
              const x1 = /x1="([^"]+)"/.exec(attrsStr);
              const y1 = /y1="([^"]+)"/.exec(attrsStr);
              const x2 = /x2="([^"]+)"/.exec(attrsStr);
              const y2 = /y2="([^"]+)"/.exec(attrsStr);
              if (x1 && y1 && x2 && y2) {
                pathData = `M${x1[1]},${y1[1]} L${x2[1]},${y2[1]}`;
              }
            } else if (tag === 'polygon') {
              const ptsMatch = /points="([^"]+)"/.exec(attrsStr);
              if (ptsMatch) {
                const pts = ptsMatch[1].trim().split(/\s+/).map(p => p.split(',').map(Number));
                pathData = pts.map((p, i) => `${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
              }
            } else if (tag === 'rect') {
              const rX = parseFloat(/x="([^"]+)"/.exec(attrsStr)?.[1] || '0');
              const rY = parseFloat(/y="([^"]+)"/.exec(attrsStr)?.[1] || '0');
              const rW = parseFloat(/width="([^"]+)"/.exec(attrsStr)?.[1] || '100');
              const rH = parseFloat(/height="([^"]+)"/.exec(attrsStr)?.[1] || '100');
              pathData = `M${rX},${rY} L${rX+rW},${rY} L${rX+rW},${rY+rH} L${rX},${rY+rH} Z`;
            }

            if (pathData) {
              const transformedPath = parseAndTransformSvgPath(pathData, elX, elY, elWidth, elHeight, el.rotation || 0);
              
              let localFill = drawFill;
              let localStroke = drawStroke;
              if (/fill="[^"]+"/.test(attrsStr) && !/fill="none"/.test(attrsStr)) {
                // For compound shapes where the sub-element overrides the color (e.g. arrow heads)
                if (!attrsStr.includes('fill="rgba') && !attrsStr.includes('fill="#')) {
                  // Fallback override logic
                  localFill = drawStroke;
                }
              }
              
              console.log("[DEBUG] About to call drawSvgPath with:", transformedPath);
              try {
                newPage.drawSvgPath(transformedPath, {
                  color: localFill,
                  borderColor: localStroke,
                  borderWidth: sW,
                  opacity: drawFillOpacity,
                  borderOpacity: drawStrokeOpacity,
                });
                console.log("[DEBUG] drawSvgPath success");
              } catch (e) {
                console.error("[DEBUG ERROR] drawSvgPath failed:", e);
              }
            }
          }
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
