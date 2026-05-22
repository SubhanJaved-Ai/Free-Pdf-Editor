'use client';

import React from 'react';
import { useEditorStore, EditorElement } from '../../store/useEditorStore';
import {
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Droplets,
  Maximize,
  RotateCcw,
} from 'lucide-react';

interface ImagePropertiesPanelProps {
  element: EditorElement;
}

export const ImagePropertiesPanel: React.FC<ImagePropertiesPanelProps> = ({ element }) => {
  const { updateElement } = useEditorStore();

  const update = (key: string, value: any) => {
    updateElement(element.id, { [key]: value });
  };

  const resetFilters = () => {
    updateElement(element.id, {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      imgBlur: 0,
      imgGrayscale: 0,
      exposure: 100,
      warmth: 100,
      flipH: false,
      flipV: false,
    });
  };

  const sliders = [
    { key: 'brightness', label: 'Brightness', icon: Sun, min: 0, max: 200, def: 100 },
    { key: 'contrast', label: 'Contrast', icon: Contrast, min: 0, max: 200, def: 100 },
    { key: 'saturation', label: 'Saturation', icon: Droplets, min: 0, max: 200, def: 100 },
    { key: 'exposure', label: 'Exposure', icon: Sun, min: 0, max: 200, def: 100 },
    { key: 'warmth', label: 'Warmth', icon: Sun, min: 0, max: 200, def: 100 },
    { key: 'imgBlur', label: 'Blur', icon: Droplets, min: 0, max: 20, def: 0 },
    { key: 'imgGrayscale', label: 'Grayscale', icon: Contrast, min: 0, max: 100, def: 0 },
  ];

  const fitOptions: { value: EditorElement['objectFit']; label: string }[] = [
    { value: 'contain', label: 'Contain' },
    { value: 'cover', label: 'Cover' },
    { value: 'fill', label: 'Stretch' },
    { value: 'none', label: 'Original' },
  ];

  return (
    <div className="space-y-4">
      {/* Section: Flip & Fit */}
      <div>
        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-2">Transform</label>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => update('flipH', !element.flipH)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              element.flipH
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <FlipHorizontal size={13} />
            Flip H
          </button>
          <button
            onClick={() => update('flipV', !element.flipV)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              element.flipV
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <FlipVertical size={13} />
            Flip V
          </button>
        </div>
      </div>

      {/* Section: Object Fit */}
      <div>
        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-2">
          <Maximize size={11} className="inline mr-1" />
          Image Fit
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {fitOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('objectFit', opt.value)}
              className={`py-1.5 rounded-md border text-[10px] font-semibold transition-all ${
                (element.objectFit || 'contain') === opt.value
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section: Opacity / Transparency */}
      <div className="border-t border-outline-variant/30 pt-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase font-bold text-on-surface-variant">Opacity</label>
          <span className={`text-[10px] font-bold ${(element.opacity ?? 1) === 1 ? 'text-on-surface-variant/50' : 'text-primary'}`}>
            {Math.round((element.opacity ?? 1) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={Math.round((element.opacity ?? 1) * 100)}
          onChange={(e) => update('opacity', parseInt(e.target.value) / 100)}
          className="w-full accent-primary h-1.5 cursor-pointer"
        />
        <div className="flex gap-1.5 mt-2">
          {[100, 75, 50, 25].map(v => (
            <button
              key={v}
              onClick={() => update('opacity', v / 100)}
              className={`flex-1 py-1 rounded text-[9px] font-bold border transition-all ${
                Math.round((element.opacity ?? 1) * 100) === v
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Section: Adjustments */}
      <div className="border-t border-outline-variant/30 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase font-bold text-on-surface-variant">Adjustments</label>
          <button
            onClick={resetFilters}
            className="text-[9px] font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
          >
            <RotateCcw size={10} />
            Reset All
          </button>
        </div>
        <div className="space-y-2.5">
          {sliders.map(slider => {
            const value = (element as any)[slider.key] ?? slider.def;
            const isDefault = value === slider.def;
            return (
              <div key={slider.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium text-on-surface-variant">{slider.label}</span>
                  <span className={`text-[10px] font-bold ${isDefault ? 'text-on-surface-variant/50' : 'text-primary'}`}>
                    {slider.key === 'imgBlur' ? `${value}px` : `${value}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={value}
                  onChange={(e) => update(slider.key, parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Quick Presets */}
      <div className="border-t border-outline-variant/30 pt-3">
        <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-2">Quick Presets</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Original', b: 100, c: 100, s: 100, g: 0, bl: 0, e: 100, w: 100 },
            { label: 'Vivid', b: 105, c: 120, s: 140, g: 0, bl: 0, e: 105, w: 100 },
            { label: 'B&W', b: 100, c: 110, s: 0, g: 100, bl: 0, e: 100, w: 100 },
            { label: 'Warm', b: 105, c: 100, s: 110, g: 0, bl: 0, e: 100, w: 140 },
            { label: 'Cool', b: 100, c: 105, s: 90, g: 0, bl: 0, e: 100, w: 60 },
            { label: 'Soft', b: 105, c: 90, s: 90, g: 0, bl: 2, e: 100, w: 100 },
            { label: 'Sharp', b: 100, c: 130, s: 110, g: 0, bl: 0, e: 110, w: 100 },
            { label: 'Faded', b: 110, c: 80, s: 70, g: 0, bl: 0, e: 100, w: 100 },
            { label: 'Drama', b: 95, c: 150, s: 120, g: 0, bl: 0, e: 100, w: 100 },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => updateElement(element.id, {
                brightness: preset.b,
                contrast: preset.c,
                saturation: preset.s,
                imgGrayscale: preset.g,
                imgBlur: preset.bl,
                exposure: preset.e,
                warmth: preset.w,
              })}
              className="py-1.5 rounded-md border border-outline-variant/30 bg-surface-container text-[9px] font-semibold text-on-surface-variant hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImagePropertiesPanel;
