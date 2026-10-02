'use client';

import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { ImagePropertiesPanel } from './ImagePropertiesPanel';
import { ShapePicker } from './ShapePicker';
import { DrawingToolsPanel } from './DrawingToolsPanel';
import { ColorPicker } from './ColorPicker';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Trash2,
  Image as ImageIcon,
  Square,
  Pencil,
  X,
  Move,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  MousePointer2,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Section divider with optional label */
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 pt-1 pb-0.5">
    <span className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-widest whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-outline-variant/20" />
  </div>
);

/** Thin horizontal rule between sections */
const Divider = () => <div className="h-px bg-outline-variant/20 my-1" />;

// ─── Font families list ───────────────────────────────────────────────────────
const FONT_FAMILIES = [
  'Arial', 'Calibri', 'Cambria', 'Courier New', 'Dancing Script',
  'Garamond', 'Georgia', 'Helvetica', 'Inter', 'Lato', 'Libre Baskerville',
  'Lora', 'Merriweather', 'Montserrat', 'Nunito', 'Open Sans', 'Oswald',
  'Palatino', 'Pacifico', 'Playfair Display', 'Poppins', 'PT Sans',
  'Raleway', 'Roboto', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
  'Ubuntu', 'Verdana',
];

const PRESET_COLORS = [
  '#000000', '#ffffff', '#475569', '#2563eb',
  '#059669', '#dc2626', '#d97706', '#7c3aed',
  '#0891b2', '#ec4899', '#6366f1', '#14b8a6',
];

