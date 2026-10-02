# Architecture Overview

## Core Architecture

Aether PDF is a **fully client-side** PDF editor. No file ever leaves the user's device. All processing happens in the browser.

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  pdfjs-dist  │───▶│  EditorStore │───▶│  pdf-lib  │  │
│  │  (renderer)  │    │  (Zustand)   │    │ (exporter)│  │
│  └──────────────┘    └──────────────┘    └───────────┘  │
│         │                   │                            │
│  ┌──────────────┐    ┌──────────────┐                    │
│  │  pdfParser   │    │  useAutoSave │                    │
│  │  (extractor) │    │  (IndexedDB) │                    │
│  └──────────────┘    └──────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Upload** → PDF bytes are read via `FileReader` and stored in `useEditorStore`
2. **Render** → `pdfjs-dist` renders each page to a `<canvas>` element
3. **Parse** → `pdfParser.ts` extracts text elements, images, and dimensions as `EditorElement[]`
4. **Edit** → Elements are mutated in Zustand store; the editor re-renders overlays on top of the canvas
5. **Auto-save** → `useAutoSave` debounces and persists state to IndexedDB every 30 seconds
6. **Export** → `pdfExporter.ts` reconstructs the PDF using `pdf-lib`, embedding fonts, images, and drawn shapes

## Key State: `EditorElement`

All editor objects (text, images, shapes, drawings) are typed as `EditorElement` in `useEditorStore.ts`:

```typescript
interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'drawing' | 'highlight' | 'signature';
  pageIndex: number;
  x: number; y: number;     // % of page dimensions
  width: number; height: number;
  isModified: boolean;
  isOriginalPdfElement: boolean;
  // ...type-specific fields
}
```

Coordinates are stored as percentages to be resolution-independent across zoom levels.

## PDF Worker

`pdfjs-dist` requires its worker to be served as a static file. The compiled worker is at:
```
public/pdf.worker.min.mjs
```
It is referenced via `GlobalWorkerOptions.workerSrc` in `pdfParser.ts` and `Canvas.tsx`.

## Font Embedding

Google Fonts are fetched at export time by `fontLoader.ts` and embedded into the output PDF as subsets. If a font cannot be fetched (offline), the export dialog warns the user and falls back to Helvetica.

## Deployment

Configured for **Netlify** via `netlify.toml`. The PDF worker and other static assets are served directly. No server-side functions are required.
