'use client';

import React, { useState } from 'react';
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
  Sliders,
  Palette,
  Image as ImageIcon,
  Square,
  Pencil,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Move,
  RotateCw,
  Eye,
  Copy
} from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  defaultOpen = true,
  badge,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-outline-variant/30 rounded-xl bg-surface-container-lowest/60 overflow-hidden transition-all shadow-2xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-container/40 hover:bg-surface-container/80 transition-colors select-none group"
      >
        <div className="flex items-center gap-2 text-on-surface">
          <Icon size={14} className="text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold tracking-wide uppercase">{title}</span>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        <div className="text-on-surface-variant/70 group-hover:text-on-surface transition-colors">
          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-3.5 space-y-3.5 border-t border-outline-variant/20">
          {children}
        </div>
      )}
    </div>
  );
};

const AdvancedColorPicker = ({ 
  value, 
  onChange, 
  presets, 
  allowTransparent = false 
}: { 
  value: string; 
  onChange: (c: string) => void; 
  presets: string[]; 
  allowTransparent?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 bg-surface-container/50 p-1.5 rounded-lg border border-outline-variant/30">
        <div 
          className="relative w-7 h-7 rounded-md shadow-xs border border-outline-variant/50 overflow-hidden flex-shrink-0" 
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
            title="Custom Color Picker"
          />
        </div>
        
        <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
          <input 
            type="text"
            value={value === 'transparent' ? 'TRANSPARENT' : value.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'transparent' || val.startsWith('#')) {
                onChange(val);
              }
            }}
            className="text-[11px] font-mono font-bold text-on-surface bg-transparent border-none p-0 focus:outline-none w-24"
          />

          {allowTransparent && (
            <button
              onClick={() => onChange(value === 'transparent' ? '#000000' : 'transparent')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                value === 'transparent' 
                  ? 'border-primary text-primary bg-primary/10' 
                  : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              None
            </button>
          )}
        </div>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-9 gap-1 pt-1">
        {presets.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-5 h-5 rounded-md border transition-all ${
              value === c 
                ? 'border-primary scale-110 shadow-sm ring-1 ring-primary/40' 
                : 'border-outline-variant/30 hover:scale-105'
            }`}
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
    smartReplaceImage,
    deleteElement,
    addElement,
    textColor,
    setTextColor,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    activeTool,
    layoutMode,
    rightSidebarWidth,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useEditorStore();

  const selectedElement = elements.find(el => selectedElementIds.includes(el.id));

  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Playfair Display', label: 'Playfair Display' },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const presetColors = [
    '#000000',
    '#ffffff',
    '#475569',
    '#2563eb',
    '#059669',
    '#dc2626',
    '#d97706',
    '#7c3aed',
    '#0891b2',
  ];

  const isMobileOpen = mobileSidebarOpen === 'right';
  const mobileClasses = isMobileOpen 
    ? 'fixed inset-y-0 right-0 z-50 shadow-2xl translate-x-0 transition-transform bg-surface' 
    : 'hidden md:flex md:relative md:translate-x-0';
  const asideStyle = layoutMode === 'horizontal' ? {} : { width: `${rightSidebarWidth}px` };

  // If no element selected, render Workspace Defaults & Shape Library inspector
  if (!selectedElement) {
    return (
      <aside 
        className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 p-3.5 border-l' : 'h-[calc(100vh-4rem)] bg-surface border-l p-3.5'} border-outline-variant/30 z-30 select-none overflow-y-auto max-w-full`}
        style={asideStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-on-surface">
            <Settings size={15} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Inspector</span>
          </div>
          {isMobileOpen && (
            <button
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
              aria-label="Close panel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          {/* Active Drawing Tool Inspector */}
          {(activeTool === 'draw' || activeTool === 'erase') && (
            <CollapsibleSection title="Drawing Tools" icon={Pencil} defaultOpen={true}>
              <DrawingToolsPanel />
            </CollapsibleSection>
          )}

          {/* Default Text Stylings */}
          <CollapsibleSection title="Workspace Defaults" icon={Settings} defaultOpen={true}>
            <div>
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Default Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface p-2 rounded-lg focus:outline-none focus:border-primary"
              >
                {fontFamilies.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Default Text Color</label>
              <AdvancedColorPicker value={textColor} onChange={setTextColor} presets={presetColors} />
            </div>

            <div className="border-t border-outline-variant/20 pt-3">
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Shape Stroke Width ({strokeWidth}px)</label>
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
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Shape Stroke Color</label>
              <AdvancedColorPicker value={strokeColor} onChange={setStrokeColor} presets={presetColors} />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Shape Fill Color</label>
              <AdvancedColorPicker value={fillColor} onChange={setFillColor} presets={presetColors} allowTransparent />
            </div>
          </CollapsibleSection>

          {/* Shape Library */}
          <CollapsibleSection title="Shape Library" icon={Square} defaultOpen={true}>
            <ShapePicker />
          </CollapsibleSection>
        </div>
      </aside>
    );
  }

  // ELEMENT SELECTED INSPECTOR
  return (
    <aside 
      className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 p-3.5 border-l' : 'h-[calc(100vh-4rem)] bg-surface border-l p-3.5'} border-outline-variant/30 z-30 select-none overflow-y-auto max-w-full`}
      style={asideStyle}
    >
      {/* Selection Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-on-surface min-w-0">
          <Sliders size={15} className="text-primary flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider truncate">
            {selectedElement.type} Properties
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Duplicate */}
          <button
            onClick={() => {
              addElement({
                ...selectedElement,
                x: Math.min(selectedElement.x + 3, 90),
                y: Math.min(selectedElement.y + 3, 90),
              });
            }}
            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition"
            title="Duplicate Element"
          >
            <Copy size={14} />
          </button>

          {/* Quick Delete */}
          <button
            onClick={() => deleteElement(selectedElement.id)}
            className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 transition"
            title="Delete Element"
          >
            <Trash2 size={14} />
          </button>

          {isMobileOpen && (
            <button
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant"
              aria-label="Close panel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3.5">
        {/* COLLAPSIBLE SECTION 1: Transform & Position */}
        <CollapsibleSection title="Transform & Position" icon={Move} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant block mb-1">Width (px)</span>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement(selectedElement.id, { width: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface p-1.5 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant block mb-1">Height (px)</span>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement(selectedElement.id, { height: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface p-1.5 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
              <span>Rotation</span>
              <span>{selectedElement.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedElement.rotation || 0}
              onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
              <span>Opacity</span>
              <span>{Math.round((selectedElement.opacity || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((selectedElement.opacity || 1) * 100)}
              onChange={(e) => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
              className="w-full accent-primary"
            />
          </div>
        </CollapsibleSection>

        {/* COLLAPSIBLE SECTION 2: Text Properties */}
        {selectedElement.type === 'text' && (
          <CollapsibleSection title="Typography" icon={Type} defaultOpen={true}>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Helvetica'}
                onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface p-2 rounded-lg focus:outline-none focus:border-primary"
              >
                {fontFamilies.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                <span>Font Size</span>
                <span>{selectedElement.fontSize || 14}px</span>
              </div>
              <input
                type="range"
                min="6"
                max="72"
                value={selectedElement.fontSize || 14}
                onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5">Style</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${
                    selectedElement.fontWeight === 'bold' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-xs' 
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${
                    selectedElement.fontStyle === 'italic' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-xs' 
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${
                    selectedElement.textDecoration === 'underline' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-xs' 
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Underline"
                >
                  <Underline size={14} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5">Alignment</label>
              <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant/30">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => {
                  const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;
                  const isActive = selectedElement.align === align;
                  return (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedElement.id, { align })}
                      className={`flex-1 py-1 flex justify-center rounded-md transition-all ${
                        isActive ? 'bg-surface text-primary shadow-xs font-bold' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Text Color</label>
              <AdvancedColorPicker 
                value={selectedElement.color || '#000000'} 
                onChange={(c) => updateElement(selectedElement.id, { color: c })} 
                presets={presetColors} 
              />
            </div>
          </CollapsibleSection>
        )}

        {/* COLLAPSIBLE SECTION 3: Image / Signature Adjustments */}
        {(selectedElement.type === 'image' || selectedElement.type === 'signature') && (
          <CollapsibleSection title="Image Adjustments" icon={ImageIcon} defaultOpen={true}>
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
                      smartReplaceImage(selectedElement.id, reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="w-full py-2 flex items-center justify-center gap-1.5 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-bold text-on-surface rounded-lg transition"
            >
              <ImageIcon size={14} />
              <span>Replace Image File</span>
            </button>
          </CollapsibleSection>
        )}

        {/* COLLAPSIBLE SECTION 4: Shape & Border */}
        {selectedElement.type === 'shape' && (
          <CollapsibleSection title="Shape & Border" icon={Square} defaultOpen={true}>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5">Change Shape</label>
              <ShapePicker />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                <span>Border Weight</span>
                <span>{selectedElement.strokeWidth || 2}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={selectedElement.strokeWidth || 2}
                onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5">Border Style</label>
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
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary/40 text-primary shadow-xs'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* COLLAPSIBLE SECTION 5: Stroke & Fill */}
        {(selectedElement.type === 'shape' || selectedElement.type === 'drawing') && (
          <CollapsibleSection title="Stroke & Fill" icon={Palette} defaultOpen={true}>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Stroke Color</label>
              <AdvancedColorPicker 
                value={selectedElement.strokeColor || '#000000'} 
                onChange={(c) => updateElement(selectedElement.id, { strokeColor: c })} 
                presets={presetColors} 
                allowTransparent 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Fill Color</label>
              <AdvancedColorPicker 
                value={selectedElement.fillColor || 'transparent'} 
                onChange={(c) => updateElement(selectedElement.id, { fillColor: c })} 
                presets={presetColors} 
                allowTransparent 
              />
            </div>
          </CollapsibleSection>
        )}
      </div>
    </aside>
  );
};

export default SidebarRight;
