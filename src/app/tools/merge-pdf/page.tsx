'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { mergePdfs } from '../../../utils/pdf-tools';
import { UploadCloud, File as FileIcon, Trash2, ArrowUp, ArrowDown, Download, Loader2 } from 'lucide-react';

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
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
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...selectedFiles]);
    }
    // reset input
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

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    setIsMerging(true);
    try {
      const mergedBytes = await mergePdfs(files);
      const blob = new Blob([mergedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
    } catch (error) {
      console.error("Failed to merge PDFs:", error);
      alert("An error occurred while merging PDFs.");
    } finally {
      setIsMerging(false);
    }
  };

  const reset = () => {
    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setFiles([]);
    setMergedPdfUrl(null);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Merge PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Combine multiple PDFs into a single document. Drag and drop your files below, reorder them, and click merge. All processing is done locally in your browser.
            </p>
          </div>

          {!mergedPdfUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden">
              <div 
                className={`p-12 text-center transition-colors border-b border-outline-variant/30 ${isDragging ? 'bg-primary/5' : 'bg-surface'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf" 
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                  <UploadCloud size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2">Drag & Drop PDFs here</h3>
                <p className="text-on-surface-variant mb-6">or click to browse your files</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  Select PDF Files
                </button>
              </div>

              {files.length > 0 && (
                <div className="p-8 bg-surface-container-lowest">
                  <h4 className="font-semibold mb-4 text-on-surface">Files to Merge ({files.length})</h4>
                  <div className="space-y-3 mb-8">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-outline-variant/40 shadow-sm">
                        <div className="flex items-center flex-1 min-w-0 mr-4">
                          <FileIcon className="text-primary mr-3 shrink-0" size={24} />
                          <span className="truncate font-medium text-sm">{file.name}</span>
                          <span className="ml-3 text-xs text-on-surface-variant shrink-0">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => moveUp(index)} 
                            disabled={index === 0}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                          >
                            <ArrowUp size={18} />
                          </button>
                          <button 
                            onClick={() => moveDown(index)} 
                            disabled={index === files.length - 1}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                          >
                            <ArrowDown size={18} />
                          </button>
                          <div className="w-px h-6 bg-outline-variant/50 mx-1"></div>
                          <button 
                            onClick={() => removeFile(index)}
                            className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-4 border-t border-outline-variant/30 pt-6">
                    <button 
                      onClick={() => setFiles([])}
                      className="px-6 py-3 font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={handleMerge}
                      disabled={files.length < 2 || isMerging}
                      className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center"
                    >
                      {isMerging ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={20} />
                          Merging...
                        </>
                      ) : (
                        'Merge PDFs'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Merge Complete!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDFs have been successfully merged into a single document.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={mergedPdfUrl} 
                  download="merged-document.pdf"
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg"
                >
                  Merge More Files
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
