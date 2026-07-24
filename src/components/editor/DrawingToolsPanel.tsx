'use client';

import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { ColorPicker } from './ColorPicker';
import { Pen, Pencil, Highlighter, Paintbrush, PenTool, Minus, CircleDot } from 'lucide-react';

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
  } = useEditorStore();

  return (
    <div className="space-y-4">
      {/* Marker Type Selector */}
      <div>
        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-2 tracking-wider">
          Marker Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {markerTypes.map(marker => {
            const Icon = marker.icon;
            const isActive = drawingStyle === marker.id;
            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => {
                  setDrawingStyle(marker.id);
                  setStrokeWidth(marker.defaultWidth);
                  setDrawingOpacity(marker.defaultOpacity);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:border-outline-variant/50 hover:text-on-surface'
                }`}
              >
                <Icon size={14} className="flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block leading-tight">{marker.label}</span>
                  <span className="text-[9px] opacity-70 block leading-tight truncate">{marker.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Thickness */}
      <div>
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant mb-1.5 tracking-wider">
          <span>Thickness</span>
          <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-full accent-primary h-1.5 cursor-pointer"
        />
        {/* Visual preview of stroke */}
        <div className="mt-2 flex items-center justify-center h-8 bg-surface-container rounded-xl border border-outline-variant/20">
          <div
            className="rounded-full"
            style={{
              width: `${Math.min(strokeWidth * 3, 80)}px`,
              height: `${Math.min(strokeWidth, 20)}px`,
              backgroundColor: strokeColor,
              opacity: drawingOpacity,
            }}
          />
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant mb-1.5 tracking-wider">
          <span>Opacity</span>
          <span className="text-primary font-mono">{Math.round(drawingOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={Math.round(drawingOpacity * 100)}
          onChange={(e) => setDrawingOpacity(parseInt(e.target.value) / 100)}
          className="w-full accent-primary h-1.5 cursor-pointer"
        />
      </div>

      {/* Smoothing */}
      <div>
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant mb-1.5 tracking-wider">
          <span>Smoothing</span>
          <span className="text-primary font-mono">{drawingSmoothing}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          value={drawingSmoothing}
          onChange={(e) => setDrawingSmoothing(parseInt(e.target.value))}
          className="w-full accent-primary h-1.5 cursor-pointer"
        />
      </div>

      {/* Color Picker with Direct HEX Input */}
      <div>
        <ColorPicker 
          label="Drawing Color" 
          value={strokeColor} 
          onChange={setStrokeColor} 
          presets={presetColors} 
        />
      </div>

      {/* Eraser Size */}
      <div className="border-t border-outline-variant/30 pt-4 mt-4">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant mb-1.5 tracking-wider">
          <span>Eraser Size</span>
          <span className="text-primary font-mono">{eraserSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={eraserSize}
          onChange={(e) => setEraserSize(parseInt(e.target.value))}
          className="w-full accent-primary h-1.5 cursor-pointer"
        />
        {/* Eraser Visual Preview */}
        <div className="mt-3 flex items-center justify-center h-28 bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#9ca3af_1.5px,_transparent_1px)] bg-[size:12px_12px]" />
          <span className="absolute top-2 left-2 text-[8px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Preview</span>
          <div 
            className="bg-white rounded-full shadow-md border border-outline-variant/50 relative z-10 transition-all duration-75 flex items-center justify-center"
            style={{ width: eraserSize, height: eraserSize }}
          >
            <CircleDot size={Math.min(16, eraserSize * 0.5)} className="text-outline-variant/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolsPanel;
