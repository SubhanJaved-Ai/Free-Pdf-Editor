'use client';

import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { SHAPE_DEFINITIONS, ShapeDefinition } from '../../utils/shapeDefinitions';
import { Search } from 'lucide-react';

export const ShapePicker: React.FC = () => {
  const { shapeType, setShapeType, setActiveTool, fillColor, strokeColor, strokeWidth } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'lines' | 'flow' | 'document'>('all');

  const categories = [
    { id: 'all' as const, label: 'All' },
    { id: 'basic' as const, label: 'Basic' },
    { id: 'lines' as const, label: 'Lines' },
    { id: 'flow' as const, label: 'Flow' },
    { id: 'document' as const, label: 'Document' },
  ];

  const filteredShapes = SHAPE_DEFINITIONS.filter(shape => {
    const matchesCategory = activeCategory === 'all' || shape.category === activeCategory;
    const matchesSearch = !searchQuery || shape.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectShape = (shape: ShapeDefinition) => {
    setShapeType(shape.id);
    setActiveTool('shape');
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search shapes..."
          className="w-full bg-surface-container border border-outline-variant/30 text-xs text-on-surface pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:bg-surface-container-high'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Shape Grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-72 overflow-y-auto pr-0.5">
        {filteredShapes.map(shape => {
          const isActive = shapeType === shape.id;
          const svgContent = shape.render(
            fillColor === 'transparent' ? '#e0e7ff' : fillColor,
            strokeColor || '#3b82f6',
            2
          );
          return (
            <button
              key={shape.id}
              onClick={() => handleSelectShape(shape)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                isActive
                  ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-sm'
                  : 'bg-surface-container border-outline-variant/20 hover:bg-surface-container-high hover:border-outline-variant/50'
              }`}
              title={shape.label}
            >
              <svg
                viewBox="0 0 100 100"
                className="w-8 h-8"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
              <span className="text-[8px] font-semibold text-on-surface-variant leading-tight text-center truncate w-full">
                {shape.label}
              </span>
            </button>
          );
        })}
      </div>

      {filteredShapes.length === 0 && (
        <p className="text-xs text-on-surface-variant text-center py-4">No shapes found</p>
      )}
    </div>
  );
};

export default ShapePicker;
