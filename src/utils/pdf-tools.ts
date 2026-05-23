import { PDFDocument, PDFPage, StandardFonts, degrees, rgb } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import JSZip from 'jszip';
// Re-use the existing pdfjs instance for consistent worker setup
import { getPdfjsLib } from './pdfParser';

/**
 * Merges multiple PDF files into a single PDF.
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Splits a PDF by returning a Zip file containing multiple PDFs or a single PDF depending on the ranges.
 * Range format: '1-5', '6-10', or empty for every page.
 */
export async function splitPdf(file: File, ranges: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  const zip = new JSZip();

  if (!ranges || ranges.trim() === '') {
    // Split every page
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      zip.file(`page-${i + 1}.pdf`, pdfBytes);
    }
  } else {
    // Split by comma-separated ranges e.g. "1-5, 6-10"
    const rangeArray = ranges.split(',').map(r => r.trim());
    let rangeIndex = 1;
    for (const rangeStr of rangeArray) {
      const parts = rangeStr.split('-');
      let start = parseInt(parts[0], 10);
      let end = parts.length > 1 ? parseInt(parts[1], 10) : start;

      // Validate bounds
      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(end) || end > totalPages) end = totalPages;
      if (start > end) {
        const temp = start;
        start = end;
        end = temp;
      }

      const indices = [];
      for (let i = start - 1; i <= end - 1; i++) {
        if (i < totalPages) indices.push(i);
      }

      if (indices.length > 0) {
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, indices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        zip.file(`split-${start}-to-${end}.pdf`, pdfBytes);
      }
      rangeIndex++;
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * JPG/PNG to PDF
 */
export async function imagesToPdf(files: File[], options: { margin?: number, orientation?: 'portrait' | 'landscape', pageSize?: 'A4' | 'LETTER' | 'FIT' }): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    
    try {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else if (file.type === 'image/png' || file.type === 'image/webp') {
        // pdf-lib only natively supports PNG and JPG. We assume WebP works if converted, but pdf-lib doesn't support WebP embedding directly.
        // We might need to render to canvas and get PNG/JPG if it's WebP. Let's just handle PNG for now and assume the caller provides valid types.
        if (file.type === 'image/webp') {
          // Convert WebP to PNG via canvas
          image = await embedWebP(file, pdfDoc);
        } else {
          image = await pdfDoc.embedPng(arrayBuffer);
        }
      } else {
        continue;
      }
    } catch(e) {
      console.error("Failed to embed image", e);
      continue;
    }

    const { width, height } = image.scale(1);
    
    // Fit to page
    if (options.pageSize === 'FIT') {
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
    } else {
      // Use standard sizes (A4 roughly 595.28 x 841.89)
      const isLandscape = options.orientation === 'landscape';
      let pw = options.pageSize === 'LETTER' ? 612 : 595.28;
      let ph = options.pageSize === 'LETTER' ? 792 : 841.89;
      
      if (isLandscape) {
        const temp = pw;
        pw = ph;
        ph = temp;
      }
      
      const margin = options.margin || 0;
      const drawAreaW = pw - margin * 2;
      const drawAreaH = ph - margin * 2;
      
      const scaleW = drawAreaW / width;
      const scaleH = drawAreaH / height;
      const scale = Math.min(scaleW, scaleH);
      
      const finalW = width * scale;
      const finalH = height * scale;
      
      const x = (pw - finalW) / 2;
      const y = (ph - finalH) / 2;
      
      const page = pdfDoc.addPage([pw, ph]);
      page.drawImage(image, {
        x,
        y,
        width: finalW,
        height: finalH,
      });
    }
  }

  return await pdfDoc.save();
}

async function embedWebP(file: File, pdfDoc: PDFDocument) {
  return new Promise<any>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No canvas context");
      ctx.drawImage(img, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      
      // Convert data URL to array buffer
      const res = await fetch(pngDataUrl);
      const buf = await res.arrayBuffer();
      resolve(await pdfDoc.embedPng(buf));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Extracts pages from PDF to JPGs
 */
export async function pdfToImages(file: File, quality: number): Promise<Blob> {
  const pdfjs = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  
  // Clone to avoid detach issues with pdf.js
  const clone = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjs.getDocument({ data: clone });
  const pdf = await loadingTask.promise;
  
  const zip = new JSZip();
  const totalPages = pdf.numPages;
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Scale for better quality
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (!context) continue;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
    
    if (blob) {
      zip.file(`page-${i}.jpg`, blob);
    }
  }
  
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Compresses PDF by rendering to images and recompiling
 * (True client-side compression is hard; this flattens text)
 */
export async function compressPdf(file: File, compressionLevel: 'low' | 'medium' | 'high'): Promise<Uint8Array> {
  const pdfjs = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  
  const clone = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjs.getDocument({ data: clone });
  const pdf = await loadingTask.promise;
  
  let scaleFactor = 1.5;
  let jpegQuality = 0.8;
  
  if (compressionLevel === 'low') {
    scaleFactor = 1.5;
    jpegQuality = 0.8;
  } else if (compressionLevel === 'medium') {
    scaleFactor = 1.0;
    jpegQuality = 0.6;
  } else if (compressionLevel === 'high') {
    scaleFactor = 0.75;
    jpegQuality = 0.4;
  }

  const newPdf = await PDFDocument.create();
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: scaleFactor });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (!context) continue;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    
    const image = await newPdf.embedJpg(buf);
    
    // Maintain original page size
    const originalViewport = page.getViewport({ scale: 1.0 });
    const pdfPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
    
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }
  
  return await newPdf.save();
}

