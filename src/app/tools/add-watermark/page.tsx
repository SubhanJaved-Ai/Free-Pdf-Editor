'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { ColorPicker } from '../../../components/editor/ColorPicker';

import { UploadCloud, File as FileIcon, Download, Loader2, X, Image as ImageIcon, Type, Droplets } from 'lucide-react';

export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  
  // Options state
  const [textValue, setTextValue] = useState('CONFIDENTIAL');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(48); // for text
  const [scale, setScale] = useState(1.0); // for image
  const [position, setPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');

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

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = Array.from(e.target.files).find(f => f.type.startsWith('image/'));
      if (selectedFile) setImageFile(selectedFile);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!file) return;
    if (watermarkType === 'text' && !textValue.trim()) {
      alert("Please enter watermark text.");
      return;
    }
    if (watermarkType === 'image' && !imageFile) {
      alert("Please upload a watermark image.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const options = {
        type: watermarkType,
        text: watermarkType === 'text' ? textValue : undefined,
        imageFile: watermarkType === 'image' && imageFile ? imageFile : undefined,
        opacity,
        rotation,
        color,
        size,
        scale,
        position
      };
      
      const pdfBytes = await (await import('../../../utils/pdf-tools')).addWatermark(file, options);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to add watermark:", error);
      alert("An error occurred while adding the watermark.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setImageFile(null);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Add Watermark to PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Stamp an image or text over your PDF in seconds. Adjust typography, transparency and position.
            </p>
          </div>

          {!resultUrl ? (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              
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
                <div className="flex flex-col md:flex-row w-full">
                  {/* Left Side - Options */}
                  <div className="flex-1 p-8 bg-surface border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant/20">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileIcon className="text-primary" size={24} />
                        <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                      </h3>
                      <button 
                        onClick={() => setFile(null)}
                        className="text-sm font-medium text-error hover:underline"
                      >
                        Change File
                      </button>
                    </div>

                    <div className="flex bg-surface-container rounded-xl p-1 mb-8 shadow-inner">
                      <button 
                        onClick={() => setWatermarkType('text')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                          watermarkType === 'text' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <Type size={18} className="mr-2" /> Text
                      </button>
                      <button 
                        onClick={() => setWatermarkType('image')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                          watermarkType === 'image' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <ImageIcon size={18} className="mr-2" /> Image
                      </button>
                    </div>

                    <div className="flex-grow space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      {watermarkType === 'text' ? (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Text Content</label>
                            <input 
                              type="text" 
                              value={textValue}
                              onChange={e => setTextValue(e.target.value)}
                              placeholder="Enter watermark text..."
                              className="w-full px-4 py-3 bg-white border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Font Size</label>
                              <input 
                                type="number" 
                                value={size}
                                onChange={e => setSize(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-white border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              />
                            </div>
                            <div>
                              <ColorPicker label="Color" value={color} onChange={setColor} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Upload Image</label>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            ref={imageInputRef}
                            onChange={handleImageInput}
                            className="hidden"
                          />
                          {imageFile ? (
                            <div className="flex items-center justify-between p-4 border border-outline-variant/60 rounded-xl bg-white">
                              <span className="truncate max-w-[200px] font-medium text-sm">{imageFile.name}</span>
                              <button onClick={() => setImageFile(null)} className="text-error hover:bg-error/10 p-1 rounded-md transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => imageInputRef.current?.click()}
                              className="w-full py-4 border-2 border-dashed border-primary/40 rounded-xl hover:bg-primary/5 text-primary font-bold flex items-center justify-center transition-colors"
                            >
                              <UploadCloud className="mr-2" size={20} /> Browse Image
                            </button>
                          )}
                          
                          <div className="mt-6">
                            <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex justify-between">
                              <span>Scale (Size)</span>
                              <span>{Math.round(scale * 100)}%</span>
                            </label>
                            <input 
                              type="range" 
                              min="0.1" 
                              max="3.0" 
                              step="0.1" 
                              value={scale}
                              onChange={e => setScale(Number(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>
                        </div>
                      )}

                      <hr className="border-outline-variant/30 my-6" />

                      {/* Common Options */}
                      <div>
                        <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex justify-between">
                          <span>Opacity</span>
                          <span>{Math.round(opacity * 100)}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1.0" 
                          step="0.05" 
                          value={opacity}
                          onChange={e => setOpacity(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                      </div>

                      {watermarkType === 'text' && (
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex justify-between">
                            <span>Rotation</span>
                            <span>{rotation}°</span>
                          </label>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            step="5" 
                            value={rotation}
                            onChange={e => setRotation(Number(e.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Position</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'top-left', label: 'Top L' },
                            { id: 'center', label: 'Center' },
                            { id: 'top-right', label: 'Top R' },
                            { id: 'bottom-left', label: 'Bot L' },
                            { id: 'bottom-right', label: 'Bot R' }
                          ].map(pos => (
                            <button
                              key={pos.id}
                              onClick={() => setPosition(pos.id as any)}
                              className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                                position === pos.id 
                                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                                  : 'bg-white border-outline-variant/40 text-on-surface-variant hover:border-primary/50'
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Action */}
                  <div className="flex-1 bg-surface-container-lowest p-8 flex flex-col justify-center items-center">
                    <div className="w-full max-w-sm">
                      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-8 shadow-lg text-center mb-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                        <Droplets className="text-primary mx-auto mb-4" size={40} />
                        <h4 className="text-xl font-bold mb-2">Ready to Apply</h4>
                        <p className="text-sm text-on-surface-variant mb-6">
                          Your {watermarkType} watermark will be stamped on all pages of the document.
                        </p>
                        
                        <button 
                          onClick={handleProcess}
                          disabled={isProcessing}
                          className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 text-lg flex items-center justify-center transform active:scale-95"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={24} />
                              Applying...
                            </>
                          ) : (
                            'Add Watermark'
                          )}
                        </button>
                      </div>
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
              <h2 className="text-3xl font-bold mb-4">Watermark Added Successfully!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDF has been stamped and is ready for download.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download={`watermarked-${file?.name || 'document'}.pdf`}
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
