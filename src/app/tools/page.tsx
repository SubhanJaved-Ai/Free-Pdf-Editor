'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Search, LayoutPanelTop, Scissors, Settings, FileSignature, Lock, Type, ImageIcon, PenTool, FileMinus, FilePlus, RotateCw, Unlock, Image as LucideImage } from 'lucide-react';

export default function ToolsHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Edit', 'Convert', 'Organize', 'Security'];

  const tools = [
    { id: 'edit-pdf', title: 'Edit PDF', description: 'Add text, images, shapes or freehand annotations to a PDF document.', icon: <Type size={24} />, category: 'Edit' },
    { id: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDFs and images into a single document.', icon: <LayoutPanelTop size={24} />, category: 'Organize' },
    { id: 'split-pdf', title: 'Split PDF', description: 'Separate one page or a whole set for easy conversion into independent PDF files.', icon: <Scissors size={24} />, category: 'Organize' },
    { id: 'compress-pdf', title: 'Compress PDF', description: 'Reduce file size while optimizing for maximal PDF quality.', icon: <Settings size={24} />, category: 'Organize' },
    { id: 'sign-pdf', title: 'Sign PDF', description: 'Sign yourself or request electronic signatures from others.', icon: <FileSignature size={24} />, category: 'Edit' },
    { id: 'protect-pdf', title: 'Protect PDF', description: 'Encrypt your PDF with a password to keep sensitive data confidential.', icon: <Lock size={24} />, category: 'Security' },
    { id: 'unlock-pdf', title: 'Unlock PDF', description: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.', icon: <Unlock size={24} />, category: 'Security' },
    { id: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: <LucideImage size={24} />, category: 'Convert' },
    { id: 'pdf-to-jpg', title: 'PDF to JPG', description: 'Extract all images contained in a PDF or convert each page to a JPG file.', icon: <LucideImage size={24} />, category: 'Convert' },
    { id: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once.', icon: <RotateCw size={24} />, category: 'Organize' },
    { id: 'delete-pages', title: 'Delete Pages', description: 'Remove pages from a PDF. Sort pages and delete the ones you don\'t need.', icon: <FileMinus size={24} />, category: 'Organize' },
    { id: 'extract-pages', title: 'Extract Pages', description: 'Get a new document containing only the desired pages from your PDF.', icon: <FilePlus size={24} />, category: 'Organize' },
  ];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tight">All PDF Tools</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
              Every tool you need to work with PDFs in one place. All processed locally in your browser for maximum privacy and speed.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-on-surface-variant" />
              </div>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-4 bg-white border border-outline-variant/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                placeholder="Search for a tool... (e.g., 'Merge', 'Compress')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeCategory === category 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-surface-container hover:bg-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <Link 
                  key={tool.id} 
                  href={`/editor?tool=${tool.id}`} 
                  className="bg-white p-8 rounded-2xl border border-outline-variant/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 mb-6">
                    {tool.icon}
                  </div>
                  <h3 className="font-headline-sm font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed flex-grow">
                    {tool.description}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-outline-variant">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">No tools found</h3>
              <p className="text-on-surface-variant">We couldn't find anything matching "{searchQuery}".</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
