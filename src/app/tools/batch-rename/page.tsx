'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { UploadCloud, File as FileIcon, Download, Loader2, FolderOutput, X, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';

export default function BatchRenamePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pattern, setPattern] = useState({
    baseName: 'document',
    prefix: '',
    suffix: '',
    startNumber: 1,
    separator: '-'
  });

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const generateNewName = (file: File, index: number) => {
    let newName = '';
    if (pattern.prefix) newName += pattern.prefix + pattern.separator;
    if (pattern.baseName === '{original}') {
      newName += file.name.replace('.pdf', '');
    } else {
      newName += pattern.baseName;
    }
    newName += pattern.separator + (pattern.startNumber + index).toString().padStart(3, '0');
    if (pattern.suffix) newName += pattern.separator + pattern.suffix;
    
    // clean up double separators if any
    newName = newName.replace(new RegExp(`\\${pattern.separator}{2,}`, 'g'), pattern.separator);
    
    return newName + '.pdf';
  };

  const handleRename = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newName = generateNewName(file, i);
        const arrayBuffer = await file.arrayBuffer();
        zip.file(newName, arrayBuffer);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setResultUrl(URL.createObjectURL(zipBlob));
    } catch (error) {
      console.error(error);
      alert("An error occurred while renaming files.");
    } finally {
      setIsProcessing(false);
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
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Batch Rename PDFs</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Easily rename multiple PDF files at once using custom patterns, prefixes, and numbering.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
              
              {/* Left Side - File List */}
              <div className={`flex-1 p-8 flex flex-col transition-colors ${files.length === 0 && isDragging ? 'bg-primary/5' : 'bg-surface'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Selected Files ({files.length})</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-surface-container hover:bg-outline-variant/20 text-sm font-semibold rounded-lg transition-colors flex items-center">
                    <UploadCloud className="mr-2" size={16} /> Add More
                  </button>
                  <input type="file" accept=".pdf" multiple ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                </div>

                {files.length === 0 ? (
                  <div className="flex-grow border-2 border-dashed border-outline-variant/50 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest">
                    <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                      <UploadCloud size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Drag & Drop PDFs here</h3>
                    <p className="text-on-surface-variant mb-6">or use the button above to browse</p>
                  </div>
                ) : (
                  <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-outline-variant/30 rounded-xl bg-surface-container-lowest group">
                        <div className="flex items-center overflow-hidden">
                          <FileIcon className="text-primary mr-3 flex-shrink-0" size={20} />
                          <div className="truncate text-sm font-medium" title={file.name}>{file.name}</div>
                        </div>
                        <button onClick={() => removeFile(idx)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side - Options */}
              <div className={`w-full md:w-[450px] bg-surface-container-lowest border-t md:border-t-0 md:border-l border-outline-variant/30 p-8 flex flex-col ${files.length === 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <RefreshCw className="mr-3 text-primary" size={24} />
                  Rename Rules
                </h3>

                <div className="space-y-5 flex-grow">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">Base Name</label>
                    <div className="flex gap-2">
                      <select 
                        value={pattern.baseName === '{original}' ? '{original}' : 'custom'}
                        onChange={(e) => setPattern({...pattern, baseName: e.target.value === '{original}' ? '{original}' : 'document'})}
                        className="px-3 py-2 border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-surface"
                      >
                        <option value="custom">Custom Text</option>
                        <option value="{original}">Original Name</option>
                      </select>
                      {pattern.baseName !== '{original}' && (
                        <input type="text" value={pattern.baseName} onChange={e => setPattern({...pattern, baseName: e.target.value})} className="flex-grow px-3 py-2 border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="e.g. invoice" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Prefix</label>
                      <input type="text" value={pattern.prefix} onChange={e => setPattern({...pattern, prefix: e.target.value})} className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="e.g. 2026" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Suffix</label>
                      <input type="text" value={pattern.suffix} onChange={e => setPattern({...pattern, suffix: e.target.value})} className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="e.g. v2" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Start Number</label>
                      <input type="number" min="1" value={pattern.startNumber} onChange={e => setPattern({...pattern, startNumber: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Separator</label>
                      <input type="text" value={pattern.separator} onChange={e => setPattern({...pattern, separator: e.target.value})} className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="e.g. -" />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Preview</div>
                    <div className="space-y-1">
                      {files.slice(0, 3).map((f, i) => (
                        <div key={i} className="text-sm truncate font-mono text-on-surface-variant">
                          {generateNewName(f, i)}
                        </div>
                      ))}
                      {files.length > 3 && (
                        <div className="text-sm font-mono text-on-surface-variant opacity-70">...and {files.length - 3} more</div>
                      )}
                      {files.length === 0 && (
                        <div className="text-sm font-mono text-on-surface-variant italic">Add files to see preview</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/30">
                  <button onClick={handleRename} disabled={files.length === 0 || isProcessing} className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center text-lg">
                    {isProcessing ? <><Loader2 className="animate-spin mr-2" size={24} /> Renaming...</> : <><FolderOutput className="mr-2" size={24} /> Rename & Download ZIP</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Files Renamed!</h2>
              <p className="text-on-surface-variant mb-10">Your {files.length} PDFs have been successfully renamed and packaged into a ZIP archive.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href={resultUrl} download="renamed-pdfs.zip" className="px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center text-lg">
                  <Download className="mr-2" size={24} /> Download ZIP
                </a>
                <button onClick={reset} className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-semibold rounded-full transition-colors flex items-center justify-center text-lg">
                  Process More Files
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
