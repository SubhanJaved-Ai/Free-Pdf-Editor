'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { rotatePdf, generatePdfThumbnails } from '../../../utils/pdf-tools';
import { UploadCloud, File as FileIcon, Download, Loader2, X, RotateCw } from 'lucide-react';
import Image from 'next/image';

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rotateMode, setRotateMode] = useState<'all' | 'selected'>('all');
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

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
        setSelectedPages(new Set());
      }).catch(err => console.error("Failed to generate thumbnails", err));
    } else {
      setThumbnails([]);
      setSelectedPages(new Set());
    }
  }, [file]);

  const togglePageSelection = (index: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedPages(newSelection);
  };

  const selectAll = () => {
    const newSelection = new Set<number>();
    thumbnails.forEach((_, i) => newSelection.add(i));
    setSelectedPages(newSelection);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const pdfBytes = await rotatePdf(file, rotateMode, angle, Array.from(selectedPages));
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to rotate PDF:", error);
      alert("An error occurred while rotating the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setRotateMode('all');
    setAngle(90);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Rotate PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Rotate your PDFs the way you need them. Rotate all pages or just select the ones you want.
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

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                      {rotateMode === 'selected' && thumbnails.length > 0 && (
                        <div className="mb-4 flex gap-3">
                          <button onClick={selectAll} className="text-sm px-3 py-1 bg-surface-container rounded-md hover:bg-outline-variant/20 font-medium">Select All</button>
                          <button onClick={deselectAll} className="text-sm px-3 py-1 bg-surface-container rounded-md hover:bg-outline-variant/20 font-medium">Deselect All</button>
                        </div>
                      )}
                      
                      {thumbnails.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {thumbnails.map((thumb, index) => {
                            const isSelected = rotateMode === 'all' || selectedPages.has(index);
                            // Visual rotation in UI
                            const currentAngle = isSelected ? angle : 0;
                            return (
                              <div 
                                key={index} 
                                onClick={() => rotateMode === 'selected' && togglePageSelection(index)}
                                className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer ${
                                  rotateMode === 'selected' 
                                    ? (isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50')
                                    : 'border-transparent'
                                }`}
                              >
                                <div className="aspect-[1/1.4] relative overflow-hidden rounded shadow-sm bg-white flex items-center justify-center">
                                  <img 
                                    src={thumb} 
                                    alt={`Page ${index + 1}`} 
                                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                                    style={{ transform: `rotate(${currentAngle}deg)` }}
                                  />
                                </div>
                                <div className="text-center mt-2 text-sm font-medium text-on-surface-variant">
                                  Page {index + 1}
                                </div>
                                {rotateMode === 'selected' && (
                                  <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'bg-primary border-primary' : 'bg-white border-outline-variant'
                                  }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Options */}
                  <div className="flex-1 bg-surface-container-lowest p-8 flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                      <RotateCw className="mr-3 text-primary" size={24} />
                      Rotate Options
                    </h3>

                    <div className="space-y-6 flex-grow">
                      <div>
                        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Pages to Rotate</div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setRotateMode('all')}
                            className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                              rotateMode === 'all' 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'border-outline-variant/30 hover:bg-surface-container'
                            }`}
                          >
                            All Pages
                          </button>
                          <button
                            onClick={() => setRotateMode('selected')}
                            className={`py-3 px-4 rounded-xl font-medium border-2 transition-all ${
                              rotateMode === 'selected' 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'border-outline-variant/30 hover:bg-surface-container'
                            }`}
                          >
                            Select Pages
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Direction</div>
                        <div className="flex gap-3">
                          {[90, 180, 270].map((deg) => (
                            <button
                              key={deg}
                              onClick={() => setAngle(deg as any)}
                              className={`flex-1 py-4 flex flex-col items-center justify-center rounded-xl font-medium border-2 transition-all ${
                                angle === deg 
                                  ? 'bg-primary/10 border-primary text-primary' 
                                  : 'border-outline-variant/30 hover:bg-surface-container'
                              }`}
                            >
                              <RotateCw size={24} className="mb-2" style={{ transform: `rotate(${deg}deg)` }} />
                              {deg === 90 ? 'Right' : deg === 180 ? 'Upside Down' : 'Left'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-outline-variant/30">
                      <button 
                        onClick={handleProcess}
                        disabled={isProcessing || (rotateMode === 'selected' && selectedPages.size === 0)}
                        className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center text-lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={24} />
                            Processing...
                          </>
                        ) : (
                          'Apply Rotation'
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
              <h2 className="text-3xl font-bold mb-4">Rotation Complete!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDF has been successfully rotated and is ready for download.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download={`rotated-${file?.name || 'document'}.pdf`}
                  className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-bold rounded-full transition-colors flex items-center justify-center text-lg text-on-surface"
                >
                  Rotate Another File
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