/**
 * Generate thumbnails of all pages in a PDF for UI usage
 */
export async function generatePdfThumbnails(file: File, quality = 0.5): Promise<string[]> {
  const pdfjs = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  
  const clone = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjs.getDocument({ data: clone });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const thumbnails: string[] = [];
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    // Low scale to keep thumbnail generation fast
    const viewport = page.getViewport({ scale: 0.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      thumbnails.push(canvas.toDataURL('image/jpeg', quality));
    }
  }
  
  return thumbnails;
}

/**
 * Rotates specific or all pages in a PDF
 */
export async function rotatePdf(file: File, mode: 'all' | 'selected', angle: 90 | 180 | 270, selectedPages: number[] = []): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  if (mode === 'all') {
    pages.forEach(p => p.setRotation(degrees(p.getRotation().angle + angle)));
  } else {
    selectedPages.forEach(idx => {
      if (pages[idx]) {
        pages[idx].setRotation(degrees(pages[idx].getRotation().angle + angle));
      }
    });
  }
  return await pdfDoc.save();
}

/**
 * Deletes specific pages from a PDF
 */
export async function deletePages(file: File, pagesToDelete: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Sort in descending order to avoid shifting indices when removing
  const sortedToDelete = [...pagesToDelete].sort((a, b) => b - a);
  for (const idx of sortedToDelete) {
    if (idx >= 0 && idx < pdfDoc.getPageCount()) {
      pdfDoc.removePage(idx);
    }
  }
  
  return await pdfDoc.save();
}

/**
 * Reorders (and duplicates/removes) pages in a PDF based on the provided index array
 */
export async function reorderPages(file: File, newOrderIndices: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  
  const copiedPages = await newPdf.copyPages(pdfDoc, newOrderIndices);
  copiedPages.forEach(p => newPdf.addPage(p));
  
  return await newPdf.save();
}

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageFile?: File;
  font?: string;
  size?: number;
  opacity?: number;
  rotation?: number;
  color?: string; // hex color e.g. #000000
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  customX?: number;
  customY?: number;
  scale?: number;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Adds a watermark (text or image) to all pages in a PDF
 */
export async function addWatermark(file: File, options: WatermarkOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  let font: any = null;
  let image: any = null;
  let imgDims = { width: 0, height: 0 };
  
  if (options.type === 'text') {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Fallback to Helvetica
  } else if (options.type === 'image' && options.imageFile) {
    const imgBuffer = await options.imageFile.arrayBuffer();
    if (options.imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(imgBuffer);
    } else {
      image = await pdfDoc.embedJpg(imgBuffer);
    }
    const scale = options.scale || 1.0;
    imgDims = { width: image.width * scale, height: image.height * scale };
  }
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    let x = 0;
    let y = 0;
    
    let contentWidth = 0;
    let contentHeight = 0;
    
    if (options.type === 'text' && options.text) {
      const textSize = options.size || 48;
      contentWidth = font.widthOfTextAtSize(options.text, textSize);
      contentHeight = textSize;
    } else if (options.type === 'image') {
      contentWidth = imgDims.width;
      contentHeight = imgDims.height;
    }
    
    // Position logic
    if (options.position === 'center' || !options.position) {
      x = (width - contentWidth) / 2;
      y = (height - contentHeight) / 2;
    } else if (options.position === 'top-left') {
      x = 50;
      y = height - contentHeight - 50;
    } else if (options.position === 'top-right') {
      x = width - contentWidth - 50;
      y = height - contentHeight - 50;
    } else if (options.position === 'bottom-left') {
      x = 50;
      y = 50;
    } else if (options.position === 'bottom-right') {
      x = width - contentWidth - 50;
      y = 50;
    } else if (options.position === 'custom') {
      x = options.customX || 50;
      y = options.customY || 50;
    }
    
    if (options.type === 'text' && options.text) {
      const colorVal = hexToRgb(options.color || '#000000');
      page.drawText(options.text, {
        x,
        y,
        size: options.size || 48,
        font,
        color: rgb(colorVal.r, colorVal.g, colorVal.b),
        opacity: options.opacity ?? 0.5,
        rotate: degrees(options.rotation || 0)
      });
    } else if (options.type === 'image' && image) {
      page.drawImage(image, {
        x,
        y,
        width: imgDims.width,
        height: imgDims.height,
        opacity: options.opacity ?? 0.5,
      });
    }
  }
  
  return await pdfDoc.save();
}

