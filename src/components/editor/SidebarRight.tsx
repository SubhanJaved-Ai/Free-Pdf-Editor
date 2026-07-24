'use client';

import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { ImagePropertiesPanel } from './ImagePropertiesPanel';
import { ShapePicker } from './ShapePicker';
import { DrawingToolsPanel } from './DrawingToolsPanel';
import { ColorPicker } from './ColorPicker';
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
  Trash2,
  Sliders,
  Palette,
  Image as ImageIcon,
  Square,
  Pencil,
  X,
  ChevronDown,
  ChevronRight,
  Move,
  Copy,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  defaultOpen = true,
  badge,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-outline-variant/30 rounded-2xl bg-surface-container-lowest/80 overflow-hidden transition-all shadow-2xs ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-container/30 hover:bg-surface-container/60 transition-colors select-none group"
      >
        <div className="flex items-center gap-2.5 text-on-surface">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <Icon size={14} />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase">{title}</span>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        <div className="text-on-surface-variant/70 group-hover:text-on-surface transition-colors p-1 rounded-md">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-outline-variant/20">
          {children}
        </div>
      )}
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
    '#ec4899',
    '#6366f1',
    '#14b8a6',
  ];

  const handleLayerUp = () => {
    if (!selectedElement) return;
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === elements.length - 1) return;
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index + 1];
    newElements[index + 1] = temp;
    useEditorStore.setState({ elements: newElements });
  };

  const handleLayerDown = () => {
    if (!selectedElement) return;
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === 0) return;
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index - 1];
    newElements[index - 1] = temp;
    useEditorStore.setState({ elements: newElements });
  };

  const isMobileOpen = mobileSidebarOpen === 'right';
  const mobileClasses = isMobileOpen 
    ? 'fixed inset-y-0 right-0 z-50 shadow-2xl translate-x-0 transition-transform bg-surface' 
    : 'hidden md:flex md:relative md:translate-x-0';
  const asideStyle = layoutMode === 'horizontal' ? {} : { width: `${rightSidebarWidth}px` };

  // IF NO ELEMENT IS SELECTED -> Render Inspector Workspace Defaults & Shape Library
  if (!selectedElement) {
    return (
      <aside 
        className={`${mobileClasses} ${
          layoutMode === 'horizontal' 
            ? 'flex-1 h-full flex flex-col min-w-0 p-4 border-l' 
            : 'h-[calc(100vh-4rem)] bg-surface border-l p-4'
        } border-outline-variant/30 z-30 select-none overflow-y-auto max-w-full custom-scrollbar`}
        style={asideStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/30 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5 text-on-surface">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sliders size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">Inspector</h2>
              <p className="text-[10px] text-on-surface-variant">Workspace defaults & shape tools</p>
            </div>
          </div>
          {isMobileOpen && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
              aria-label="Close panel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Active Drawing Tool Inspector */}
          {(activeTool === 'draw' || activeTool === 'erase') && (
            <CollapsibleSection title="Drawing Tools" icon={Pencil} defaultOpen={true}>
              <DrawingToolsPanel />
            </CollapsibleSection>
          )}

          {/* Default Text & Shape Stylings */}
          <CollapsibleSection title="Workspace Defaults" icon={Settings} defaultOpen={true}>
            <div>
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1.5">
                Default Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface p-2.5 rounded-xl focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {fontFamilies.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <ColorPicker 
                label="Default Text Color" 
                value={textColor} 
                onChange={setTextColor} 
                presets={presetColors} 
              />
            </div>

            <div className="border-t border-outline-variant/20 pt-3 space-y-3">
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant mb-1.5">
                  <span>Shape Stroke Width</span>
                  <span className="text-primary font-mono">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
              </div>

              <div>
                <ColorPicker 
                  label="Shape Stroke Color" 
                  value={strokeColor} 
                  onChange={setStrokeColor} 
                  presets={presetColors} 
                />
              </div>

              <div>
                <ColorPicker 
                  label="Shape Fill Color" 
                  value={fillColor} 
                  onChange={setFillColor} 
                  presets={presetColors} 
                  allowTransparent 
                />
              </div>
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
      className={`${mobileClasses} ${
        layoutMode === 'horizontal' 
          ? 'flex-1 h-full flex flex-col min-w-0 p-4 border-l' 
          : 'h-[calc(100vh-4rem)] bg-surface border-l p-4'
      } border-outline-variant/30 z-30 select-none overflow-y-auto max-w-full custom-scrollbar`}
      style={asideStyle}
    >
      {/* Header / Selection Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/30 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 text-on-surface min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <SlidersHorizontal size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface truncate">
              {selectedElement.type} Properties
            </h2>
            <span className="text-[10px] text-on-surface-variant block truncate">
              ID: {selectedElement.id}
            </span>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-1">
          {/* Quick Duplicate */}
          <button
            type="button"
            onClick={() => {
              addElement({
                ...selectedElement,
                x: Math.min(selectedElement.x + 3, 90),
                y: Math.min(selectedElement.y + 3, 90),
              });
            }}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-95 transition-all border border-outline-variant/30"
            title="Duplicate Element"
          >
            <Copy size={14} />
          </button>

          {/* Quick Delete */}
          <button
            type="button"
            onClick={() => deleteElement(selectedElement.id)}
            className="p-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 active:scale-95 transition-all border border-outline-variant/30"
            title="Delete Element"
          >
            <Trash2 size={14} />
          </button>

          {isMobileOpen && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(null)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant"
              aria-label="Close panel"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* SECTION: TEXT TYPOGRAPHY */}
        {selectedElement.type === 'text' && (
          <CollapsibleSection title="Typography" icon={Type} defaultOpen={true}>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Helvetica'}
                onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface p-2.5 rounded-xl focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {fontFamilies.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                <span>Font Size</span>
                <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {selectedElement.fontSize || 14}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="6"
                  max="96"
                  value={selectedElement.fontSize || 14}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                  className="flex-1 accent-primary h-1.5 cursor-pointer"
                />
                <input
                  type="number"
                  min="6"
                  max="200"
                  value={selectedElement.fontSize || 14}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: Math.max(parseFloat(e.target.value) || 6, 6) })}
                  className="w-14 bg-surface-container border border-outline-variant/30 text-xs font-mono font-bold text-on-surface p-1.5 rounded-lg text-center focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Font Style</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    selectedElement.fontWeight === 'bold' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs' 
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Bold"
                >
                  <Bold size={14} />
                  <span>Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    selectedElement.fontStyle === 'italic' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs' 
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Italic"
                >
                  <Italic size={14} />
                  <span>Italic</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    selectedElement.textDecoration === 'underline' 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs' 
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Underline"
                >
                  <Underline size={14} />
                  <span>Underline</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Text Alignment</label>
              <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/30">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => {
                  const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;
                  const isActive = selectedElement.align === align;
                  return (
                    <button
                      key={align}
                      type="button"
                      onClick={() => updateElement(selectedElement.id, { align })}
                      className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-all ${
                        isActive ? 'bg-surface text-primary shadow-2xs font-bold' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      title={`Align ${align}`}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct HEX Text Color Picker */}
            <div>
              <ColorPicker 
                label="Text Color" 
                value={selectedElement.color || '#000000'} 
                onChange={(c) => updateElement(selectedElement.id, { color: c })} 
                presets={presetColors} 
              />
            </div>
          </CollapsibleSection>
        )}

        {/* SECTION: IMAGE / SIGNATURE ADJUSTMENTS */}
        {(selectedElement.type === 'image' || selectedElement.type === 'signature') && (
          <CollapsibleSection title="Image & Filters" icon={ImageIcon} defaultOpen={true}>
            <ImagePropertiesPanel element={selectedElement} />
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (event: Event) => {
                  const target = event.target as HTMLInputElement;
                  const file = target.files?.[0];
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
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high active:scale-98 text-xs font-bold text-on-surface rounded-xl transition-all shadow-2xs mt-2"
            >
              <ImageIcon size={15} className="text-primary" />
              <span>Replace Image File</span>
            </button>
          </CollapsibleSection>
        )}

        {/* SECTION: SHAPE & BORDER */}
        {selectedElement.type === 'shape' && (
          <CollapsibleSection title="Shape & Border" icon={Square} defaultOpen={true}>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Change Shape</label>
              <ShapePicker />
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                <span>Border Weight</span>
                <span className="text-primary font-mono">{selectedElement.strokeWidth || 2}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={selectedElement.strokeWidth || 2}
                onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-full accent-primary h-1.5 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Border Pattern</label>
              <div className="flex gap-2">
                {[
                  { label: 'Solid', dash: undefined },
                  { label: 'Dashed', dash: [6, 4] },
                  { label: 'Dotted', dash: [2, 3] },
                ].map(opt => {
                  const isActive = JSON.stringify(selectedElement.borderDash) === JSON.stringify(opt.dash);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => updateElement(selectedElement.id, { borderDash: opt.dash as any })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary/40 text-primary shadow-2xs'
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

        {/* SECTION: STROKE & FILL COLORS (SHAPES & DRAWINGS) */}
        {(selectedElement.type === 'shape' || selectedElement.type === 'drawing') && (
          <CollapsibleSection title="Colors & Fill" icon={Palette} defaultOpen={true}>
            <div>
              <ColorPicker 
                label="Stroke Color" 
                value={selectedElement.strokeColor || '#000000'} 
                onChange={(c) => updateElement(selectedElement.id, { strokeColor: c })} 
                presets={presetColors} 
                allowTransparent 
              />
            </div>

            <div>
              <ColorPicker 
                label="Fill Color" 
                value={selectedElement.fillColor || 'transparent'} 
                onChange={(c) => updateElement(selectedElement.id, { fillColor: c })} 
                presets={presetColors} 
                allowTransparent 
              />
            </div>
          </CollapsibleSection>
        )}

        {/* SECTION: TRANSFORM & POSITION */}
        <CollapsibleSection title="Transform & Position" icon={Move} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Width (px)</span>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement(selectedElement.id, { width: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-mono font-bold text-on-surface p-2 rounded-xl focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Height (px)</span>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement(selectedElement.id, { height: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-surface-container border border-outline-variant/30 text-xs font-mono font-bold text-on-surface p-2 rounded-xl focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              <span>Rotation</span>
              <span className="text-primary font-mono">{selectedElement.rotation || 0}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedElement.rotation || 0}
              onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
              className="w-full accent-primary h-1.5 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              <span>Opacity</span>
              <span className="text-primary font-mono">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((selectedElement.opacity || 1) * 100)}
              onChange={(e) => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
              className="w-full accent-primary h-1.5 cursor-pointer"
            />
          </div>
        </CollapsibleSection>

        {/* SECTION: LAYER & DEPTH */}
        <CollapsibleSection title="Layering & Depth" icon={Layers} defaultOpen={false}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLayerUp}
              className="flex-1 py-2 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center gap-1.5"
              title="Bring Forward"
            >
              <ArrowUp size={14} className="text-primary" />
              <span>Bring Forward</span>
            </button>
            <button
              type="button"
              onClick={handleLayerDown}
              className="flex-1 py-2 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center gap-1.5"
              title="Send Backward"
            >
              <ArrowDown size={14} className="text-primary" />
              <span>Send Backward</span>
            </button>
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
};

export default SidebarRight;
