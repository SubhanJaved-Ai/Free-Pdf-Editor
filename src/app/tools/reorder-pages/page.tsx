'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { reorderPages, generatePdfThumbnails } from '../../../utils/pdf-tools';
import { UploadCloud, File as FileIcon, Download, Loader2, X, Move, Copy, Trash2 } from 'lucide-react';

interface PageItem {
  id: string; // unique id for rendering the list safely
  originalIndex: number;
}

export default function ReorderPagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pagesOrder, setPagesOrder] = useState<PageItem[]>([]);
  
  // Drag and drop state for items
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeaveFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf');
      if (droppedFile) setFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = Array.from(e.target.files).find(f => f.type === 'application/pdf');
      if (selectedFile) setFile(selectedFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (file) {
      generatePdfThumbnails(file).then(thumbs => {
        setThumbnails(thumbs);
        // Initialize order
        const initialOrder = thumbs.map((_, index) => ({
          id: `page-${index}-${Date.now()}`,
          originalIndex: index
        }));
        setPagesOrder(initialOrder);
      }).catch(err => console.error("Failed to generate thumbnails", err));
    } else {
      setThumbnails([]);
      setPagesOrder([]);
    }
  }, [file]);

  const handleDuplicate = (index: number) => {
    const newOrder = [...pagesOrder];
    const itemToDuplicate = newOrder[index];
    newOrder.splice(index + 1, 0, {
      id: `page-${itemToDuplicate.originalIndex}-${Date.now()}`,
      originalIndex: itemToDuplicate.originalIndex
    });
    setPagesOrder(newOrder);
  };

  const handleRemove = (index: number) => {
    const newOrder = [...pagesOrder];
    newOrder.splice(index, 1);
    setPagesOrder(newOrder);
  };

  // Item drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = "move";
    // We don't really use this data, but it's required for dnd to work properly
    e.dataTransfer.setData("text/html", e.currentTarget.parentNode?.toString() || "");
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragOverItem = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedItemIndex === null) return;
    
    const newOrder = [...pagesOrder];
    const draggedItem = newOrder[draggedItemIndex];
    
    // Remove from original position
    newOrder.splice(draggedItemIndex, 1);
    
    // Insert at new position
    newOrder.splice(index, 0, draggedItem);
    
    setPagesOrder(newOrder);
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const handleProcess = async () => {
    if (!file || pagesOrder.length === 0) return;
    
    setIsProcessing(true);
    try {
      const indices = pagesOrder.map(item => item.originalIndex);
      const pdfBytes = await reorderPages(file, indices);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to reorder PDF:", error);
      alert("An error occurred while reordering the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setPagesOrder([]);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Reorder PDF Pages</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Drag and drop page thumbnails to reorder them. You can also duplicate or remove pages.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col min-h-[600px]">
              
              {!file ? (
                <div className={`flex-1 p-12 flex flex-col items-center justify-center transition-colors min-h-[500px] ${isDraggingFile ? 'bg-primary/5' : 'bg-surface'}`}
                  onDragOver={handleDragOverFile}
                  onDragLeave={handleDragLeaveFile}
                  onDrop={handleDropFile}
                >
                  <div className="text-center w-full max-w-md mx-auto">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
                      <UploadCloud size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-on-surface">Select a PDF file</h3>
                    <p className="text-on-surface-variant mb-8 text-lg">or drag and drop it here</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-4 w-full bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 text-lg"
                    >
                      Select PDF File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row h-full min-h-[600px]">
                  {/* Left Side - Preview & Drag Area */}
                  <div className="flex-[3] p-8 bg-surface-container-lowest border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileIcon className="text-primary" size={24} />
                        <span className="truncate max-w-[300px]" title={file.name}>{file.name}</span>
                      </h3>
                      <button 
                        onClick={() => setFile(null)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                      {thumbnails.length > 0 ? (
                        <div className="flex flex-wrap gap-6 p-4">
                          {pagesOrder.map((item, index) => {
                            const isDragging = draggedItemIndex === index;
                            const isDragOver = dragOverIndex === index;
                            
                            return (
                              <div 
                                key={item.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragOver={handleDragOverItem}
                                onDrop={(e) => handleDropItem(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`relative flex flex-col items-center w-32 sm:w-40 transition-all duration-200 ${
                                  isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                                }`}
                              >
                                {isDragOver && draggedItemIndex !== null && draggedItemIndex > index && (
                                  <div className="absolute left-[-16px] top-0 bottom-8 w-1 bg-primary rounded-full z-10" />
                                )}
                                {isDragOver && draggedItemIndex !== null && draggedItemIndex < index && (
                                  <div className="absolute right-[-16px] top-0 bottom-8 w-1 bg-primary rounded-full z-10" />
                                )}
                                
                                <div className={`group w-full aspect-[1/1.4] relative overflow-hidden rounded-xl border-2 transition-all shadow-md bg-white cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-lg ${
                                  isDragOver ? 'border-primary ring-4 ring-primary/20' : 'border-outline-variant/40'
                                }`}>
                                  <img 
                                    src={thumbnails[item.originalIndex]} 
                                    alt={`Page ${item.originalIndex + 1}`} 
                                    className="max-w-full max-h-full object-contain pointer-events-none"
                                  />
                                  
                                  {/* Overlay Controls */}
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                                    <button 
                                      onClick={() => handleDuplicate(index)}
                                      className="p-1.5 bg-white text-primary hover:bg-primary hover:text-white rounded-md transition-colors"
                                      title="Duplicate page"
                                    >
                                      <Copy size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleRemove(index)}
                                      className="p-1.5 bg-white text-error hover:bg-error hover:text-white rounded-md transition-colors"
                                      title="Remove page"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-center mt-3 text-sm font-bold text-on-surface-variant flex items-center gap-1">
                                  <span>{index + 1}</span>
                                  <span className="text-xs text-outline-variant">(Orig: {item.originalIndex + 1})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full min-h-[300px] flex items-center justify-center">
                          <Loader2 className="animate-spin text-primary" size={32} />
                          <span className="ml-3 text-on-surface-variant font-medium">Loading pages...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Options */}
                  <div className="flex-1 bg-surface p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-6 flex items-center text-primary">
                        <Move className="mr-3" size={24} />
                        Reorder Details
                      </h3>

                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant/20">
                          <span className="text-on-surface-variant">Original pages:</span>
                          <span className="font-bold text-lg">{thumbnails.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant">Final pages:</span>
                          <span className={`font-bold text-xl ${
                            pagesOrder.length === thumbnails.length 
                              ? 'text-primary' 
                              : pagesOrder.length > thumbnails.length 
                                ? 'text-green-600' 
                                : 'text-orange-500'
                          }`}>
                            {pagesOrder.length}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-on-surface-variant space-y-2 mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="flex items-start gap-2"><strong className="text-primary mt-0.5">•</strong> Drag and drop a page to move it.</p>
                        <p className="flex items-start gap-2"><strong className="text-primary mt-0.5">•</strong> Hover over a page to see Duplicate/Remove options.</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-outline-variant/30">
                      <button 
                        onClick={handleProcess}
                        disabled={isProcessing || pagesOrder.length === 0}
                        className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={24} />
                            Applying Order...
                          </>
                        ) : (
                          'Save Order & Download'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Reordering Complete!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDF has been successfully reordered.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download={`reordered-${file?.name || 'document'}.pdf`}
                  className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-bold rounded-full transition-colors flex items-center justify-center text-lg text-on-surface"
                >
                  Process Another File
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
