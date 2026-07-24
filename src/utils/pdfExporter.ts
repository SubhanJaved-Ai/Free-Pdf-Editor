// Client-side PDF Exporter utilizing pdf-lib
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { EditorElement, PageDimension } from '../store/useEditorStore';
import { renderShapeSvgContent } from './shapeDefinitions';

// ─── Color Helpers ────────────────────────────────────────────────────────────

function hexToRgb(colorInput?: any) {
  if (!colorInput) return rgb(0, 0, 0);
  let hex = '';
  if (typeof colorInput === 'string') {
    hex = colorInput;
  } else if (typeof colorInput === 'object' && typeof colorInput.toHex === 'function') {
    hex = colorInput.toHex();
  } else {
    return rgb(0, 0, 0);
  }
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

function parseColor(colStr?: string) {
  if (!colStr || colStr === 'none' || colStr === 'transparent') return undefined;
  if (colStr.startsWith('rgba')) {
    const parts = colStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (parts) {
      return hexToRgb(
        `#${parseInt(parts[1]).toString(16).padStart(2, '0')}` +
        `${parseInt(parts[2]).toString(16).padStart(2, '0')}` +
        `${parseInt(parts[3]).toString(16).padStart(2, '0')}`
      );
    }
  }
  if (colStr.startsWith('rgb(')) {
    const parts = colStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (parts) {
      return hexToRgb(
        `#${parseInt(parts[1]).toString(16).padStart(2, '0')}` +
        `${parseInt(parts[2]).toString(16).padStart(2, '0')}` +
        `${parseInt(parts[3]).toString(16).padStart(2, '0')}`
      );
    }
  }
  return hexToRgb(colStr);
}

// ─── Image Embedding ──────────────────────────────────────────────────────────

async function embedDataUriImage(pdfDoc: PDFDocument, dataUri: string) {
  try {
    const parts = dataUri.split(';base64,');
    const contentType = parts[0]?.split(':')[1] || 'image/png';
    const base64Data = parts[1] || parts[0];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    if (contentType === 'image/png') return await pdfDoc.embedPng(binaryData);
    if (contentType === 'image/jpeg' || contentType === 'image/jpg') return await pdfDoc.embedJpg(binaryData);
    // Fallback: embed as PNG if unsupported type
    return await pdfDoc.embedPng(binaryData);
  } catch (err) {
    console.error('Failed to embed image:', err);
  }
  return null;
}

/**
 * Processes replacement image to apply object-fit: cover, frame shape clipping (circle, rounded, custom path),
 * and image filters before embedding into exported PDF. Preserves full natural resolution (300-600 DPI).
 */
async function processImageForExport(el: EditorElement, targetWidthPx: number, targetHeightPx: number): Promise<string> {
  if (typeof window === 'undefined' || !el.src) return el.src || '';

  const isCircle = el.clipShape === 'circle';
  const isRounded = el.clipShape === 'rounded' || (el.cornerRadius && el.cornerRadius > 0);
  const hasFilter = (el.brightness && el.brightness !== 100) ||
                    (el.contrast && el.contrast !== 100) ||
                    (el.saturation && el.saturation !== 100) ||
                    (el.imgBlur && el.imgBlur > 0) ||
                    (el.imgGrayscale && el.imgGrayscale > 0) ||
                    (el.exposure && el.exposure !== 100) ||
                    (el.warmth && el.warmth !== 100) ||
                    el.flipH || el.flipV;
  const objectFit = el.objectFit || (el.type === 'image' ? 'cover' : 'contain');
  const requiresCoverFit = objectFit === 'cover';

  // If no clipping, no filters, and no cover fit needed, bypass canvas to preserve 100% original raw image bytes losslessly
  if (!isCircle && !isRounded && !el.clipPath && !hasFilter && !requiresCoverFit) {
    return el.src;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Preserve full natural resolution of the image (or target at least 300 DPI = 4x PDF points)
      const naturalW = img.naturalWidth || 1000;
      const naturalH = img.naturalHeight || 1000;

      const canvasW = Math.max(naturalW, Math.round(targetWidthPx * 4));
      const canvasH = Math.max(naturalH, Math.round(targetHeightPx * 4));

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(el.src || '');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Frame Shape Clipping
      if (isCircle) {
        ctx.beginPath();
        const r = Math.min(canvasW, canvasH) / 2;
        ctx.arc(canvasW / 2, canvasH / 2, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      } else if (isRounded) {
        const scale = canvasW / (targetWidthPx || 1);
        const rad = Math.min((el.cornerRadius || 16) * scale, Math.min(canvasW, canvasH) / 2);
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(0, 0, canvasW, canvasH, rad);
        } else {
          ctx.rect(0, 0, canvasW, canvasH);
        }
        ctx.closePath();
        ctx.clip();
      }

      // 2. Object Fit Scaling (cover vs contain vs stretch)
      let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;
      let dx = 0, dy = 0, dWidth = canvasW, dHeight = canvasH;

      if (objectFit === 'cover') {
        const imgAspect = img.naturalWidth / (img.naturalHeight || 1);
        const targetAspect = canvasW / (canvasH || 1);

        if (imgAspect > targetAspect) {
          sHeight = img.naturalHeight;
          sWidth = img.naturalHeight * targetAspect;
          sx = (img.naturalWidth - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.naturalWidth;
          sHeight = img.naturalWidth / targetAspect;
          sx = 0;
          sy = (img.naturalHeight - sHeight) / 2;
        }
      } else if (objectFit === 'contain') {
        const imgAspect = img.naturalWidth / (img.naturalHeight || 1);
        const targetAspect = canvasW / (canvasH || 1);

        if (imgAspect > targetAspect) {
          dWidth = canvasW;
          dHeight = canvasW / imgAspect;
          dx = 0;
          dy = (canvasH - dHeight) / 2;
        } else {
          dHeight = canvasH;
          dWidth = canvasH * imgAspect;
          dx = (canvasW - dWidth) / 2;
          dy = 0;
        }
      }

      // 3. Image Filters & Transforms
      const brightness = el.brightness ?? 100;
      const contrast = el.contrast ?? 100;
      const saturation = el.saturation ?? 100;
      const blur = el.imgBlur ?? 0;
      const grayscale = el.imgGrayscale ?? 0;
      const filterParts: string[] = [];
      if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`);
      if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`);
      if (saturation !== 100) filterParts.push(`saturate(${saturation}%)`);
      if (blur > 0) filterParts.push(`blur(${blur * 2}px)`);
      if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`);
      if (filterParts.length > 0) ctx.filter = filterParts.join(' ');

      if (el.flipH || el.flipV) {
        ctx.save();
        ctx.translate(el.flipH ? canvasW : 0, el.flipV ? canvasH : 0);
        ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      if (el.flipH || el.flipV) {
        ctx.restore();
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(el.src || '');
    img.src = el.src || '';
  });
}

// ─── Shape Drawing ────────────────────────────────────────────────────────────
//
// pdf-lib's drawSvgPath coordinate mapping:
//   PDF_x = options.x + pathX
//   PDF_y = options.y - pathY   ← pdf-lib flips Y internally
//
// Our SVG viewBox is 0–100 (y-down). Correct approach:
//   1. Scale each SVG point (0-100) → element-local pixels:
//        localX = (svgX / 100) * elW
//        localY = (svgY / 100) * elH   (still y-down)
//   2. Apply rotation around element center in local (y-down) space
//   3. Rebuild path string with rotated local pixel coordinates
//   4. Call drawSvgPath with { x: elX, y: elY + elH }
//      → pdf-lib maps: PDF_x = elX + localX  ✓
//                      PDF_y = (elY+elH) - localY  ✓  (y-down → y-up)
//
// This correctly renders BOTH fill color AND stroke color in the exported PDF.
// ─────────────────────────────────────────────────────────────────────────────

/** Rotate a local-space point around the element center. */
function rotateLocal(
  lx: number, ly: number,
  elW: number, elH: number,
  cos: number, sin: number
): { x: number; y: number } {
  const cx = elW / 2;
  const cy = elH / 2;
  const dx = lx - cx;
  const dy = ly - cy;
  return { x: dx * cos - dy * sin + cx, y: dx * sin + dy * cos + cy };
}

/** Format a point for an SVG path string. */
function ptStr(p: { x: number; y: number }): string {
  return `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
}

/**
 * Convert an SVG path (0-100 viewBox, y-down) to element-local pixel coords
 * (y-down) with rotation baked in. The result is fed to drawSvgPath with
 * x=elX, y=elY+elH so pdf-lib's internal Y-flip produces correct PDF coords.
 */
function buildLocalSvgPath(
  pathData: string,
  elW: number,
  elH: number,
  angleDeg: number
): string {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Scale from 0-100 SVG space to element-local pixel space, then rotate
  const tf = (svgX: number, svgY: number) =>
    rotateLocal((svgX / 100) * elW, (svgY / 100) * elH, elW, elH, cos, sin);

  const regex = /([MLCQHVZmlcqhvz])([^A-Za-z]*)/g;
  let m: RegExpExecArray | null;
  let out = '';
  let curX = 0, curY = 0; // current position in 0-100 SVG space
  let subX = 0, subY = 0; // subpath start

  while ((m = regex.exec(pathData)) !== null) {
    const cmd = m[1];
    const rawArgs = m[2].trim().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const a = rawArgs ? rawArgs.split(' ').filter(Boolean).map(Number) : [];

    switch (cmd) {
      case 'M': {
        curX = a[0]; curY = a[1]; subX = curX; subY = curY;
        out += `M ${ptStr(tf(curX, curY))} `;
        for (let i = 2; i + 1 < a.length; i += 2) {
          curX = a[i]; curY = a[i + 1];
          out += `L ${ptStr(tf(curX, curY))} `;
        }
        break;
      }
      case 'm': {
        curX += a[0]; curY += a[1]; subX = curX; subY = curY;
        out += `M ${ptStr(tf(curX, curY))} `;
        for (let i = 2; i + 1 < a.length; i += 2) {
          curX += a[i]; curY += a[i + 1];
          out += `L ${ptStr(tf(curX, curY))} `;
        }
        break;
      }
      case 'L': {
        for (let i = 0; i + 1 < a.length; i += 2) {
          curX = a[i]; curY = a[i + 1];
          out += `L ${ptStr(tf(curX, curY))} `;
        }
        break;
      }
      case 'l': {
        for (let i = 0; i + 1 < a.length; i += 2) {
          curX += a[i]; curY += a[i + 1];
          out += `L ${ptStr(tf(curX, curY))} `;
        }
        break;
      }
      case 'H': {
        for (let i = 0; i < a.length; i++) { curX = a[i]; out += `L ${ptStr(tf(curX, curY))} `; }
        break;
      }
      case 'h': {
        for (let i = 0; i < a.length; i++) { curX += a[i]; out += `L ${ptStr(tf(curX, curY))} `; }
        break;
      }
      case 'V': {
        for (let i = 0; i < a.length; i++) { curY = a[i]; out += `L ${ptStr(tf(curX, curY))} `; }
        break;
      }
      case 'v': {
        for (let i = 0; i < a.length; i++) { curY += a[i]; out += `L ${ptStr(tf(curX, curY))} `; }
        break;
      }
      case 'C': {
        for (let i = 0; i + 5 < a.length; i += 6) {
          out += `C ${ptStr(tf(a[i], a[i+1]))} ${ptStr(tf(a[i+2], a[i+3]))} ${ptStr(tf(a[i+4], a[i+5]))} `;
          curX = a[i+4]; curY = a[i+5];
        }
        break;
      }
      case 'c': {
        for (let i = 0; i + 5 < a.length; i += 6) {
          out += `C ${ptStr(tf(curX+a[i], curY+a[i+1]))} ${ptStr(tf(curX+a[i+2], curY+a[i+3]))} ${ptStr(tf(curX+a[i+4], curY+a[i+5]))} `;
          curX += a[i+4]; curY += a[i+5];
        }
        break;
      }
      case 'Q': {
        for (let i = 0; i + 3 < a.length; i += 4) {
          out += `Q ${ptStr(tf(a[i], a[i+1]))} ${ptStr(tf(a[i+2], a[i+3]))} `;
          curX = a[i+2]; curY = a[i+3];
        }
        break;
      }
      case 'q': {
        for (let i = 0; i + 3 < a.length; i += 4) {
          out += `Q ${ptStr(tf(curX+a[i], curY+a[i+1]))} ${ptStr(tf(curX+a[i+2], curY+a[i+3]))} `;
          curX += a[i+2]; curY += a[i+3];
        }
        break;
      }
      case 'Z':
      case 'z': {
        out += 'Z ';
        curX = subX; curY = subY;
        break;
      }
      default: break;
    }
  }
  return out.trim();
}

/**
 * Draw a shape (defined as SVG path in 0-100 viewBox) onto a PDF page,
 * preserving both fill color and stroke color.
 */
function drawShapeOnPage(
  page: any,
  pathData: string,
  elX: number, elY: number, elW: number, elH: number,
  rotation: number,
  fillColor: any,
  strokeColor: any,
  strokeWidth: number,
  opacity: number,
  strokeOpacity: number
) {
  if (!pathData.trim()) return;
  const localPath = buildLocalSvgPath(pathData, elW, elH, rotation);
  if (!localPath) return;

  try {
    page.drawSvgPath(localPath, {
      x: elX,
      y: elY + elH,           // pdf-lib flips Y: PDF_y = (elY+elH) - pathY ✓
      color: fillColor,        // fill
      borderColor: strokeColor, // stroke
      borderWidth: strokeColor ? strokeWidth : 0,
      opacity: opacity,
      borderOpacity: strokeOpacity,
    });
  } catch (e) {
    console.error('[SHAPE EXPORT] drawSvgPath failed:', e, '\nPath snippet:', localPath.slice(0, 200));
  }
}

// ─── Export Settings & Main Function ─────────────────────────────────────────

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
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const originalPages = pdfDoc.getPages();
  const targetPdf = await PDFDocument.create();

  console.log('==========================================');
  console.log('[EXPORT] Total elements:', elements.length);
  console.log('[EXPORT] Shape elements:', elements.filter(e => e.type === 'shape').length);
  console.log('==========================================');

  // Embed standard fonts
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

  for (let visualIdx = 0; visualIdx < pageOrders.length; visualIdx++) {
    const origIdx = pageOrders[visualIdx];
    let page: any;
    let pageW = 595;
    let pageH = 842;

    if (origIdx < originalPages.length) {
      const [copied] = await targetPdf.copyPages(pdfDoc, [origIdx]);
      page = targetPdf.addPage(copied);
      const size = page.getSize();
      pageW = size.width;
      pageH = size.height;
    } else {
      const dim = pageDimensions[origIdx] || { width: 595, height: 842 };
      pageW = dim.width;
      pageH = dim.height;
      page = targetPdf.addPage([pageW, pageH]);
    }

    const pageElements = elements.filter(el => el.pageIndex === origIdx);

    for (const el of pageElements) {
      // Convert element position (percentage) to PDF points (y-up, origin bottom-left)
      const elX = (el.x / 100) * pageW;
      const elW = (el.width / 100) * pageW;
      const elH = (el.height / 100) * pageH;
      const elY = pageH - ((el.y / 100) * pageH) - elH;
      const rot = degrees(el.rotation || 0);

      // ── Original PDF Elements: surgical masking ───────────────────────────
      if (el.isOriginalPdfElement) {
        if (!el.isModified && !el.isDeleted) continue; // untouched — preserved losslessly

        const origX = (el.originalX ?? el.x) / 100 * pageW;
        const origW = (el.originalWidth ?? el.width) / 100 * pageW;
        const origH = (el.originalHeight ?? el.height) / 100 * pageH;
        const origY = pageH - ((el.originalY ?? el.y) / 100 * pageH) - origH;

        page.drawRectangle({ x: origX - 2, y: origY - 2, width: origW + 4, height: origH + 4, color: rgb(1, 1, 1), opacity: 1.0 });

        if (el.isDeleted) continue;
      }

      // ── Text ──────────────────────────────────────────────────────────────
      if (el.type === 'text' && el.text) {
        let fontKey = 'Helvetica';
        if (el.fontFamily === 'Courier New') fontKey = 'Courier';
        else if (el.fontFamily === 'Times New Roman') fontKey = 'Times-Roman';
        if (el.fontWeight === 'bold') fontKey = fontKey === 'Times-Roman' ? 'Times-Bold' : `${fontKey}-Bold`;
        if (el.fontStyle === 'italic') fontKey = fontKey === 'Times-Roman' ? 'Times-Italic' : `${fontKey}-Oblique`;

        const font = fontCache[fontKey] || fontCache['Helvetica'];
        const firstLineY = pageH - ((el.y / 100) * pageH) - (el.fontSize || 14) * 0.85;

        page.drawText(el.text, {
          x: elX,
          y: firstLineY,
          size: el.fontSize || 14,
          font,
          color: hexToRgb(el.color),
          rotate: rot,
          opacity: el.opacity,
          maxWidth: elW,
          lineHeight: el.lineHeight ? el.lineHeight * (el.fontSize || 14) : (el.fontSize || 14) * 1.2,
        });
      }

      // ── Image / Signature ─────────────────────────────────────────────────
      else if ((el.type === 'image' || el.type === 'signature') && el.src) {
        const imageSrcToEmbed = el.type === 'image'
          ? await processImageForExport(el, elW, elH)
          : el.src;
        const embedded = await embedDataUriImage(targetPdf, imageSrcToEmbed);
        if (embedded) {
          page.drawImage(embedded, { x: elX, y: elY, width: elW, height: elH, rotate: rot, opacity: el.opacity });
        }
      }

      // ── Shapes ───────────────────────────────────────────────────────────
      else if (el.type === 'shape' && el.shapeType) {
        const fillColor = parseColor(el.fillColor);
        const strokeColor = parseColor(el.strokeColor);
        const opacity = el.opacity ?? 1.0;
        const sW = el.strokeWidth || 2;

        console.log(`[SHAPE] ${el.shapeType} fill=${el.fillColor} stroke=${el.strokeColor} w=${elW.toFixed(0)}×${elH.toFixed(0)}`);

        // ── Circle / Ellipse → native drawEllipse ─────────────────────────
        if (el.shapeType === 'circle' || el.shapeType === 'ellipse') {
          page.drawEllipse({
            x: elX + elW / 2,
            y: elY + elH / 2,
            xScale: elW / 2,
            yScale: elH / 2,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth: sW,
            opacity,
            borderOpacity: opacity,
            rotate: rot,
          });
        }

        // ── Rectangle → native drawRectangle ─────────────────────────────
        else if (el.shapeType === 'rect' || el.shapeType === 'rounded-rect') {
          const inset = sW / 2;
          page.drawRectangle({
            x: elX + inset,
            y: elY + inset,
            width: Math.max(elW - sW, 1),
            height: Math.max(elH - sW, 1),
            color: fillColor,
            borderColor: strokeColor,
            borderWidth: sW,
            opacity,
            borderOpacity: opacity,
            rotate: rot,
          });
        }

        // ── All other shapes → SVG path with fill+stroke ──────────────────
        else {
          const svgContent = renderShapeSvgContent(
            el.shapeType,
            el.fillColor || 'transparent',
            el.strokeColor || '#000000',
            sW,
            el.borderDash
          );

          const tagRegex = /<(path|line|polygon|rect|circle)\s+([^>]+)\/?>/g;
          let tagMatch: RegExpExecArray | null;

          while ((tagMatch = tagRegex.exec(svgContent)) !== null) {
            const tag = tagMatch[1];
            const attrsStr = tagMatch[2];
            let pathData = '';

            if (tag === 'path') {
              const d = /d="([^"]+)"/.exec(attrsStr);
              if (d) pathData = d[1];
            } else if (tag === 'line') {
              const x1 = /x1="([^"]+)"/.exec(attrsStr)?.[1];
              const y1 = /y1="([^"]+)"/.exec(attrsStr)?.[1];
              const x2 = /x2="([^"]+)"/.exec(attrsStr)?.[1];
              const y2 = /y2="([^"]+)"/.exec(attrsStr)?.[1];
              if (x1 && y1 && x2 && y2) pathData = `M${x1},${y1} L${x2},${y2}`;
            } else if (tag === 'polygon') {
              const pts = /points="([^"]+)"/.exec(attrsStr)?.[1];
              if (pts) {
                const pairs = pts.trim().split(/\s+/).map(p => p.split(','));
                pathData = pairs.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
              }
            } else if (tag === 'rect') {
              const rx = parseFloat(/x="([^"]+)"/.exec(attrsStr)?.[1] || '0');
              const ry = parseFloat(/y="([^"]+)"/.exec(attrsStr)?.[1] || '0');
              const rw = parseFloat(/width="([^"]+)"/.exec(attrsStr)?.[1] || '100');
              const rh = parseFloat(/height="([^"]+)"/.exec(attrsStr)?.[1] || '100');
              pathData = `M${rx},${ry} L${rx+rw},${ry} L${rx+rw},${ry+rh} L${rx},${ry+rh} Z`;
            } else if (tag === 'circle') {
              // Approximate circle as 32-segment polygon
              const cxv = parseFloat(/cx="([^"]+)"/.exec(attrsStr)?.[1] || '50');
              const cyv = parseFloat(/cy="([^"]+)"/.exec(attrsStr)?.[1] || '50');
              const rv = parseFloat(/r="([^"]+)"/.exec(attrsStr)?.[1] || '48');
              const circPts: string[] = [];
              for (let i = 0; i <= 32; i++) {
                const ang = (i / 32) * 2 * Math.PI;
                circPts.push(`${i === 0 ? 'M' : 'L'}${(cxv + rv * Math.cos(ang)).toFixed(2)},${(cyv + rv * Math.sin(ang)).toFixed(2)}`);
              }
              pathData = circPts.join(' ') + ' Z';
            }

            if (!pathData) continue;

            // Arrow heads (polygon sub-elements) should use stroke color as fill
            const localFill = (tag === 'polygon' && !/fill="none"/.test(attrsStr))
              ? strokeColor
              : fillColor;

            drawShapeOnPage(
              page, pathData,
              elX, elY, elW, elH,
              el.rotation || 0,
              localFill, strokeColor, sW,
              opacity, opacity
            );
          }
        }
      }

      // ── Freehand Drawing ──────────────────────────────────────────────────
      else if (el.type === 'drawing' && el.points && el.points.length > 1) {
        const drawColor = el.strokeColor ? hexToRgb(el.strokeColor) : rgb(0, 0, 0);
        const thickness = el.strokeWidth || 2;
        for (let i = 0; i < el.points.length - 1; i++) {
          const pt1 = el.points[i];
          const pt2 = el.points[i + 1];
          page.drawLine({
            start: { x: (pt1.x / 100) * pageW, y: pageH - ((pt1.y / 100) * pageH) },
            end:   { x: (pt2.x / 100) * pageW, y: pageH - ((pt2.y / 100) * pageH) },
            color: drawColor,
            thickness,
            opacity: el.opacity,
          });
        }
      }

      // ── Annotation ────────────────────────────────────────────────────────
      else if (el.type === 'annotation' && el.text && el.shapeType === 'rect') {
        page.drawRectangle({
          x: elX, y: elY, width: elW, height: elH,
          color: el.fillColor ? hexToRgb(el.fillColor) : rgb(1, 0.9, 0),
          opacity: el.opacity || 0.4,
        });
      }
    }
  }

  return await targetPdf.save({ useObjectStreams: !settings.optimizeSize });
}

export default exportEditedPdf;
