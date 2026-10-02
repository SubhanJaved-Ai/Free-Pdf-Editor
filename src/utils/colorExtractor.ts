/**
 * High-precision canvas glyph-core pixel sampling and background color detection.
 * Extracts the exact perceived rendered RGB color of text and background from an HTML Canvas.
 */

export interface ExtractedColorResult {
  textColor: string;       // hex e.g. '#2563eb'
  backgroundColor: string; // hex e.g. '#ffffff'
  contrast: number;        // Euclidean RGB distance between text and background
  isDarkBackground: boolean;
}

/**
 * Convert RGB numbers to #rrggbb hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract the true rendered color of text and its background within an element's bounding box.
 * 
 * @param ctx 2D rendering context of the rendered PDF canvas
 * @param xPct Element X position as % of page width (0 - 100)
 * @param yPct Element Y position as % of page height (0 - 100)
 * @param wPct Element width as % of page width (0 - 100)
 * @param hPct Element height as % of page height (0 - 100)
 * @param canvasW Canvas pixel width
 * @param canvasH Canvas pixel height
 */
export function extractTextColorFromCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  xPct: number,
  yPct: number,
  wPct: number,
  hPct: number,
  canvasW: number,
  canvasH: number
): ExtractedColorResult | null {
  try {
    const boxX = Math.max(0, Math.floor((xPct / 100) * canvasW));
    const boxY = Math.max(0, Math.floor((yPct / 100) * canvasH));
    const boxW = Math.min(canvasW - boxX, Math.ceil((wPct / 100) * canvasW));
    const boxH = Math.min(canvasH - boxY, Math.ceil((hPct / 100) * canvasH));

    if (boxW <= 2 || boxH <= 2) return null;

    const imgData = ctx.getImageData(boxX, boxY, boxW, boxH);
    const data = imgData.data;

    // 1. Detect background color by sampling perimeter pixels
    const bgRList: number[] = [];
    const bgGList: number[] = [];
    const bgBList: number[] = [];

    // Step size to keep sampling fast even for wide headings
    const stepX = Math.max(1, Math.floor(boxW / 25));
    const stepY = Math.max(1, Math.floor(boxH / 10));

    // Top and bottom borders
    for (let x = 0; x < boxW; x += stepX) {
      // Top row
      let idx = x * 4;
      if (data[idx + 3] > 200) {
        bgRList.push(data[idx]);
        bgGList.push(data[idx + 1]);
        bgBList.push(data[idx + 2]);
      }
      // Bottom row
      idx = ((boxH - 1) * boxW + x) * 4;
      if (data[idx + 3] > 200) {
        bgRList.push(data[idx]);
        bgGList.push(data[idx + 1]);
        bgBList.push(data[idx + 2]);
      }
    }

    // Left and right borders
    for (let y = 0; y < boxH; y += stepY) {
      let idx = (y * boxW) * 4;
      if (data[idx + 3] > 200) {
        bgRList.push(data[idx]);
        bgGList.push(data[idx + 1]);
        bgBList.push(data[idx + 2]);
      }
      idx = (y * boxW + (boxW - 1)) * 4;
      if (data[idx + 3] > 200) {
        bgRList.push(data[idx]);
        bgGList.push(data[idx + 1]);
        bgBList.push(data[idx + 2]);
      }
    }

    if (bgRList.length === 0) {
      // Fallback: default to white
      bgRList.push(255);
      bgGList.push(255);
      bgBList.push(255);
    }

    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    const bgR = median(bgRList);
    const bgG = median(bgGList);
    const bgB = median(bgBList);
    const isDarkBg = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) < 128;
    const bgHex = rgbToHex(bgR, bgG, bgB);

    // 2. Identify text stroke pixels (pixels that contrast with the background)
    interface FgPixel {
      r: number;
      g: number;
      b: number;
      dist: number;
    }

    const fgPixels: FgPixel[] = [];
    const minContrastThreshold = 35; // Minimum Euclidean RGB distance to count as foreground stroke

    // Scan the inner area (skip 1px boundary to avoid adjacent element bleeding)
    const scanStepX = Math.max(1, Math.floor(boxW / 120));
    const scanStepY = 1;

    for (let y = 0; y < boxH; y += scanStepY) {
      const rowOffset = y * boxW * 4;
      for (let x = 0; x < boxW; x += scanStepX) {
        const idx = rowOffset + x * 4;
        const alpha = data[idx + 3];
        if (alpha < 128) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
        if (dist >= minContrastThreshold) {
          fgPixels.push({ r, g, b, dist });
        }
      }
    }

    // If no distinct text pixels detected, fallback to black or white based on background
    if (fgPixels.length < 5) {
      return {
        textColor: isDarkBg ? '#ffffff' : '#000000',
        backgroundColor: bgHex,
        contrast: 255,
        isDarkBackground: isDarkBg,
      };
    }

    // 3. Extract the deepest stroke-core pixels
    // Sort descending by contrast distance from background. The highest-contrast pixels
    // are in the dead-center of the font glyph strokes, avoiding subpixel anti-aliasing halos.
    fgPixels.sort((a, b) => b.dist - a.dist);

    // Take top 25% of highest-contrast pixels (minimum 8 pixels)
    const coreCount = Math.max(8, Math.floor(fgPixels.length * 0.25));
    const corePixels = fgPixels.slice(0, coreCount);

    const textR = median(corePixels.map(p => p.r));
    const textG = median(corePixels.map(p => p.g));
    const textB = median(corePixels.map(p => p.b));
    const avgDist = median(corePixels.map(p => p.dist));

    return {
      textColor: rgbToHex(textR, textG, textB),
      backgroundColor: bgHex,
      contrast: avgDist,
      isDarkBackground: isDarkBg,
    };
  } catch (err) {
    console.warn('[COLOR_EXTRACTOR] Error sampling canvas:', err);
    return null;
  }
}

/**
 * Batch-extract colors for all text elements on a rendered page.
 */
export function extractColorsForElements(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  elements: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  canvasW: number,
  canvasH: number
): Map<string, ExtractedColorResult> {
  const results = new Map<string, ExtractedColorResult>();
  for (const el of elements) {
    const res = extractTextColorFromCanvas(ctx, el.x, el.y, el.width, el.height, canvasW, canvasH);
    if (res) {
      results.set(el.id, res);
    }
  }
  return results;
}
