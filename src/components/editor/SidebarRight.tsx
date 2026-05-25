'use client';

import React from 'react';
import { useEditorStore, EditorElement } from '../../store/useEditorStore';
import { ImagePropertiesPanel } from './ImagePropertiesPanel';
import { ShapePicker } from './ShapePicker';
import { DrawingToolsPanel } from './DrawingToolsPanel';
import { 
  Type, 
  Settings, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Maximize2,
  Trash2,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  Square,
  Pencil,
  X,
} from 'lucide-react';

const AdvancedColorPicker = ({ value, onChange, presets, allowTransparent = false }: { value: string, onChange: (c: string) => void, presets: string[], allowTransparent?: boolean }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div 
          className="relative w-8 h-8 rounded-full shadow-sm border border-outline-variant/50 overflow-hidden flex-shrink-0" 
          style={{ 
            background: value === 'transparent'
              ? 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px'
              : value
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
      <div className="grid grid-cols-7 gap-1">
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

export const SidebarRight: React.FC = () => {
  const {
    elements,
    selectedElementIds,
    updateElement,
    deleteElement,
    textColor,
    setTextColor,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    fontWeight,
    setFontWeight,
    fontStyle,
    setFontStyle,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    isOcrRunning,
    activeTool,
    layoutMode,
    rightSidebarWidth,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useEditorStore();

  const selectedElement = elements.find(el => selectedElementIds.includes(el.id));
  const blockClass = layoutMode === 'horizontal' ? 'w-56' : '';

  // Options lists
  const fontFamilies = [
    // Professional / Document Fonts (Web Safe & OS Defaults)
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Cambria', label: 'Cambria' },
    { value: 'Garamond', label: 'Garamond' },
    // Google Fonts - Sans Serif
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Work Sans', label: 'Work Sans' },
    { value: 'Ubuntu', label: 'Ubuntu' },
    { value: 'DM Sans', label: 'DM Sans' },
    // Google Fonts - Serif
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Libre Baskerville', label: 'Libre Baskerville' },
    { value: 'Lora', label: 'Lora' },
    { value: 'Crimson Text', label: 'Crimson Text' },
    { value: 'EB Garamond', label: 'EB Garamond' },
    { value: 'PT Serif', label: 'PT Serif' },
    // Google Fonts - Creative
    { value: 'Bebas Neue', label: 'Bebas Neue' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Oswald', label: 'Oswald' },
    { value: 'Quicksand', label: 'Quicksand' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  const presetColors = [
    '#000000', // Black
    '#ffffff', // White
    '#1e293b', // Slate
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
  ];



  const isMobileOpen = mobileSidebarOpen === 'right';
  const mobileClasses = isMobileOpen 
    ? 'fixed inset-y-0 right-0 z-50 shadow-2xl translate-x-0 transition-transform bg-surface-container-lowest' 
    : 'hidden md:flex md:relative md:translate-x-0';
  const asideStyle = layoutMode === 'horizontal' ? {} : { width: `${rightSidebarWidth}px` };

  // If no element is selected, show default styles inspector
  if (!selectedElement) {
    return (
      <aside 
        className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 p-4 pt-12 md:pt-4 border-l' : 'h-[calc(100vh-4rem)] bg-surface-container-lowest border-l p-4 pt-12 md:pt-4'} border-outline-variant/30 z-30 select-none overflow-y-auto max-w-full`}
        style={asideStyle}
      >
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-on-surface">
            <Settings size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Workspace Defaults</span>
          </div>
          {/* Mobile X Close Button — clearly visible, non-overlapping */}
          {isMobileOpen && (
            <button
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:border-outline-variant active:scale-90 transition-all shadow-sm"
              aria-label="Close panel"
              title="Close panel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className={layoutMode === 'horizontal' ? 'flex flex-row flex-wrap gap-x-8 gap-y-4 content-start' : 'flex flex-col'}>
          {/* Drawing Tools Panel — show when draw or erase tool active */}
          {(activeTool === 'draw' || activeTool === 'erase') && (
            <div className={`mb-4 ${layoutMode === 'horizontal' ? 'w-64' : ''}`}>
            <div className="flex items-center gap-2 text-on-surface mb-3">
              <Pencil size={13} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Drawing Tools</span>
            </div>
            <DrawingToolsPanel />
          </div>
        )}

        {/* Default Text Stylings */}
        <div className={`space-y-4 ${layoutMode === 'horizontal' ? 'w-56' : ''}`}>
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Default Font</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 text-xs text-on-surface p-2 rounded focus:outline-none focus:border-primary"
            >
              {fontFamilies.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">Default Text Color</label>
            <AdvancedColorPicker value={textColor} onChange={setTextColor} presets={presetColors} />
          </div>

          {/* Stroke and Border settings for shapes */}
          <div className={`${layoutMode === 'horizontal' ? 'w-56' : 'border-t border-outline-variant/30 pt-4 mt-4'}`}>
            <div className="flex items-center gap-2 text-on-surface mb-3">
              <Palette size={13} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Vector Shape Styling</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Stroke Width ({strokeWidth}px)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Stroke Color</label>
                <AdvancedColorPicker value={strokeColor} onChange={setStrokeColor} presets={presetColors} />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Fill Color</label>
                <AdvancedColorPicker value={fillColor} onChange={setFillColor} presets={presetColors} allowTransparent />
              </div>
            </div>
          </div>
        </div>

        {/* Shape Library */}
        <div className={`${layoutMode === 'horizontal' ? 'w-56' : 'border-t border-outline-variant/30 pt-4 mt-4'}`}>
          <div className="flex items-center gap-2 text-on-surface mb-3">
            <Square size={13} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Shape Library</span>
          </div>
          <ShapePicker />
          </div>
        </div>
      </aside>
    );
  }

  // Element Specific Properties Inspector
  return (
    <aside 
      className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 p-4 pt-12 md:pt-4 border-l' : 'h-[calc(100vh-4rem)] bg-surface-container-lowest border-l p-4 pt-12 md:pt-4'} border-outline-variant/30 z-30 select-none overflow-y-auto max-w-full`}
      style={asideStyle}
    >
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-on-surface">
          <Sliders size={14} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Properties</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile X Close Button */}
          {isMobileOpen && (
            <button
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:border-outline-variant active:scale-90 transition-all shadow-sm"
              aria-label="Close panel"
              title="Close panel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => deleteElement(selectedElement.id)}
            className="p-1.5 rounded bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 transition"
            title="Delete Element"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className={layoutMode === 'horizontal' ? 'flex flex-row flex-wrap gap-x-8 gap-y-4 content-start' : 'space-y-5 flex-1'}>
        {/* Transform Attributes (X, Y, Rotation, Opacity) */}
        <div className={blockClass}>
          <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Transforms</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <span className="text-[9px] text-zinc-500">Width</span>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement(selectedElement.id, { width: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 p-1.5 rounded"
              />
            </div>
            <div>
              <span className="text-[9px] text-zinc-500">Height</span>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement(selectedElement.id, { height: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 p-1.5 rounded"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Rotation</span>
                <span>{selectedElement.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedElement.rotation || 0}
                onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                className="w-full accent-veltis-violet"
              />
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Opacity</span>
                <span>{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((selectedElement.opacity || 1) * 100)}
                onChange={(e) => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-veltis-violet"
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <div className={`${blockClass} space-y-4 ${layoutMode === 'horizontal' ? '' : 'border-t border-white/5 pt-4'}`}>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Type size={13} className="text-veltis-cyan" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Typography</span>
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Helvetica'}
                onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 p-2 rounded focus:outline-none"
              >
                {fontFamilies.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Font Size ({selectedElement.fontSize || 14}px)</label>
              <input
                type="range"
                min="6"
                max="72"
                value={selectedElement.fontSize || 14}
                onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                className="w-full accent-veltis-cyan"
              />
            </div>

            {/* Typography Styles */}
            <div>
              <label className="text-[9px] text-zinc-500 block mb-1.5">Style</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`p-2 rounded border text-xs transition ${
                    selectedElement.fontWeight === 'bold' 
                      ? 'bg-veltis-violet/20 border-veltis-violet text-white' 
                      : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                  title="Bold"
                >
                  <Bold size={13} />
                </button>
                <button
                  onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`p-2 rounded border text-xs transition ${
                    selectedElement.fontStyle === 'italic' 
                      ? 'bg-veltis-violet/20 border-veltis-violet text-white' 
                      : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                  title="Italic"
                >
                  <Italic size={13} />
                </button>
                <button
                  onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                  className={`p-2 rounded border text-xs transition ${
                    selectedElement.textDecoration === 'underline' 
                      ? 'bg-veltis-violet/20 border-veltis-violet text-white' 
                      : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                  title="Underline"
                >
                  <Underline size={13} />
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-[9px] text-zinc-500 block mb-1.5">Alignment</label>
              <div className="flex bg-zinc-950 p-0.5 rounded border border-white/5">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => {
                  const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;
                  const isActive = selectedElement.align === align;
                  return (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedElement.id, { align })}
                      className={`flex-1 py-1.5 flex justify-center rounded transition ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Icon size={12} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Color */}
            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Color</label>
              <AdvancedColorPicker 
                value={selectedElement.color || '#000000'} 
                onChange={(c) => updateElement(selectedElement.id, { color: c })} 
                presets={presetColors} 
              />
            </div>

        {/* AI Assistant Helpers */}
        {/* Removed Fake UI AI Options per user requirements */}
        </div>
        )}

        {/* Image / Signature Properties Panel */}
        {(selectedElement.type === 'image' || selectedElement.type === 'signature') && (
          <div className={`${blockClass} space-y-3 ${layoutMode === 'horizontal' ? '' : 'border-t border-outline-variant/30 pt-4'}`}>
            <div className="flex items-center gap-1.5">
              <ImageIcon size={13} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Image Adjustments</span>
            </div>
            <ImagePropertiesPanel element={selectedElement} />
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (event: any) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      updateElement(selectedElement.id, { src: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="w-full py-1.5 flex items-center justify-center gap-1 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-[10px] font-bold text-on-surface-variant hover:text-on-surface rounded-lg transition duration-150"
            >
              Replace Image
            </button>
          </div>
        )}

        {/* Shape Specific Properties */}
        {selectedElement.type === 'shape' && (
          <div className={`${blockClass} space-y-4 ${layoutMode === 'horizontal' ? '' : 'border-t border-outline-variant/30 pt-4'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Shape Details</span>

            {/* Shape Type Selector */}
            <div>
              <label className="text-[9px] text-on-surface-variant block mb-1.5">Change Shape</label>
              <ShapePicker />
            </div>

            <div>
              <label className="text-[9px] text-on-surface-variant block mb-1">Border Weight ({selectedElement.strokeWidth || 2}px)</label>
              <input
                type="range"
                min="1"
                max="12"
                value={selectedElement.strokeWidth || 2}
                onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            {/* Dashed Border */}
            <div>
              <label className="text-[9px] text-on-surface-variant block mb-1.5">Border Style</label>
              <div className="flex gap-1.5">
                {[
                  { label: 'Solid', dash: undefined },
                  { label: 'Dashed', dash: [6, 4] },
                  { label: 'Dotted', dash: [2, 3] },
                ].map(opt => {
                  const isActive = JSON.stringify(selectedElement.borderDash) === JSON.stringify(opt.dash);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => updateElement(selectedElement.id, { borderDash: opt.dash as any })}
                      className={`flex-1 py-1 rounded border text-[9px] font-semibold transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Stroke Color</label>
              <AdvancedColorPicker 
                value={selectedElement.strokeColor || '#000000'} 
                onChange={(c) => updateElement(selectedElement.id, { strokeColor: c })} 
                presets={presetColors} 
                allowTransparent 
              />
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 block mb-1">Fill Color</label>
              <AdvancedColorPicker 
                value={selectedElement.fillColor || 'transparent'} 
                onChange={(c) => updateElement(selectedElement.id, { fillColor: c })} 
                presets={presetColors} 
                allowTransparent 
              />
            </div>
          </div>
        )}

        {/* Shape Picker */}
        <div className="border-t border-outline-variant/30 pt-4 mt-4">
          <div className="flex items-center gap-2 text-on-surface mb-3">
            <Square size={13} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Shape Library</span>
          </div>
          <ShapePicker />
        </div>
      </div>
    </aside>
  );
};
export default SidebarRight;
