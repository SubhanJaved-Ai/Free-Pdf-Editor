'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { redactAndFlattenPdf, generatePdfThumbnails } from '../../../utils/pdf-tools';
import { UploadCloud, File as FileIcon, Download, Loader2, ShieldAlert, X, Eraser, AlertTriangle } from 'lucide-react';

interface Rect {
  id: string;
  pageIndex: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export default function RedactPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawingRect, setDrawingRect] = useState<Rect | null>(null);
  const [activePage, setActivePage] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf');
      if (droppedFile) await loadFile(droppedFile);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = Array.from(e.target.files).find(f => f.type === 'application/pdf');
      if (selectedFile) await loadFile(selectedFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadFile = async (f: File) => {
    setFile(f);
    setIsProcessing(true);
    try {
      const thumbs = await generatePdfThumbnails(f, 0.8);
      setThumbnails(thumbs);
    } catch (e) {
      console.error(e);
      alert("Failed to load PDF preview.");
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Resize observer to get accurate container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerSize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [thumbnails]);

  // Drawing logic
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, pageIndex: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setDrawingRect({
      id: `temp`,
      pageIndex,
      xPercent: x / rect.width,
      yPercent: y / rect.height,
      widthPercent: 0,
      heightPercent: 0
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>, pageIndex: number) => {
    if (!startPos || !drawingRect) return;
    
    const containerRect = e.currentTarget.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
    const currentY = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));
    
    const minX = Math.min(startPos.x, currentX);
    const minY = Math.min(startPos.y, currentY);
    const maxX = Math.max(startPos.x, currentX);
    const maxY = Math.max(startPos.y, currentY);

    setDrawingRect({
      ...drawingRect,
      xPercent: minX / containerRect.width,
      yPercent: minY / containerRect.height,
      widthPercent: (maxX - minX) / containerRect.width,
      heightPercent: (maxY - minY) / containerRect.height,
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (drawingRect && drawingRect.widthPercent > 0.01 && drawingRect.heightPercent > 0.01) {
      setRects([...rects, { ...drawingRect, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setDrawingRect(null);
    setStartPos(null);
  };

  const removeRect = (id: string) => {
    setRects(rects.filter(r => r.id !== id));
  };

  const handleRedact = async () => {
    if (!file) return;
    if (rects.length === 0) {
      alert("Please draw at least one redaction rectangle.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const redactedBytes = await redactAndFlattenPdf(file, rects);
      const blob = new Blob([redactedBytes as unknown as BlobPart], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      alert("An error occurred while redacting.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setThumbnails([]);
    setResultUrl(null);
    setRects([]);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Redact PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Securely hide sensitive information. We draw black rectangles and completely flatten the file to remove underlying selectable text.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
              
              {/* Left Side - Editor */}
              <div className={`flex-[2] flex flex-col bg-surface-container-lowest transition-colors ${!file && isDragging ? 'bg-primary/5' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="text-center w-full h-full flex flex-col items-center justify-center p-12">
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                    <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                      <UploadCloud size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Select a PDF file to redact</h3>
                    <p className="text-on-surface-variant mb-6">or drag and drop it here</p>
                    <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                      Select PDF File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
                      <div className="flex items-center">
                        <FileIcon className="text-primary mr-3" size={20} />
                        <span className="font-semibold truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => { setFile(null); setThumbnails([]); setRects([]); }} className="ml-3 text-on-surface-variant hover:text-error transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Page {activePage + 1} of {thumbnails.length}</span>
                      </div>
                    </div>
                    
                    {/* Viewer */}
                    <div className="flex-grow overflow-y-auto bg-[#E5E7EB] p-8 flex flex-col items-center gap-8 relative custom-scrollbar">
                      {isProcessing && thumbnails.length === 0 ? (
                         <div className="flex items-center justify-center h-full w-full">
                           <Loader2 className="animate-spin text-primary mr-3" size={32} />
                           <span className="font-semibold text-lg">Generating Preview...</span>
                         </div>
                      ) : (
                        thumbnails.map((thumb, index) => (
                          <div 
                            key={index} 
                            className="relative shadow-xl bg-white select-none"
                            onMouseEnter={() => setActivePage(index)}
                          >
                            <img 
                              src={thumb} 
                              alt={`Page ${index + 1}`} 
                              className="max-w-full block pointer-events-none"
                              style={{ width: '800px', height: 'auto' }}
                            />
                            
                            {/* Overlay for drawing */}
                            <div 
                              className="absolute inset-0 z-10 cursor-crosshair touch-none"
                              onPointerDown={(e) => onPointerDown(e, index)}
                              onPointerMove={(e) => onPointerMove(e, index)}
                              onPointerUp={onPointerUp}
                              onPointerCancel={onPointerUp}
                              ref={index === activePage ? containerRef : null}
                            >
                              {/* Render confirmed rects for this page */}
                              {rects.filter(r => r.pageIndex === index).map(rect => (
                                <div 
                                  key={rect.id}
                                  className="absolute bg-black group pointer-events-auto"
                                  style={{
                                    left: `${rect.xPercent * 100}%`,
                                    top: `${rect.yPercent * 100}%`,
                                    width: `${rect.widthPercent * 100}%`,
                                    height: `${rect.heightPercent * 100}%`
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                >
                                  <button 
                                    className="absolute -top-3 -right-3 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto shadow-md cursor-pointer hover:scale-110"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      removeRect(rect.id); 
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              
                              {/* Render drawing rect */}
                              {drawingRect && drawingRect.pageIndex === index && (
                                <div 
                                  className="absolute bg-black/80 border border-black"
                                  style={{
                                    left: `${drawingRect.xPercent * 100}%`,
                                    top: `${drawingRect.yPercent * 100}%`,
                                    width: `${drawingRect.widthPercent * 100}%`,
                                    height: `${drawingRect.heightPercent * 100}%`
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Options */}
              <div className={`flex-1 bg-surface border-t lg:border-t-0 lg:border-l border-outline-variant/30 p-8 flex flex-col ${!file ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <ShieldAlert className="mr-3 text-error" size={24} />
                  Redaction Tool
                </h3>

                <div className="space-y-6 flex-grow">
                  <div className="p-4 bg-error/10 text-error-dark border border-error/20 rounded-xl flex items-start gap-3 text-sm">
                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <strong>Permanent Action</strong>
                      <p className="mt-1 opacity-90">This tool draws black rectangles and flattens the pages into images. This permanently removes the underlying selectable text layer to ensure maximum security within browser limits.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container rounded-xl">
                    <h4 className="font-semibold flex items-center mb-2"><Eraser size={16} className="mr-2"/> Instructions</h4>
                    <ul className="text-sm space-y-2 text-on-surface-variant list-disc pl-5">
                      <li>Scroll through your document preview.</li>
                      <li><strong>Click and drag</strong> on the document to draw black redaction rectangles.</li>
                      <li>Hover over a rectangle and click the red X to remove it.</li>
                      <li>Click "Apply Redaction" when finished.</li>
                    </ul>
                  </div>
                  
                  <div className="font-semibold text-lg flex justify-between items-center">
                    Redactions added: 
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">{rects.length}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/30">
                  <button onClick={handleRedact} disabled={!file || isProcessing || rects.length === 0} className="w-full py-4 bg-error text-white font-bold rounded-full hover:bg-error/90 transition-colors shadow-md shadow-error/20 disabled:opacity-50 flex items-center justify-center text-lg">
                    {isProcessing ? <><Loader2 className="animate-spin mr-2" size={24} /> Processing...</> : 'Apply Redaction'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Redaction Complete!</h2>
              <p className="text-on-surface-variant mb-10">Your PDF has been permanently redacted and flattened to remove underlying sensitive data.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href={resultUrl} download={`redacted-${file?.name}`} className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg">
                  <Download className="mr-2" size={24} /> Download Secure PDF
                </a>
                <button onClick={reset} className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg">
                  Redact Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
