'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';

import { UploadCloud, File as FileIcon, Download, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleConvert = async () => {
    if (!file) return;
    
    setIsConverting(true);
    try {
      const qValue = quality === 'high' ? 1.0 : quality === 'medium' ? 0.7 : 0.4;
      const zipBlob = await (await import('../../../utils/pdf-tools')).pdfToImages(file, qValue);
      const url = URL.createObjectURL(zipBlob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to convert PDF:", error);
      alert("An error occurred while converting the PDF.");
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setQuality('high');
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">PDF to JPG</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Extract all pages from a PDF and convert them into high-quality JPG images. Processed locally in your browser.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              
              {/* Left Side - Upload or File Info */}
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
                    <h3 className="text-xl font-bold mb-2">Select a PDF file</h3>
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
                      onClick={() => setFile(null)}
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

              {/* Right Side - Options */}
              <div className={`flex-1 bg-surface-container-lowest border-t md:border-t-0 md:border-l border-outline-variant/30 p-8 flex flex-col ${!file ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <ImageIcon className="mr-3 text-primary" size={24} />
                  Image Options
                </h3>

                <div className="space-y-4 flex-grow">
                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${quality === 'high' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="quality" 
                        checked={quality === 'high'}
                        onChange={() => setQuality('high')}
                        className="w-5 h-5 accent-primary"
                      />
                      <div className="font-semibold text-on-surface">High Quality</div>
                    </div>
                    <div className="text-sm text-on-surface-variant mt-2 ml-8">Best for printing or sharing. Larger file size.</div>
                  </label>

                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${quality === 'medium' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="quality" 
                        checked={quality === 'medium'}
                        onChange={() => setQuality('medium')}
                        className="w-5 h-5 accent-primary"
                      />
                      <div className="font-semibold text-on-surface">Medium Quality</div>
                    </div>
                    <div className="text-sm text-on-surface-variant mt-2 ml-8">Good balance between quality and file size.</div>
                  </label>

                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${quality === 'low' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="quality" 
                        checked={quality === 'low'}
                        onChange={() => setQuality('low')}
                        className="w-5 h-5 accent-primary"
                      />
                      <div className="font-semibold text-on-surface">Low Quality</div>
                    </div>
                    <div className="text-sm text-on-surface-variant mt-2 ml-8">Smaller file size. Best for email or web.</div>
                  </label>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/30">
                  <button 
                    onClick={handleConvert}
                    disabled={!file || isConverting}
                    className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center text-lg"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={24} />
                        Converting...
                      </>
                    ) : (
                      'Convert to JPG'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Conversion Complete!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDF pages have been successfully converted to JPG images. Download the ZIP file to view them.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download="extracted-images.zip"
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download ZIP
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg"
                >
                  Convert Another File
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
