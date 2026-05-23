'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { resizePdf } from '../../../utils/pdf-tools';
import { UploadCloud, File as FileIcon, Download, Loader2, Maximize, X } from 'lucide-react';

export default function ResizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pageSize, setPageSize] = useState('a4');
  const [scaleMode, setScaleMode] = useState('preserve');

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

  const handleResize = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const resultBytes = await resizePdf(file, pageSize, scaleMode);
      const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to resize PDF:", error);
      alert("An error occurred while resizing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Resize PDF Pages</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Change the page size and scale the contents of your PDF document.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              
              <div className={`flex-1 p-12 flex flex-col items-center justify-center transition-colors ${!file && isDragging ? 'bg-primary/5' : 'bg-surface'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="text-center w-full">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                      <UploadCloud size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Select a PDF</h3>
                    <p className="text-on-surface-variant mb-6">or drag and drop it here</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                    >
                      Select PDF File
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <button 
                      onClick={reset}
                      className="absolute top-0 right-0 p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                    <FileIcon className="text-primary mb-4" size={64} />
                    <h3 className="text-xl font-bold mb-2 text-center break-all">{file.name}</h3>
                    <p className="text-on-surface-variant text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              <div className={`flex-1 bg-surface-container-lowest border-t md:border-t-0 md:border-l border-outline-variant/30 p-8 flex flex-col ${!file ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <Maximize className="mr-3 text-primary" size={24} />
                  Resize Options
                </h3>

                <div className="space-y-6 flex-grow">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Target Page Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['a4', 'letter', 'legal'].map(size => (
                        <button
                          key={size}
                          onClick={() => setPageSize(size)}
                          className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                            pageSize === size 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-outline-variant/60 bg-surface hover:bg-surface-container'
                          }`}
                        >
                          {size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Scale Mode</label>
                    <div className="space-y-3">
                      <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${scaleMode === 'preserve' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                        <div className="mt-1">
                          <input 
                            type="radio" 
                            name="scaleMode" 
                            checked={scaleMode === 'preserve'}
                            onChange={() => setScaleMode('preserve')}
                            className="w-5 h-5 accent-primary"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface mb-1">Preserve Ratio (Fit)</div>
                          <div className="text-sm text-on-surface-variant">Content will be scaled to fit the new size without distortion.</div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${scaleMode === 'stretch' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                        <div className="mt-1">
                          <input 
                            type="radio" 
                            name="scaleMode" 
                            checked={scaleMode === 'stretch'}
                            onChange={() => setScaleMode('stretch')}
                            className="w-5 h-5 accent-primary"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface mb-1">Stretch</div>
                          <div className="text-sm text-on-surface-variant">Content will be stretched to fill the new dimensions.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/30">
                  <button 
                    onClick={handleResize}
                    disabled={!file || isProcessing}
                    className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={24} />
                        Resizing...
                      </>
                    ) : (
                      'Resize PDF'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Maximize size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">PDF Resized!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDF has been successfully resized. Download the modified document below.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download={`resized_${file?.name || 'document.pdf'}`}
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg"
                >
                  Resize Another File
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