// ─── Sidebar header ───────────────────────────────────────────────────────────
const SidebarHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isMobileOpen: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
}> = ({ icon, title, subtitle, isMobileOpen, onClose, actions }) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-outline-variant/20 flex-shrink-0">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <h2 className="text-[11px] font-bold text-on-surface tracking-wide truncate">{title}</h2>
        <p className="text-[9px] text-on-surface-variant/70 truncate">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {actions}
      {isMobileOpen && (
        <button
          type="button"
          onClick={onClose}
          className="md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
          aria-label="Close panel"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  </div>
);

// ─── Empty State (nothing selected) ──────────────────────────────────────────
const EmptyState: React.FC<{ activeTool: string }> = ({ activeTool }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary/60">
      <MousePointer2 size={22} strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-sm font-semibold text-on-surface/70 mb-1">Nothing selected</p>
      <p className="text-[11px] text-on-surface-variant/60 leading-relaxed max-w-[180px]">
        {activeTool === 'text'
          ? 'Click on the page to add a text box, or click existing text to edit it.'
          : activeTool === 'shape'
          ? 'Click on the page to place a shape.'
          : 'Click any element on the document to see its properties here.'}
      </p>
    </div>
  </div>
);

// ─── Transform & Layer section (shared by all element types) ─────────────────
const TransformSection: React.FC<{ selectedElement: any; updateElement: any; elements: any[]; }> = ({
  selectedElement,
  updateElement,
  elements,
}) => {
  const handleLayerUp = () => {
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === elements.length - 1) return;
    const newElements = [...elements];
    [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    useEditorStore.setState({ elements: newElements });
  };

  const handleLayerDown = () => {
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === 0) return;
    const newElements = [...elements];
    [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    useEditorStore.setState({ elements: newElements });
  };

  return (
    <div className="space-y-3">
      <SectionLabel label="Position & Size" />

      {/* W/H row */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'W', key: 'width' },
          { label: 'H', key: 'height' },
        ].map(({ label, key }) => (
          <div key={key}>
            <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block mb-1">{label}</span>
            <div className="flex items-center bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <input
                type="number"
                value={Math.round((selectedElement as any)[key])}
                onChange={(e) => updateElement(selectedElement.id, { [key]: Math.max(parseFloat(e.target.value) || 1, 1) })}
                className="w-full bg-transparent text-xs font-mono font-semibold text-on-surface px-2 py-1.5 focus:outline-none"
              />
              <span className="text-[9px] text-on-surface-variant/50 pr-2 flex-shrink-0">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rotation */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">Rotation</span>
          <span className="text-[10px] font-mono font-bold text-primary">{selectedElement.rotation || 0}°</span>
        </div>
        <input
          type="range" min="0" max="360"
          value={selectedElement.rotation || 0}
          onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
          className="w-full accent-primary h-1 cursor-pointer rounded-full"
        />
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">Opacity</span>
          <span className="text-[10px] font-mono font-bold text-primary">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
        </div>
        <input
          type="range" min="0" max="100"
          value={Math.round((selectedElement.opacity || 1) * 100)}
          onChange={(e) => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
          className="w-full accent-primary h-1 cursor-pointer rounded-full"
        />
      </div>

      <Divider />
      <SectionLabel label="Layer Order" />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button" onClick={handleLayerUp}
          className="py-2 flex items-center justify-center gap-1.5 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-xl transition-all active:scale-95"
        >
          <ArrowUp size={13} className="text-primary" /> Forward
        </button>
        <button
          type="button" onClick={handleLayerDown}
          className="py-2 flex items-center justify-center gap-1.5 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-xl transition-all active:scale-95"
        >
          <ArrowDown size={13} className="text-primary" /> Backward
        </button>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const SidebarRight: React.FC = () => {
  const {
    elements,
    selectedElementIds,
    updateElement,
    smartReplaceImage,
    deleteElement,
    addElement,
    restoreElement,
    activeTool,
    layoutMode,
    rightSidebarWidth,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useEditorStore();

  const selectedElement = elements.find(el => selectedElementIds.includes(el.id) && !el.isDeleted);

  const isMobileOpen = mobileSidebarOpen === 'right';
  const mobileClasses = isMobileOpen
    ? 'fixed inset-y-0 right-0 z-50 shadow-2xl translate-x-0 transition-transform bg-surface'
    : 'hidden md:flex md:relative md:translate-x-0';
  const asideStyle = layoutMode === 'horizontal' ? {} : { width: `${rightSidebarWidth}px` };

  const closePanel = () => setMobileSidebarOpen(null);

  // ── Quick action buttons shown in header when element selected ──────────────
  const elementQuickActions = selectedElement ? (
    <>
      {/* Duplicate */}
      <button
        type="button"
        onClick={() => addElement({ ...selectedElement, x: Math.min(selectedElement.x + 3, 90), y: Math.min(selectedElement.y + 3, 90) })}
        className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/30 active:scale-95 transition-all"
        title="Duplicate"
      >
        <Copy size={13} />
      </button>
      {/* Restore (original PDF elements only) */}
      {selectedElement.isOriginalPdfElement && selectedElement.isModified && (
        <button
          type="button"
          onClick={() => restoreElement(selectedElement.id)}
          className="p-1.5 rounded-lg bg-surface-container hover:bg-emerald-500/10 text-on-surface-variant hover:text-emerald-500 border border-outline-variant/30 active:scale-95 transition-all"
          title="Restore to original"
        >
          <RotateCcw size={13} />
        </button>
      )}
      {/* Delete */}
      <button
        type="button"
        onClick={() => deleteElement(selectedElement.id)}
        className="p-1.5 rounded-lg bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error border border-outline-variant/30 active:scale-95 transition-all"
        title="Delete element"
      >
        <Trash2 size={13} />
      </button>
    </>
  ) : null;

  // ── STATE 5: Draw tool active ───────────────────────────────────────────────
  if (activeTool === 'draw' || activeTool === 'erase') {
    return (
      <aside
        className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 border-l' : 'h-[calc(100vh-4rem)] bg-surface border-l flex flex-col'} border-outline-variant/30 z-30 select-none overflow-hidden max-w-full`}
        style={asideStyle}
      >
        <SidebarHeader
          icon={<Pencil size={15} />}
          title="Drawing Tools"
          subtitle={activeTool === 'erase' ? 'Eraser mode' : 'Pen mode active'}
          isMobileOpen={isMobileOpen}
          onClose={closePanel}
        />
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <DrawingToolsPanel />
        </div>
      </aside>
    );
  }

  // ── STATE 6: Shape tool active, nothing selected ────────────────────────────
  if (activeTool === 'shape' && !selectedElement) {
    return (
      <aside
        className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 border-l' : 'h-[calc(100vh-4rem)] bg-surface border-l flex flex-col'} border-outline-variant/30 z-30 select-none overflow-hidden max-w-full`}
        style={asideStyle}
      >
        <SidebarHeader
          icon={<Square size={15} />}
          title="Shape Library"
          subtitle="Pick a shape to place"
          isMobileOpen={isMobileOpen}
          onClose={closePanel}
        />
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <ShapePicker />
        </div>
      </aside>
    );
  }

  // ── STATE 0: Nothing selected, no special tool ──────────────────────────────
  if (!selectedElement) {
    return (
      <aside
        className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 border-l' : 'h-[calc(100vh-4rem)] bg-surface border-l flex flex-col'} border-outline-variant/30 z-30 select-none overflow-hidden max-w-full`}
        style={asideStyle}
      >
        <SidebarHeader
          icon={<Sparkles size={15} />}
          title="Properties"
          subtitle="Select an element to edit"
          isMobileOpen={isMobileOpen}
          onClose={closePanel}
        />
        <EmptyState activeTool={activeTool} />
      </aside>
    );
  }

  // ── ELEMENT SELECTED: header is always shown ────────────────────────────────
  const typeLabel =
    selectedElement.type === 'text' ? 'Text'
    : selectedElement.type === 'image' ? 'Image'
    : selectedElement.type === 'signature' ? 'Signature'
    : selectedElement.type === 'shape' ? 'Shape'
    : selectedElement.type === 'drawing' ? 'Drawing'
    : 'Element';

  const typeIcon =
    selectedElement.type === 'text' ? <Type size={15} />
    : selectedElement.type === 'image' || selectedElement.type === 'signature' ? <ImageIcon size={15} />
    : selectedElement.type === 'shape' ? <Square size={15} />
    : <Pencil size={15} />;

  return (
    <aside
      className={`${mobileClasses} ${layoutMode === 'horizontal' ? 'flex-1 h-full flex flex-col min-w-0 border-l' : 'h-[calc(100vh-4rem)] bg-surface border-l flex flex-col'} border-outline-variant/30 z-30 select-none overflow-hidden max-w-full`}
      style={asideStyle}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <SidebarHeader
        icon={typeIcon}
        title={`${typeLabel} Properties`}
        subtitle={selectedElement.isOriginalPdfElement ? 'Original PDF element' : 'Added element'}
        isMobileOpen={isMobileOpen}
        onClose={closePanel}
        actions={elementQuickActions}
      />

      {/* ── Scrollable property panels ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* ── STATE 1: TEXT ─────────────────────────────────────────────────── */}
        {selectedElement.type === 'text' && (() => {
          const baseFonts = [...FONT_FAMILIES];
          if (selectedElement.fontFamily && !baseFonts.includes(selectedElement.fontFamily)) {
            baseFonts.push(selectedElement.fontFamily);
          }
          const sortedFonts = [...new Set(baseFonts)].sort();

          return (
            <div className="space-y-4">
              {/* Font family */}
              <div>
                <SectionLabel label="Typography" />
                <div className="mt-2 space-y-3">
                  <div>
                    <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block mb-1.5">Font</span>
                    <select
                      value={selectedElement.fontFamily || 'Helvetica'}
                      onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                      className="w-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface px-3 py-2 rounded-xl focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                      style={{ fontFamily: selectedElement.fontFamily || 'Helvetica' }}
                    >
                      {sortedFonts.map(f => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">Size</span>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{selectedElement.fontSize || 14}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="6" max="96"
                        value={selectedElement.fontSize || 14}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="flex-1 accent-primary h-1 cursor-pointer rounded-full"
                      />
                      <input
                        type="number" min="6" max="200"
                        value={selectedElement.fontSize || 14}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Math.max(parseFloat(e.target.value) || 6, 6) })}
                        className="w-14 bg-surface-container border border-outline-variant/30 text-xs font-mono font-bold text-on-surface px-2 py-1.5 rounded-lg text-center focus:outline-none focus:border-primary/60 transition-all"
                      />
                    </div>
                  </div>

                  {/* B / I / U row */}
                  <div>
                    <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block mb-1.5">Style</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Bold', icon: <Bold size={14} />, key: 'fontWeight', on: 'bold', off: 'normal', active: selectedElement.fontWeight === 'bold' },
                        { label: 'Italic', icon: <Italic size={14} />, key: 'fontStyle', on: 'italic', off: 'normal', active: selectedElement.fontStyle === 'italic' },
                        { label: 'Underline', icon: <Underline size={14} />, key: 'textDecoration', on: 'underline', off: 'none', active: selectedElement.textDecoration === 'underline' },
                      ].map(({ label, icon, key, on, off, active }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateElement(selectedElement.id, { [key]: active ? off : on })}
                          className={`py-2 flex items-center justify-center gap-1 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                              : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                          }`}
                          title={label}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alignment */}
                  <div>
                    <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block mb-1.5">Alignment</span>
                    <div className="flex bg-surface-container rounded-xl border border-outline-variant/30 p-0.5">
                      {([
                        { val: 'left', icon: <AlignLeft size={14} /> },
                        { val: 'center', icon: <AlignCenter size={14} /> },
                        { val: 'right', icon: <AlignRight size={14} /> },
                        { val: 'justify', icon: <AlignJustify size={14} /> },
                      ] as const).map(({ val, icon }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateElement(selectedElement.id, { align: val })}
                          className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-all ${
                            selectedElement.align === val
                              ? 'bg-surface text-primary shadow-sm font-bold'
                              : 'text-on-surface-variant/70 hover:text-on-surface'
                          }`}
                          title={`Align ${val}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text color */}
                  <ColorPicker
                    label="Text Color"
                    value={selectedElement.color || '#000000'}
                    onChange={(c) => updateElement(selectedElement.id, { color: c })}
                    presets={PRESET_COLORS}
                  />
                </div>
              </div>

              <Divider />
              <TransformSection selectedElement={selectedElement} updateElement={updateElement} elements={elements} />
            </div>
          );
        })()}

        {/* ── STATE 2: IMAGE / SIGNATURE ───────────────────────────────────── */}
        {(selectedElement.type === 'image' || selectedElement.type === 'signature') && (
          <div className="space-y-4">
            <SectionLabel label="Image" />
            <ImagePropertiesPanel element={selectedElement} />

            {/* Replace image button */}
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
                    reader.onload = () => smartReplaceImage(selectedElement.id, reader.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-bold text-on-surface rounded-xl transition-all active:scale-98"
            >
              <ImageIcon size={14} className="text-primary" />
              Replace Image File
            </button>

            <Divider />
            <TransformSection selectedElement={selectedElement} updateElement={updateElement} elements={elements} />
          </div>
        )}

        {/* ── STATE 3: SHAPE ───────────────────────────────────────────────── */}
        {selectedElement.type === 'shape' && (
          <div className="space-y-4">
            <SectionLabel label="Shape" />

            {/* Stroke weight */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">Border Weight</span>
                <span className="text-[10px] font-mono font-bold text-primary">{selectedElement.strokeWidth || 2}px</span>
              </div>
              <input
                type="range" min="0" max="16"
                value={selectedElement.strokeWidth || 2}
                onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-full accent-primary h-1 cursor-pointer rounded-full"
              />
            </div>

            {/* Border pattern */}
            <div>
              <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block mb-1.5">Border Pattern</span>
              <div className="flex gap-2">
                {[
                  { label: 'Solid', dash: undefined },
                  { label: 'Dashed', dash: [6, 4] },
                  { label: 'Dotted', dash: [2, 3] },
                ].map((opt) => {
                  const isActive = JSON.stringify(selectedElement.borderDash) === JSON.stringify(opt.dash);
                  return (
                    <button
                      key={opt.label} type="button"
                      onClick={() => updateElement(selectedElement.id, { borderDash: opt.dash as any })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stroke color */}
            <ColorPicker
              label="Stroke Color"
              value={selectedElement.strokeColor || '#000000'}
              onChange={(c) => updateElement(selectedElement.id, { strokeColor: c })}
              presets={PRESET_COLORS}
              allowTransparent
            />

            {/* Fill color */}
            <ColorPicker
              label="Fill Color"
              value={selectedElement.fillColor || 'transparent'}
              onChange={(c) => updateElement(selectedElement.id, { fillColor: c })}
              presets={PRESET_COLORS}
              allowTransparent
            />

            <Divider />
            {/* Change shape */}
            <SectionLabel label="Change Shape" />
            <ShapePicker />

            <Divider />
            <TransformSection selectedElement={selectedElement} updateElement={updateElement} elements={elements} />
          </div>
        )}

        {/* ── STATE 4: DRAWING ─────────────────────────────────────────────── */}
        {selectedElement.type === 'drawing' && (
          <div className="space-y-4">
            <SectionLabel label="Drawing" />
            <ColorPicker
              label="Stroke Color"
              value={selectedElement.strokeColor || '#000000'}
              onChange={(c) => updateElement(selectedElement.id, { strokeColor: c })}
              presets={PRESET_COLORS}
            />
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">Stroke Width</span>
                <span className="text-[10px] font-mono font-bold text-primary">{selectedElement.strokeWidth || 2}px</span>
              </div>
              <input
                type="range" min="1" max="20"
                value={selectedElement.strokeWidth || 2}
                onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                className="w-full accent-primary h-1 cursor-pointer rounded-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">Opacity</span>
                <span className="text-[10px] font-mono font-bold text-primary">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={Math.round((selectedElement.opacity || 1) * 100)}
                onChange={(e) => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-primary h-1 cursor-pointer rounded-full"
              />
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};

export default SidebarRight;
