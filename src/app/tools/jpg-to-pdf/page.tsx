'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';

import { UploadCloud, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Download, Loader2, Settings } from 'lucide-react';

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Options
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER' | 'FIT'>('FIT');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(0);

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
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsConverting(true);
    try {
      const pdfBytes = await (await import('../../../utils/pdf-tools')).imagesToPdf(files, { pageSize, orientation, margin });
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to convert images:", error);
      alert("An error occurred while converting images.");
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFiles([]);
    setResultUrl(null);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">JPG to PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Convert your images to PDF in seconds. Adjust orientation and margins as needed. All processing is done locally.
            </p>
          </div>

          {!resultUrl ? (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Left Side - Upload and List */}
              <div className="flex-grow w-full lg:w-2/3 bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden">
                <div 
                  className={`p-10 text-center transition-colors border-b border-outline-variant/30 ${isDragging ? 'bg-primary/5' : 'bg-surface'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    multiple 
                    accept="image/jpeg, image/png, image/webp" 
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Upload Images</h3>
                  <p className="text-sm text-on-surface-variant mb-4">JPG, PNG, WEBP supported</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Select Images
                  </button>
                </div>

                {files.length > 0 && (
                  <div className="p-6 bg-surface-container-lowest max-h-[400px] overflow-y-auto">
                    <h4 className="font-semibold mb-3 text-on-surface text-sm">Images ({files.length})</h4>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-outline-variant/40 shadow-sm">
                          <div className="flex items-center flex-1 min-w-0 mr-3">
                            <ImageIcon className="text-primary mr-3 shrink-0" size={20} />
                            <span className="truncate font-medium text-sm">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              onClick={() => moveUp(index)} 
                              disabled={index === 0}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => moveDown(index)} 
                              disabled={index === files.length - 1}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button 
                              onClick={() => removeFile(index)}
                              className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors ml-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Settings */}
              <div className="w-full lg:w-1/3 bg-surface-container-lowest rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-6">
                <h3 className="text-lg font-bold mb-5 flex items-center border-b border-outline-variant/30 pb-3">
                  <Settings className="mr-2 text-primary" size={20} />
                  Settings
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Page Size</label>
                    <select 
                      value={pageSize} 
                      onChange={(e) => setPageSize(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="FIT">Fit (Same as image)</option>
                      <option value="A4">A4 (Standard)</option>
                      <option value="LETTER">US Letter</option>
                    </select>
                  </div>

                  {pageSize !== 'FIT' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-on-surface mb-2">Orientation</label>
                        <div className="flex bg-surface-container rounded-lg p-1">
                          <button
                            onClick={() => setOrientation('portrait')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${orientation === 'portrait' ? 'bg-white shadow text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                          >
                            Portrait
                          </button>
                          <button
                            onClick={() => setOrientation('landscape')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${orientation === 'landscape' ? 'bg-white shadow text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                          >
                            Landscape
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-on-surface mb-2">Margin</label>
                        <select 
                          value={margin} 
                          onChange={(e) => setMargin(Number(e.target.value))}
                          className="w-full p-2.5 bg-white border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                          <option value={0}>No Margin</option>
                          <option value={20}>Small Margin</option>
                          <option value={40}>Large Margin</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 pt-5 border-t border-outline-variant/30">
                  <button 
                    onClick={handleConvert}
                    disabled={files.length === 0 || isConverting}
                    className="w-full py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Converting...
                      </>
                    ) : (
                      'Convert to PDF'
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
              <h2 className="text-3xl font-bold mb-4">Conversion Complete!</h2>
              <p className="text-on-surface-variant mb-10">
                Your images have been successfully combined into a single PDF document.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download="converted-images.pdf"
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg"
                >
                  Convert More
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
