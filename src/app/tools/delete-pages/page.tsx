'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { deletePages, generatePdfThumbnails } from '../../../utils/pdf-tools';
import { UploadCloud, File as FileIcon, Download, Loader2, X, FileMinus, Trash2 } from 'lucide-react';

export default function DeletePagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set());

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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
        setPagesToDelete(new Set());
      }).catch(err => console.error("Failed to generate thumbnails", err));
    } else {
      setThumbnails([]);
      setPagesToDelete(new Set());
    }
  }, [file]);

  const togglePageSelection = (index: number) => {
    const newSelection = new Set(pagesToDelete);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setPagesToDelete(newSelection);
  };

  const handleProcess = async () => {
    if (!file || pagesToDelete.size === 0) return;
    
    // Check if trying to delete ALL pages
    if (pagesToDelete.size === thumbnails.length) {
      alert("You cannot delete all pages from the PDF. Leave at least one page.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const pdfBytes = await deletePages(file, Array.from(pagesToDelete));
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to delete pages:", error);
      alert("An error occurred while modifying the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setPagesToDelete(new Set());
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Delete PDF Pages</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Select the pages you want to remove from your document.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col min-h-[500px]">
              
              {!file ? (
                <div className={`flex-1 p-12 flex flex-col items-center justify-center transition-colors min-h-[500px] ${isDragging ? 'bg-primary/5' : 'bg-surface'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
                <div className="flex flex-col md:flex-row h-full min-h-[500px]">
                  {/* Left Side - Preview & Selection */}
                  <div className="flex-[2] p-8 bg-surface border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileIcon className="text-primary" size={24} />
                        <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      </h3>
                      <button 
                        onClick={() => setFile(null)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                      <div className="mb-4 text-sm font-medium text-on-surface-variant">
                        Click on a page to mark it for deletion.
                      </div>
                      
                      {thumbnails.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {thumbnails.map((thumb, index) => {
                            const isDeleted = pagesToDelete.has(index);
                            return (
                              <div 
                                key={index} 
                                onClick={() => togglePageSelection(index)}
                                className="group relative flex flex-col items-center cursor-pointer"
                              >
                                <div className={`w-full aspect-[1/1.4] relative overflow-hidden rounded-lg border-2 transition-all shadow-sm ${
                                  isDeleted 
                                    ? 'border-error bg-error/10 opacity-60' 
                                    : 'border-outline-variant/30 hover:border-error/50 bg-white group-hover:shadow-md'
                                }`}>
                                  <img 
                                    src={thumb} 
                                    alt={`Page ${index + 1}`} 
                                    className={`max-w-full max-h-full object-contain ${isDeleted ? 'grayscale' : ''}`}
                                  />
                                  {isDeleted && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-error text-white p-3 rounded-full shadow-lg">
                                        <Trash2 size={24} />
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Hover delete icon overlay */}
                                  {!isDeleted && (
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-error p-2 rounded-full shadow-lg transition-opacity transform scale-90 group-hover:scale-100">
                                        <Trash2 size={20} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className={`text-center mt-3 text-sm font-bold ${isDeleted ? 'text-error line-through' : 'text-on-surface-variant'}`}>
                                  Page {index + 1}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full min-h-[300px] flex items-center justify-center">
                          <Loader2 className="animate-spin text-primary" size={32} />
                          <span className="ml-3 text-on-surface-variant font-medium">Generating thumbnails...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Options */}
                  <div className="flex-1 bg-surface-container-lowest p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-6 flex items-center text-error">
                        <FileMinus className="mr-3 text-error" size={24} />
                        Summary
                      </h3>

                      <div className="bg-surface border border-outline-variant/30 rounded-xl p-6 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant/20">
                          <span className="text-on-surface-variant">Total pages:</span>
                          <span className="font-bold text-lg">{thumbnails.length}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant/20">
                          <span className="text-on-surface-variant">Pages to delete:</span>
                          <span className="font-bold text-lg text-error">{pagesToDelete.size}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant">Pages remaining:</span>
                          <span className="font-bold text-xl text-primary">{Math.max(0, thumbnails.length - pagesToDelete.size)}</span>
                        </div>
                      </div>
                      
                      {pagesToDelete.size === thumbnails.length && thumbnails.length > 0 && (
                        <div className="bg-error/10 text-error p-4 rounded-xl border border-error/20 text-sm font-medium">
                          You cannot delete all pages. Please leave at least one page.
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-outline-variant/30">
                      <button 
                        onClick={handleProcess}
                        disabled={isProcessing || pagesToDelete.size === 0 || pagesToDelete.size === thumbnails.length}
                        className="w-full py-4 bg-error text-white font-bold rounded-full hover:bg-error/90 transition-colors shadow-md shadow-error/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={24} />
                            Processing...
                          </>
                        ) : (
                          'Remove Pages'
                        )}
                      </button>
                      {pagesToDelete.size === 0 && (
                        <p className="text-center text-sm text-on-surface-variant mt-4">
                          Select at least one page to remove.
                        </p>
                      )}
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
              <h2 className="text-3xl font-bold mb-4">Pages Deleted Successfully!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                The selected pages have been removed from your PDF.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download={`modified-${file?.name || 'document'}.pdf`}
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
