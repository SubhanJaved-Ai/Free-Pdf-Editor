'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Search, LayoutPanelTop, Scissors, Settings, FileSignature, Lock, Type, Image as LucideImage, FileMinus, FilePlus, RotateCw, Unlock } from 'lucide-react';

export default function ToolsHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Edit', 'Convert', 'Organize', 'Security'];

  const tools = [
    { id: 'edit-pdf', title: 'Edit PDF', description: 'Add text, images, or shapes.', icon: <Type size={20} />, category: 'Edit' },
    { id: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDFs into one.', icon: <LayoutPanelTop size={20} />, category: 'Organize' },
    { id: 'split-pdf', title: 'Split PDF', description: 'Extract pages into independent files.', icon: <Scissors size={20} />, category: 'Organize' },
    { id: 'compress-pdf', title: 'Compress PDF', description: 'Reduce file size without quality loss.', icon: <Settings size={20} />, category: 'Organize' },
    { id: 'sign-pdf', title: 'Sign PDF', description: 'Add electronic signatures securely.', icon: <FileSignature size={20} />, category: 'Edit' },
    { id: 'protect-pdf', title: 'Protect PDF', description: 'Encrypt with password security.', icon: <Lock size={20} />, category: 'Security' },
    { id: 'unlock-pdf', title: 'Unlock PDF', description: 'Remove password restrictions.', icon: <Unlock size={20} />, category: 'Security' },
    { id: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Convert images to PDF documents.', icon: <LucideImage size={20} />, category: 'Convert' },
    { id: 'pdf-to-jpg', title: 'PDF to JPG', description: 'Extract pages as high-quality JPGs.', icon: <LucideImage size={20} />, category: 'Convert' },
    { id: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate pages to correct orientation.', icon: <RotateCw size={20} />, category: 'Organize' },
    { id: 'delete-pages', title: 'Delete Pages', description: 'Remove unwanted pages instantly.', icon: <FileMinus size={20} />, category: 'Organize' },
    { id: 'extract-pages', title: 'Extract Pages', description: 'Pull specific pages into a new file.', icon: <FilePlus size={20} />, category: 'Organize' },
  ];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 flex flex-col items-center">
        {/* Subtle mesh background */}
        <div className="mesh-gradient-optimized"></div>

        <div className="w-full max-w-5xl relative z-10">
          {/* Header & Search */}
          <div className="text-center mb-12 animate-fade-up">
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-8 tracking-tight">What do you need to do?</h1>
            
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-6 py-4 bg-surface border border-outline-variant/50 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 shadow-sm transition-all text-lg"
                placeholder="Search tools (e.g., Merge, Compress)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Segmented Control */}
          <div className="flex justify-center mb-12 animate-fade-up stagger-1">
            <div className="inline-flex bg-surface-variant/50 p-1 rounded-xl border border-outline-variant/30 overflow-x-auto max-w-full hide-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === category 
                      ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/50' 
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50 border border-transparent'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="animate-fade-up stagger-2">
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
                  <Link 
                    key={tool.id} 
                    href={['edit-pdf', 'sign-pdf'].includes(tool.id) ? `/editor` : `/tools/${tool.id}`} 
                    className="bento-card bg-surface p-5 rounded-xl border border-outline-variant/40 flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-surface-variant/50 flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {tool.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-on-surface text-base group-hover:text-primary transition-colors truncate">{tool.title}</h3>
                      <p className="text-on-surface-variant text-sm truncate">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface rounded-2xl border border-outline-variant/30">
                <div className="w-12 h-12 bg-surface-variant/50 rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-1">No tools found</h3>
                <p className="text-sm text-on-surface-variant">Try adjusting your search query.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
