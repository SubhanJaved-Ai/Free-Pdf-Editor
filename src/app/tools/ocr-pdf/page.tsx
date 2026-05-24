'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';

import { UploadCloud, File as FileIcon, Download, Loader2, FileText, X, Copy, CheckCircle } from 'lucide-react';

export default function OcrExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [useOcr, setUseOcr] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
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

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const text = await (await import('../../../utils/pdf-tools')).extractPdfText(file, useOcr, (p) => {
        setProgress(Math.round(p * 100));
      });
      setExtractedText(text || "No text could be extracted from this document.");
    } catch (error) {
      console.error(error);
      alert("An error occurred while extracting text.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace('.pdf', '')}-extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setExtractedText(null);
    setUseOcr(false);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">OCR & Extract Text</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Extract text from any PDF document, including scanned pages. Securely processed locally in your browser.
            </p>
          </div>

          {!extractedText ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              {/* Left Side */}
              <div className={`flex-1 p-12 flex flex-col items-center justify-center transition-colors ${!file && isDragging ? 'bg-primary/5' : 'bg-surface'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="text-center w-full">
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                    <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                      <UploadCloud size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Select a PDF file</h3>
                    <p className="text-on-surface-variant mb-6">or drag and drop it here</p>
                    <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                      Select PDF File
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <button onClick={() => setFile(null)} className="absolute top-0 right-0 p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors">
                      <X size={24} />
                    </button>
                    <FileIcon className="text-primary mb-4" size={64} />
                    <h3 className="text-xl font-bold mb-2 text-center break-all">{file.name}</h3>
                    <p className="text-on-surface-variant text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {/* Right Side */}
              <div className={`flex-1 bg-surface-container-lowest border-t md:border-t-0 md:border-l border-outline-variant/30 p-8 flex flex-col ${!file ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <FileText className="mr-3 text-primary" size={24} />
                  Extraction Options
                </h3>

                <div className="space-y-6 flex-grow">
                  <label className="flex items-start gap-4 p-4 border border-outline-variant/40 rounded-xl cursor-pointer hover:bg-surface transition-colors">
                    <div className="mt-1">
                      <input type="checkbox" checked={useOcr} onChange={() => setUseOcr(!useOcr)} className="w-5 h-5 accent-primary rounded" />
                    </div>
                    <div>
                      <div className="font-semibold text-on-surface mb-1">Use OCR (For scanned PDFs)</div>
                      <div className="text-sm text-on-surface-variant">Enable Optical Character Recognition for scanned images. This will take significantly longer to process.</div>
                    </div>
                  </label>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
                  {isProcessing && useOcr && <div className="text-sm font-bold text-primary mb-3">Processing Image OCR: {progress}%</div>}
                  <button onClick={handleExtract} disabled={!file || isProcessing} className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center text-lg">
                    {isProcessing ? <><Loader2 className="animate-spin mr-2" size={24} /> Extracting...</> : 'Extract Text'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-8 flex flex-col h-[70vh]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center"><FileText className="mr-3 text-primary" /> Extracted Text</h2>
                <div className="flex items-center gap-3">
                  <button onClick={handleCopy} className="px-4 py-2 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-lg transition-colors flex items-center text-sm">
                    {copied ? <><CheckCircle className="mr-2 text-green-500" size={18} /> Copied</> : <><Copy className="mr-2" size={18} /> Copy All</>}
                  </button>
                  <button onClick={handleDownloadTxt} className="px-4 py-2 bg-primary text-white hover:bg-primary/90 font-semibold rounded-lg transition-colors shadow-md flex items-center text-sm">
                    <Download className="mr-2" size={18} /> Download .txt
                  </button>
                  <button onClick={reset} className="p-2 bg-surface-container hover:bg-error/10 hover:text-error rounded-full transition-colors ml-2" title="Close">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-grow border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
                <textarea 
                  className="w-full h-full p-6 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono leading-relaxed bg-transparent"
                  value={extractedText}
                  readOnly
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