/**
 * Protects a PDF with a user password using @pdfsmaller/pdf-encrypt-lite
 */
export async function protectPdf(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  // Using the library to encrypt the binary directly
  const encryptedBytes = await encryptPDF(new Uint8Array(arrayBuffer), password, password);
  return encryptedBytes;
}

/**
 * Unlocks a PDF given a password
 */
export async function unlockPdf(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { password } as any);
  return await pdfDoc.save();
}

/**
 * Extracts specific pages into a single new PDF
 * Ranges can be comma separated, e.g. "1, 3-5"
 */
export async function extractPages(file: File, ranges: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();
  const newPdf = await PDFDocument.create();

  const rangeArray = ranges.split(',').map(r => r.trim()).filter(Boolean);
  const indicesToExtract = new Set<number>();

  for (const rangeStr of rangeArray) {
    const parts = rangeStr.split('-');
    let start = parseInt(parts[0], 10);
    let end = parts.length > 1 ? parseInt(parts[1], 10) : start;

    if (isNaN(start) || start < 1) start = 1;
    if (isNaN(end) || end > totalPages) end = totalPages;
    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    for (let i = start - 1; i <= end - 1; i++) {
      if (i < totalPages) indicesToExtract.add(i);
    }
  }

  const sortedIndices = Array.from(indicesToExtract).sort((a, b) => a - b);
  if (sortedIndices.length > 0) {
    const copiedPages = await newPdf.copyPages(pdfDoc, sortedIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
  } else {
    throw new Error('No valid pages found to extract.');
  }

  return await newPdf.save();
}

/**
 * Adds page numbers to a PDF
 */
export async function addPageNumbers(file: File, options: { position: string, fontType: string, fontSize: number, color: string, opacity: number, format: string }): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  
  let font: any;
  if (options.fontType === 'Courier') {
    font = await pdfDoc.embedFont(StandardFonts.Courier);
  } else if (options.fontType === 'Times') {
    font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const totalPages = pages.length;
  const colorVal = hexToRgb(options.color);
  const rgbColor = rgb(colorVal.r, colorVal.g, colorVal.b);

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNum = index + 1;
    
    let text = options.format;
    text = text.replace('{n}', pageNum.toString());
    text = text.replace('{total}', totalPages.toString());

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const textHeight = options.fontSize;

    let x = 0;
    let y = 0;
    const margin = 30;

    switch (options.position) {
      case 'top-left':
        x = margin;
        y = height - margin - textHeight;
        break;
      case 'top-right':
        x = width - margin - textWidth;
        y = height - margin - textHeight;
        break;
      case 'bottom-left':
        x = margin;
        y = margin;
        break;
      case 'bottom-right':
        x = width - margin - textWidth;
        y = margin;
        break;
      case 'center':
        x = (width - textWidth) / 2;
        y = margin;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgbColor,
      opacity: options.opacity,
    });
  });

  return await pdfDoc.save();
}

/**
 * Crops margins off a PDF
 */
export async function cropPdf(file: File, margins: { top: number, right: number, bottom: number, left: number }): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.setCropBox(
      margins.left,
      margins.bottom,
      width - margins.left - margins.right,
      height - margins.top - margins.bottom
    );
  });

  return await pdfDoc.save();
}

/**
 * Resizes PDF pages
 */
export async function resizePdf(file: File, size: string, scaleMode: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  let targetWidth = 595.28;
  let targetHeight = 841.89; // A4 default

  if (size === 'letter') {
    targetWidth = 612;
    targetHeight = 792;
  } else if (size === 'legal') {
    targetWidth = 612;
    targetHeight = 1008;
  }

  pages.forEach(page => {
    const { width, height } = page.getSize();

    if (scaleMode === 'preserve') {
      const scaleX = targetWidth / width;
      const scaleY = targetHeight / height;
      const scale = Math.min(scaleX, scaleY);

      page.scale(scale, scale);
      page.setSize(targetWidth, targetHeight);
    } else {
      page.scale(targetWidth / width, targetHeight / height);
      page.setSize(targetWidth, targetHeight);
    }
  });

  return await pdfDoc.save();
}

/**
 * Edits PDF metadata
 */
