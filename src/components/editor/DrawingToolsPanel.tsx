'use client';

import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Pen, Pencil, Highlighter, Paintbrush, PenTool, Minus, CircleDot } from 'lucide-react';

const AdvancedColorPicker = ({ value, onChange, presets, allowTransparent = false }: { value: string, onChange: (c: string) => void, presets: string[], allowTransparent?: boolean }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div 
          className="relative w-8 h-8 rounded-full shadow-sm border border-outline-variant/50 overflow-hidden flex-shrink-0" 
          style={{ 
            backgroundColor: value === 'transparent' ? '#ffffff' : value, 
            background: value === 'transparent' ? 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px' : undefined 
          }}
        >
          <input 
            type="color" 
            value={value === 'transparent' ? '#000000' : value} 
            onChange={(e) => onChange(e.target.value)} 
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 opacity-0 cursor-pointer"
            title="Custom Color (Hex, RGB, Eyedropper)"
          />
        </div>
        <div className="flex-1 flex items-center flex-wrap gap-1">
          {allowTransparent && (
            <button
              onClick={() => onChange('transparent')}
              className={`px-2 py-1 rounded text-[9px] font-bold border transition ${value === 'transparent' ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              Transparent
            </button>
          )}
          <span className="text-[10px] text-on-surface font-semibold ml-auto font-mono bg-surface-container px-2 py-1 rounded">
            {value === 'transparent' ? 'NONE' : value.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {presets.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-5 h-5 rounded border transition ${value === c ? 'border-primary scale-110 shadow-sm' : 'border-transparent shadow-sm hover:scale-105'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
};

const markerTypes = [
  { id: 'pen' as const, label: 'Pen', icon: Pen, desc: 'Smooth solid lines', defaultWidth: 2, defaultOpacity: 1.0 },
  { id: 'pencil' as const, label: 'Pencil', icon: Pencil, desc: 'Thin light strokes', defaultWidth: 1, defaultOpacity: 0.8 },
  { id: 'marker' as const, label: 'Marker', icon: PenTool, desc: 'Thick semi-transparent', defaultWidth: 6, defaultOpacity: 0.7 },
  { id: 'highlighter' as const, label: 'Highlighter', icon: Highlighter, desc: 'Wide highlight overlay', defaultWidth: 14, defaultOpacity: 0.35 },
  { id: 'brush' as const, label: 'Brush', icon: Paintbrush, desc: 'Variable width strokes', defaultWidth: 4, defaultOpacity: 0.9 },
  { id: 'calligraphy' as const, label: 'Calligraphy', icon: Minus, desc: 'Angled thick strokes', defaultWidth: 3, defaultOpacity: 1.0 },
  { id: 'fineliner' as const, label: 'Fine Liner', icon: CircleDot, desc: 'Ultra-thin precise', defaultWidth: 1, defaultOpacity: 1.0 },
];

const presetColors = [
  '#09090b', '#dc2626', '#2563eb', '#16a34a', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1',
  '#ffffff', '#64748b',
];

export const DrawingToolsPanel: React.FC = () => {
  const {
    drawingStyle, setDrawingStyle,
    drawingOpacity, setDrawingOpacity,
    drawingSmoothing, setDrawingSmoothing,
    strokeWidth, setStrokeWidth,
    strokeColor, setStrokeColor,
    eraserSize, setEraserSize,
    activeTool,
  } = useEditorStore();

  return (
    <div className="space-y-4">
      {/* Marker Type Selector */}
      <div>
        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-2">Marker Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {markerTypes.map(marker => {
            const Icon = marker.icon;
            const isActive = drawingStyle === marker.id;
            return (
              <button
                key={marker.id}
                onClick={() => {
                  setDrawingStyle(marker.id);
                  setStrokeWidth(marker.defaultWidth);
                  setDrawingOpacity(marker.defaultOpacity);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                    : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:border-outline-variant/40'
                }`}
              >
                <Icon size={13} className="flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold block leading-tight">{marker.label}</span>
                  <span className="text-[8px] opacity-60 block leading-tight truncate">{marker.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Thickness */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-bold text-on-surface-variant uppercase">Thickness</span>
          <span className="font-bold text-primary">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-full accent-primary h-1.5"
        />
        {/* Visual preview of stroke */}
        <div className="mt-1.5 flex items-center justify-center h-6 bg-surface-container rounded">
          <div
            className="rounded-full"
            style={{
              width: `${Math.min(strokeWidth * 3, 60)}px`,
              height: `${Math.min(strokeWidth, 16)}px`,
              backgroundColor: strokeColor,
              opacity: drawingOpacity,
            }}
          />
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-bold text-on-surface-variant uppercase">Opacity</span>
          <span className="font-bold text-primary">{Math.round(drawingOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={Math.round(drawingOpacity * 100)}
          onChange={(e) => setDrawingOpacity(parseInt(e.target.value) / 100)}
          className="w-full accent-primary h-1.5"
        />
      </div>

      {/* Smoothing */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-bold text-on-surface-variant uppercase">Smoothing</span>
          <span className="font-bold text-primary">{drawingSmoothing}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          value={drawingSmoothing}
          onChange={(e) => setDrawingSmoothing(parseInt(e.target.value))}
          className="w-full accent-primary h-1.5"
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Color</label>
        <AdvancedColorPicker value={strokeColor} onChange={setStrokeColor} presets={presetColors} />
      </div>

      {/* Eraser Size */}
      <div className="border-t border-outline-variant/30 pt-4 mt-4">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-bold text-on-surface-variant uppercase">Eraser Size</span>
          <span className="font-bold text-primary">{eraserSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={eraserSize}
          onChange={(e) => setEraserSize(parseInt(e.target.value))}
          className="w-full accent-primary h-1.5"
        />
        {/* Eraser Visual Preview */}
        <div className="mt-3 flex items-center justify-center h-28 bg-surface-container rounded-lg border border-outline-variant/30 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#9ca3af_1.5px,_transparent_1px)] bg-[size:12px_12px]" />
          <span className="absolute top-2 left-2 text-[8px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Preview</span>
          <div 
            className="bg-white rounded-full shadow-md border border-outline-variant/50 relative z-10 transition-all duration-75 flex items-center justify-center"
            style={{ width: eraserSize, height: eraserSize }}
          >
            <CircleDot size={Math.min(16, eraserSize * 0.5)} className="text-outline-variant/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolsPanel;
