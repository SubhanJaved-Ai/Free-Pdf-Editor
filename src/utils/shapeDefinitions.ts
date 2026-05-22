// SVG path definitions for all supported shapes
// Each function returns an SVG path string for a 100x100 viewBox

export type ShapeId = 'rect' | 'rounded-rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'octagon' | 'star' | 'heart' | 'cloud' | 'line' | 'arrow' | 'double-arrow' | 'callout' | 'speech-bubble' | 'highlight-box' | 'underline-marker' | 'stamp';

export interface ShapeDefinition {
  id: ShapeId;
  label: string;
  category: 'basic' | 'lines' | 'flow' | 'document';
  // Returns SVG child elements as a string (path, rect, etc.)
  render: (fill: string, stroke: string, strokeWidth: number, dash?: number[]) => string;
}

// Helper: polygon points to path
function polygon(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
}

export const SHAPE_DEFINITIONS: ShapeDefinition[] = [
  // ─── BASIC ───
  {
    id: 'rect',
    label: 'Rectangle',
    category: 'basic',
    render: (f, s, sw) => `<rect x="${sw}" y="${sw}" width="${100-sw*2}" height="${100-sw*2}" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },
  {
    id: 'rounded-rect',
    label: 'Rounded Rect',
    category: 'basic',
    render: (f, s, sw) => `<rect x="${sw}" y="${sw}" width="${100-sw*2}" height="${100-sw*2}" rx="12" ry="12" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },
  {
    id: 'circle',
    label: 'Circle',
    category: 'basic',
    render: (f, s, sw) => `<circle cx="50" cy="50" r="${48-sw}" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    category: 'basic',
    render: (f, s, sw) => `<ellipse cx="50" cy="50" rx="${48-sw}" ry="${35-sw}" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },
  {
    id: 'triangle',
    label: 'Triangle',
    category: 'basic',
    render: (f, s, sw) => `<path d="${polygon([[50,4],[96,96],[4,96]])}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`
  },
  {
    id: 'diamond',
    label: 'Diamond',
    category: 'basic',
    render: (f, s, sw) => `<path d="${polygon([[50,2],[98,50],[50,98],[2,50]])}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`
  },
  {
    id: 'pentagon',
    label: 'Pentagon',
    category: 'basic',
    render: (f, s, sw) => {
      const pts: [number,number][] = Array.from({length: 5}, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return [50 + 46 * Math.cos(a), 50 + 46 * Math.sin(a)];
      });
      return `<path d="${polygon(pts)}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`;
    }
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    category: 'basic',
    render: (f, s, sw) => {
      const pts: [number,number][] = Array.from({length: 6}, (_, i) => {
        const a = (i * 60 - 90) * Math.PI / 180;
        return [50 + 46 * Math.cos(a), 50 + 46 * Math.sin(a)];
      });
      return `<path d="${polygon(pts)}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`;
    }
  },
  {
    id: 'octagon',
    label: 'Octagon',
    category: 'basic',
    render: (f, s, sw) => {
      const pts: [number,number][] = Array.from({length: 8}, (_, i) => {
        const a = (i * 45 - 90) * Math.PI / 180;
        return [50 + 46 * Math.cos(a), 50 + 46 * Math.sin(a)];
      });
      return `<path d="${polygon(pts)}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`;
    }
  },
  {
    id: 'star',
    label: 'Star',
    category: 'basic',
    render: (f, s, sw) => {
      const pts: [number,number][] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 46 : 20;
        const a = (i * 36 - 90) * Math.PI / 180;
        pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
      }
      return `<path d="${polygon(pts)}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`;
    }
  },
  {
    id: 'heart',
    label: 'Heart',
    category: 'basic',
    render: (f, s, sw) => `<path d="M50,88 C20,70 2,50 2,30 C2,14 14,4 28,4 C38,4 46,10 50,18 C54,10 62,4 72,4 C86,4 98,14 98,30 C98,50 80,70 50,88 Z" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },
  {
    id: 'cloud',
    label: 'Cloud',
    category: 'basic',
    render: (f, s, sw) => `<path d="M25,70 C10,70 2,60 2,52 C2,44 8,38 16,36 C14,30 18,20 30,18 C38,8 52,6 62,14 C68,8 80,8 86,16 C94,18 98,28 96,38 C98,44 98,54 88,58 C92,66 86,74 76,74 Z" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },

  // ─── LINES ───
  {
    id: 'line',
    label: 'Line',
    category: 'lines',
    render: (_f, s, sw) => `<line x1="4" y1="96" x2="96" y2="4" stroke="${s}" stroke-width="${sw}" stroke-linecap="round" />`
  },
  {
    id: 'arrow',
    label: 'Arrow',
    category: 'lines',
    render: (_f, s, sw) => `<line x1="4" y1="50" x2="85" y2="50" stroke="${s}" stroke-width="${sw}" stroke-linecap="round" /><polygon points="96,50 78,38 78,62" fill="${s}" />`
  },
  {
    id: 'double-arrow',
    label: 'Double Arrow',
    category: 'lines',
    render: (_f, s, sw) => `<line x1="18" y1="50" x2="82" y2="50" stroke="${s}" stroke-width="${sw}" /><polygon points="4,50 22,38 22,62" fill="${s}" /><polygon points="96,50 78,38 78,62" fill="${s}" />`
  },

  // ─── FLOW ───
  {
    id: 'callout',
    label: 'Callout',
    category: 'flow',
    render: (f, s, sw) => `<path d="M4,4 H96 V65 H55 L45,90 L40,65 H4 Z" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round" />`
  },
  {
    id: 'speech-bubble',
    label: 'Speech Bubble',
    category: 'flow',
    render: (f, s, sw) => `<path d="M15,8 H85 Q96,8 96,20 V55 Q96,67 85,67 H45 L28,90 L32,67 H15 Q4,67 4,55 V20 Q4,8 15,8 Z" fill="${f}" stroke="${s}" stroke-width="${sw}" />`
  },

  // ─── DOCUMENT ───
  {
    id: 'highlight-box',
    label: 'Highlight Box',
    category: 'document',
    render: (f, s, sw) => `<rect x="${sw}" y="${sw}" width="${100-sw*2}" height="${100-sw*2}" rx="4" fill="${f || 'rgba(250,204,21,0.3)'}" stroke="${s || '#eab308'}" stroke-width="${sw}" />`
  },
  {
    id: 'underline-marker',
    label: 'Underline',
    category: 'document',
    render: (_f, s, sw) => `<line x1="4" y1="92" x2="96" y2="92" stroke="${s || '#ef4444'}" stroke-width="${Math.max(sw, 3)}" stroke-linecap="round" />`
  },
  {
    id: 'stamp',
    label: 'Stamp',
    category: 'document',
    render: (f, s, sw) => `<rect x="4" y="15" width="92" height="70" rx="8" fill="${f || 'rgba(239,68,68,0.1)'}" stroke="${s || '#ef4444'}" stroke-width="${Math.max(sw, 2)}" stroke-dasharray="6 3" /><text x="50" y="56" text-anchor="middle" font-size="18" font-weight="bold" fill="${s || '#ef4444'}" font-family="sans-serif">STAMP</text>`
  },
];

export function getShapeDefinition(shapeType: string): ShapeDefinition | undefined {
  return SHAPE_DEFINITIONS.find(s => s.id === shapeType);
}

export function renderShapeSvgContent(
  shapeType: string,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  borderDash?: number[]
): string {
  const def = getShapeDefinition(shapeType);
  if (!def) return '';
  let svg = def.render(fillColor, strokeColor, strokeWidth, borderDash);
  if (borderDash && borderDash.length > 0) {
    svg = svg.replace(/stroke-dasharray="[^"]*"/g, ''); // Remove existing
    svg = svg.replace(/(stroke="[^"]*")/g, `$1 stroke-dasharray="${borderDash.join(' ')}"`);
  }
  return svg;
}
