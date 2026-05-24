'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';

import { UploadCloud, File as FileIcon, Download, Loader2, Settings, X, ArrowRight } from 'lucide-react';

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [newSize, setNewSize] = useState<number>(0);
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

  const handleCompress = async () => {
    if (!file) return;
    
    setIsCompressing(true);
    try {
      const compressedBytes = await (await import('../../../utils/pdf-tools')).compressPdf(file, compressionLevel);
      const blob = new Blob([compressedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setNewSize(blob.size);
    } catch (error) {
      console.error("Failed to compress PDF:", error);
      alert("An error occurred while compressing the PDF.");
    } finally {
      setIsCompressing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setCompressionLevel('medium');
    setNewSize(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Compress PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Reduce file size while optimizing for maximal PDF quality. All compression is done securely in your browser.
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
                    <p className="text-on-surface-variant text-sm font-medium px-4 py-1 bg-surface-container rounded-full mt-2">
                      Original Size: {formatSize(file.size)}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Options */}
              <div className={`flex-1 bg-surface-container-lowest border-t md:border-t-0 md:border-l border-outline-variant/30 p-8 flex flex-col ${!file ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <Settings className="mr-3 text-primary" size={24} />
                  Compression Level
                </h3>

                <div className="space-y-4 flex-grow">
                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${compressionLevel === 'low' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="compression" 
                        checked={compressionLevel === 'low'}
                        onChange={() => setCompressionLevel('low')}
                        className="w-5 h-5 accent-primary"
                      />
                      <div className="font-semibold text-on-surface">Less Compression</div>
                    </div>
                    <div className="text-sm text-on-surface-variant mt-2 ml-8">High quality, less size reduction. Best for printing.</div>
                  </label>

                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${compressionLevel === 'medium' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="compression" 
                        checked={compressionLevel === 'medium'}
                        onChange={() => setCompressionLevel('medium')}
                        className="w-5 h-5 accent-primary"
                      />
                      <div className="font-semibold text-on-surface">Recommended Compression</div>
                    </div>
                    <div className="text-sm text-on-surface-variant mt-2 ml-8">Good quality, good compression. Best for sharing.</div>
                  </label>

                  <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${compressionLevel === 'high' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="compression" 
                        checked={compressionLevel === 'high'}
                        onChange={() => setCompressionLevel('high')}
                        className="w-5 h-5 accent-primary"
                      />
                      <div className="font-semibold text-on-surface">Extreme Compression</div>
                    </div>
                    <div className="text-sm text-on-surface-variant mt-2 ml-8">Lower quality, highest size reduction. Best for email.</div>
                  </label>
                  
                  <div className="text-xs text-on-surface-variant bg-surface-container p-3 rounded-lg mt-4 border border-outline-variant/20">
                    <strong>Note:</strong> Client-side compression works by rebuilding pages as optimized images. Text will become rasterized.
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/30">
                  <button 
                    onClick={handleCompress}
                    disabled={!file || isCompressing}
                    className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center text-lg"
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={24} />
                        Compressing...
                      </>
                    ) : (
                      'Compress PDF'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Compression Complete!</h2>
              
              <div className="flex items-center justify-center gap-6 mb-8 mt-6">
                <div className="text-center">
                  <div className="text-sm text-on-surface-variant mb-1">Original Size</div>
                  <div className="text-xl font-semibold line-through text-on-surface-variant/70">{formatSize(file!.size)}</div>
                </div>
                <ArrowRight className="text-primary" size={24} />
                <div className="text-center">
                  <div className="text-sm text-on-surface-variant mb-1">New Size</div>
                  <div className="text-2xl font-bold text-green-600">{formatSize(newSize)}</div>
                </div>
              </div>
              
              <div className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-full font-semibold text-sm mb-10 border border-green-200">
                Saved {(((file!.size - newSize) / file!.size) * 100).toFixed(1)}% space!
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download="compressed-document.pdf"
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg"
                >
                  Compress Another
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
