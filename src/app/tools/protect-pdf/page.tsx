'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';

import { UploadCloud, File as FileIcon, Download, Loader2, X, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ProtectPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!password) {
      alert("Please enter a password.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const pdfBytes = await (await import('../../../utils/pdf-tools')).protectPdf(file, password);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error) {
      console.error("Failed to protect PDF:", error);
      alert("An error occurred while protecting the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">Protect PDF</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Encrypt your PDF with a password to keep sensitive data confidential.
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
                    <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
                      <Lock size={48} />
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
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <button 
                      onClick={() => setFile(null)}
                      className="absolute top-0 right-0 p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                    <FileIcon className="text-primary mb-6" size={80} />
                    <h3 className="text-xl font-bold mb-2 text-center break-all">{file.name}</h3>
                    <p className="text-on-surface-variant text-sm font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Password Options */}
              <div className={`flex-1 bg-surface-container-lowest border-t md:border-t-0 md:border-l border-outline-variant/30 p-8 flex flex-col justify-center ${!file ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="text-2xl font-bold mb-8 flex items-center text-on-surface">
                  <ShieldCheck className="mr-3 text-primary" size={28} />
                  Set Password
                </h3>

                <form onSubmit={handleProcess} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        className="w-full px-5 py-4 bg-white border border-outline-variant/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12 text-lg"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className={`w-full px-5 py-4 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all text-lg ${
                        confirmPassword && password !== confirmPassword 
                          ? 'border-error focus:ring-error/50 bg-error/5' 
                          : 'border-outline-variant/60 focus:ring-primary focus:border-transparent'
                      }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-error text-sm mt-2 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={!file || isProcessing || !password || password !== confirmPassword}
                      className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={24} />
                          Encrypting...
                        </>
                      ) : (
                        'Protect PDF'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant/30 p-12 text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4">PDF Protected!</h2>
              <p className="text-on-surface-variant mb-10 max-w-md mx-auto">
                Your PDF has been successfully encrypted with the password you provided.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href={resultUrl} 
                  download={`protected-${file?.name || 'document'}.pdf`}
                  className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center text-lg"
                >
                  <Download className="mr-2" size={24} />
                  Download PDF
                </a>
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-surface-container hover:bg-outline-variant/20 font-bold rounded-full transition-colors flex items-center justify-center text-lg text-on-surface"
                >
                  Protect Another File
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