export async function editPdfMetadata(file: File, metadata: { title?: string, author?: string, subject?: string, creator?: string, keywords?: string }): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
  if (metadata.keywords !== undefined) {
    pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()).filter(Boolean));
  }

  return await pdfDoc.save();
}

export interface FillField {
  type: 'text' | 'signature' | 'date';
  pageIndex: number;
  xPercent: number;
  yPercent: number;
  value?: string;
  image?: string; // data URL
  widthPercent?: number;
  heightPercent?: number;
  fontSize?: number; // raw size for now or percentage? Let's keep it raw for simplicity, or we can scale it.
}

/**
 * Fills and signs PDF with text and images
 */
export async function fillAndSignPdf(file: File, fields: FillField[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    const page = pages[field.pageIndex];
    if (!page) continue;
    
    const { width, height } = page.getSize();
    
    const x = field.xPercent * width;
    // In pdf-lib y=0 is bottom, UI passes top-down yPercent
    const y = height - (field.yPercent * height);

    if ((field.type === 'text' || field.type === 'date') && field.value) {
      page.drawText(field.value, {
        x: x,
        y: y,
        size: field.fontSize || 14,
        font: font,
        color: rgb(0, 0, 0),
      });
    } else if (field.type === 'signature' && field.image) {
      try {
        const res = await fetch(field.image);
        const imgBytes = await res.arrayBuffer();
        let embeddedImage;
        if (field.image.startsWith('data:image/png')) {
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imgBytes);
        }
        
        const w = (field.widthPercent || 0.2) * width;
        const h = (field.heightPercent || 0.1) * height;
        // Adjust Y so the top-left of the image is at the exact point
        page.drawImage(embeddedImage, {
          x: x,
          y: y - h,
          width: w,
          height: h,
        });
      } catch (e) {
        console.error("Failed to embed signature", e);
      }
    }
  }

  return await pdfDoc.save();
}

export interface RedactRect {
  pageIndex: number;
  xPercent: number; // 0 to 1
  yPercent: number; // 0 to 1 (top down)
  widthPercent: number; // 0 to 1
  heightPercent: number; // 0 to 1
}

/**
 * Redacts portions of a PDF by drawing black rects and flattening to an image-based PDF
 */
export async function redactAndFlattenPdf(file: File, rects: RedactRect[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const rect of rects) {
    const page = pages[rect.pageIndex];
    if (page) {
      const { width, height } = page.getSize();
      
      const x = rect.xPercent * width;
      const w = rect.widthPercent * width;
      const h = rect.heightPercent * height;
      const y = height - (rect.yPercent * height) - h; // convert top-down to bottom-up

      page.drawRectangle({
        x: x,
        y: y,
        width: w,
        height: h,
        color: rgb(0, 0, 0),
      });
    }
  }

  const tempPdfBytes = await pdfDoc.save();
  
  // Render pages to images to flatten and remove selectable text completely
  const pdfjs = await getPdfjsLib();
  const loadingTask = pdfjs.getDocument({ data: tempPdfBytes });
  const pdf = await loadingTask.promise;
  
  const flattenedPdf = await PDFDocument.create();
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // higher scale for crisp text
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    if (!context) continue;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const res = await fetch(dataUrl);
    const imgBytes = await res.arrayBuffer();
    
    const image = await flattenedPdf.embedJpg(imgBytes);
    const originalViewport = page.getViewport({ scale: 1.0 });
    const newPage = flattenedPdf.addPage([originalViewport.width, originalViewport.height]);
    
    newPage.drawImage(image, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  return await flattenedPdf.save();
}

/**
 * Extracts native text from a PDF, falling back to OCR if requested
 */
export async function extractPdfText(file: File, useOcr: boolean = false, onProgress?: (p: number) => void): Promise<string> {
  const pdfjs = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  
  // Clone to avoid detach issues with pdf.js
  const clone = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjs.getDocument({ data: clone });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const totalPages = pdf.numPages;
  
  // Import OCR dynamically to avoid circular or early execution issues if possible,
  // but we can just require it if we want. Let's use the native tesseract.js directly here 
  // to avoid modifying too many files or depending on ocrWorker.ts UI ties.
  let worker: any = null;
  if (useOcr) {
    const { createWorker } = await import('tesseract.js');
    worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing' && onProgress) {
          // Average progress across all pages rough estimate
          // or just pass the raw page progress
        }
      }
    });
  }

  try {
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      
      if (useOcr && worker) {
        // Render page for OCR
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const { data } = await worker.recognize(canvas);
          fullText += `--- Page ${i} ---\n${data.text}\n\n`;
          if (onProgress) onProgress(i / totalPages);
        }
      } else {
        // Native extraction
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        if (onProgress) onProgress(i / totalPages);
      }
    }
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
  
  return fullText;
}
