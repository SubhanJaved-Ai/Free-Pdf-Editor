# Aether PDF Editor

A powerful, browser-based PDF editor built with Next.js 16, React 19, and pdf-lib. Edit text, draw shapes, annotate, add images, use OCR, and export professional PDFs — all client-side with zero server uploads.

## ✨ Features

- **Text Editing** — Click any text element to edit it in-place with full font/color/size control
- **Shape Drawing** — Rectangle, circle, ellipse, triangle, arrow, line, and custom SVG paths
- **Image Insertion** — Drag-and-drop or paste images directly onto any page
- **Annotations** — Highlight, underline, strikethrough, freehand drawing
- **OCR** — Extract text from scanned PDFs via Tesseract.js (runs fully in-browser)
- **PDF Tools** — Merge, split, compress, rotate, crop, reorder, delete pages, add watermarks, page numbers, and more
- **Export** — Exports the final PDF with all edits baked in via pdf-lib
- **Auto-Save** — Edits are continuously saved to IndexedDB for session recovery
- **Creator Branding** — Built by Subhan Javed

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| PDF Rendering | pdfjs-dist 5 |
| PDF Export | pdf-lib |
| OCR | Tesseract.js 7 |
| State | Zustand 5 |
| Persistence | idb-keyval (IndexedDB) |
| Icons | Lucide React |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout + metadata
│   ├── globals.css           # Global styles & design tokens
│   ├── editor/               # Main PDF editor route
│   └── tools/                # Individual PDF tool pages
│       ├── merge-pdf/
│       ├── split-pdf/
│       ├── compress-pdf/
│       ├── rotate-pdf/
│       ├── crop-pdf/
│       ├── reorder-pages/
│       ├── delete-pages/
│       ├── extract-pages/
│       ├── add-watermark/
│       ├── page-numbers/
│       ├── redact-pdf/
│       ├── resize-pdf/
│       ├── unlock-pdf/
│       ├── ocr-pdf/
│       ├── pdf-to-jpg/
│       ├── jpg-to-pdf/
│       ├── batch-rename/
│       └── edit-metadata/
├── components/
│   ├── editor/               # Editor canvas, toolbars, sidebars
│   ├── landing/              # Landing page components
│   ├── layout/               # Navbar, Footer
│   └── common/               # Shared UI components
├── store/
│   └── useEditorStore.ts     # Zustand editor state
├── hooks/
│   └── useAutoSave.ts        # IndexedDB session persistence
├── utils/
│   ├── pdfParser.ts          # PDF text/image element extraction
│   ├── pdfExporter.ts        # PDF export with pdf-lib
│   ├── pdf-tools.ts          # Merge, split, compress, etc.
│   ├── fontLoader.ts         # Google Fonts fetcher for export
│   ├── colorExtractor.ts     # Canvas-based color sampling
│   ├── ocrWorker.ts          # Tesseract.js OCR integration
│   └── shapeDefinitions.ts   # SVG path definitions for shapes
└── config/
    └── branding.ts           # App-wide branding constants
```

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🌐 Deployment

This project is configured for [Netlify](https://netlify.com) via `netlify.toml`.

```bash
npm run build
```

The `out/` or `.next/` directory is served by the hosting platform.

## 👤 Author

**Subhan Javed** — [LinkedIn](https://linkedin.com/in/subhan-javed)
